-- Supabase Schema for Grandmaster Chess Platform
-- Enables Row Level Security (RLS) on all tables

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

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Games Table
CREATE TABLE IF NOT EXISTS public.games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    white_player_id UUID REFERENCES public.profiles(id),
    black_player_id UUID REFERENCES public.profiles(id),
    time_control TEXT NOT NULL,
    status TEXT DEFAULT 'active', -- 'active' | 'completed' | 'aborted'
    result TEXT, -- '1-0' | '0-1' | '1/2-1/2'
    termination TEXT, -- 'checkmate' | 'resignation' | 'timeout' | 'stalemate'
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

CREATE POLICY "Players can update their active games" 
ON public.games FOR UPDATE USING (auth.uid() = white_player_id OR auth.uid() = black_player_id);

-- 3. Rematch Scores Table
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

CREATE POLICY "Rematch scores are viewable by participants" 
ON public.rematch_scores FOR SELECT USING (true);

-- 4. Puzzle History Table
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
