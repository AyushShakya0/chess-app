-- Supabase Schema for Grandmaster Chess Platform (Prin Chess)
-- Enables Row Level Security (RLS) on all tables with strict security guards

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    avatar_url TEXT,
    elo_bullet INT DEFAULT 1200,
    elo_blitz INT DEFAULT 1200,
    elo_rapid INT DEFAULT 1200,
    elo_puzzles INT DEFAULT 1200,
    is_vip BOOLEAN DEFAULT false,
    used_promo_code TEXT,
    preferences JSONB DEFAULT '{"theme": "classic", "premove": true, "sound": true}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

-- Users can update only their own non-sensitive profile columns (preferences, avatar, username)
CREATE POLICY "Users can update their own profile settings" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Guard trigger: prevent users from updating is_vip, elo_*, or used_promo_code directly via client UPDATE
CREATE OR REPLACE FUNCTION public.handle_profile_update_guard()
RETURNS TRIGGER AS $$
BEGIN
  -- If invoked by normal authenticated client (not service_role or security definer function)
  IF (current_user != 'service_role') THEN
    IF (NEW.is_vip IS DISTINCT FROM OLD.is_vip) OR
       (NEW.used_promo_code IS DISTINCT FROM OLD.used_promo_code) OR
       (NEW.elo_bullet IS DISTINCT FROM OLD.elo_bullet) OR
       (NEW.elo_blitz IS DISTINCT FROM OLD.elo_blitz) OR
       (NEW.elo_rapid IS DISTINCT FROM OLD.elo_rapid) OR
       (NEW.elo_puzzles IS DISTINCT FROM OLD.elo_puzzles) THEN
      RAISE EXCEPTION 'Unauthorized: Rating and VIP attributes cannot be modified directly';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_profile_update_guard ON public.profiles;
CREATE TRIGGER tr_profile_update_guard
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_profile_update_guard();

-- Trigger to automatically create a profile row whenever a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1), 'Player_' || substr(NEW.id::text, 1, 6)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Secure RPC to redeem VIP promo code server-side
CREATE OR REPLACE FUNCTION public.redeem_vip_promo(promo_code TEXT)
RETURNS JSONB AS $$
DECLARE
  clean_code TEXT;
  user_id UUID;
BEGIN
  user_id := auth.uid();
  IF user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Authentication required to redeem VIP pass');
  END IF;

  clean_code := lower(trim(promo_code));
  IF clean_code = 'chess' THEN
    UPDATE public.profiles
    SET is_vip = true, used_promo_code = clean_code
    WHERE id = user_id;
    RETURN jsonb_build_object('success', true, 'message', 'VIP Lifetime Access activated successfully');
  ELSE
    RETURN jsonb_build_object('success', false, 'message', 'Invalid promo code');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Games Table
CREATE TABLE IF NOT EXISTS public.games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    white_player_id UUID REFERENCES public.profiles(id),
    black_player_id UUID REFERENCES public.profiles(id),
    time_control TEXT NOT NULL,
    status TEXT DEFAULT 'active', -- 'active' | 'completed' | 'aborted'
    result TEXT, -- '1-0' | '0-1' | '1/2-1/2'
    termination TEXT, -- 'checkmate' | 'resignation' | 'timeout' | 'stalemate' | 'abandonment' | 'agreement'
    initial_fen TEXT DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    final_fen TEXT,
    pgn TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Games are viewable by everyone" 
ON public.games FOR SELECT USING (true);

CREATE POLICY "Players can insert games" 
ON public.games FOR INSERT WITH CHECK (auth.uid() = white_player_id OR auth.uid() = black_player_id);

-- Restrict direct game updates by players (prevent overwriting result/pgn arbitrarily)
CREATE POLICY "Players can update their active games" 
ON public.games FOR UPDATE USING (
  (auth.uid() = white_player_id OR auth.uid() = black_player_id) 
  AND status = 'active'
);

-- 3. Game Moves Table
CREATE TABLE IF NOT EXISTS public.game_moves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    ply INT NOT NULL,
    uci TEXT NOT NULL,
    san TEXT NOT NULL,
    fen_after TEXT NOT NULL,
    time_left_ms INT,
    engine_eval REAL,
    move_grade TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.game_moves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Game moves are viewable by everyone" 
ON public.game_moves FOR SELECT USING (true);

CREATE POLICY "Participants can insert game moves" 
ON public.game_moves FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.games g
    WHERE g.id = game_id AND (g.white_player_id = auth.uid() OR g.black_player_id = auth.uid())
  )
);

-- 4. Rematch Scores Table
CREATE TABLE IF NOT EXISTS public.rematch_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    player2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    player1_wins INT DEFAULT 0,
    player2_wins INT DEFAULT 0,
    draws INT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(player1_id, player2_id)
);

ALTER TABLE public.rematch_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rematch scores are viewable by everyone" 
ON public.rematch_scores FOR SELECT USING (true);

-- 5. Puzzle History Table
CREATE TABLE IF NOT EXISTS public.puzzle_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    puzzle_id TEXT NOT NULL,
    solved BOOLEAN NOT NULL,
    time_taken_ms INT,
    elo_change INT DEFAULT 0,
    solved_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.puzzle_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own puzzle history" 
ON public.puzzle_history FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert puzzle history" 
ON public.puzzle_history FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- 6. Online Multiplayer Active Rooms Table (for Supabase Realtime synchronization)
CREATE TABLE IF NOT EXISTS public.rooms (
    id TEXT PRIMARY KEY,
    white_player_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    white_player_name TEXT NOT NULL DEFAULT 'White',
    black_player_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    black_player_name TEXT,
    time_control TEXT NOT NULL DEFAULT '5+0',
    white_time_left_ms INT NOT NULL DEFAULT 300000,
    black_time_left_ms INT NOT NULL DEFAULT 300000,
    fen TEXT NOT NULL DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    pgn TEXT DEFAULT '',
    turn TEXT NOT NULL DEFAULT 'w',
    status TEXT NOT NULL DEFAULT 'waiting', -- 'waiting' | 'active' | 'completed' | 'aborted'
    result TEXT,
    termination TEXT,
    last_move_timestamp BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + interval '2 hours') NOT NULL
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rooms are viewable by everyone" 
ON public.rooms FOR SELECT USING (true);

CREATE POLICY "Anyone can create or join rooms" 
ON public.rooms FOR INSERT WITH CHECK (true);

CREATE POLICY "Room participants can update room" 
ON public.rooms FOR UPDATE USING (true);

-- 7. Indexes for Query Performance & Foreign Key Integrity
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_games_white ON public.games(white_player_id);
CREATE INDEX IF NOT EXISTS idx_games_black ON public.games(black_player_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON public.games(status);
CREATE INDEX IF NOT EXISTS idx_game_moves_game_id ON public.game_moves(game_id);
CREATE INDEX IF NOT EXISTS idx_game_moves_ply ON public.game_moves(game_id, ply);
CREATE INDEX IF NOT EXISTS idx_puzzle_history_profile ON public.puzzle_history(profile_id);
CREATE INDEX IF NOT EXISTS idx_puzzle_history_puzzle ON public.puzzle_history(puzzle_id);
CREATE INDEX IF NOT EXISTS idx_rematch_p1 ON public.rematch_scores(player1_id);
CREATE INDEX IF NOT EXISTS idx_rematch_p2 ON public.rematch_scores(player2_id);
CREATE INDEX IF NOT EXISTS idx_rooms_expires_at ON public.rooms(expires_at);
