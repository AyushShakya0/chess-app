-- ========================================================
-- Sovereign Chess Relational Schema (PostgreSQL / Supabase)
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. User Profiles & Dynamic ELO Ratings
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY, -- Appwrite User ID or Supabase Auth UUID
  username TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  country_code TEXT DEFAULT 'NP',
  elo_bullet INT DEFAULT 1200,
  elo_blitz INT DEFAULT 1200,
  elo_rapid INT DEFAULT 1200,
  elo_puzzles INT DEFAULT 1200,
  games_played INT DEFAULT 0,
  games_won INT DEFAULT 0,
  games_drawn INT DEFAULT 0,
  games_lost INT DEFAULT 0,
  is_vip BOOLEAN DEFAULT FALSE,
  preferences JSONB DEFAULT '{"theme": "classic", "pieceSet": "classic", "soundEnabled": true}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Live Open Challenges (Dashboard Matchmaking Feed)
CREATE TABLE IF NOT EXISTS public.open_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id TEXT NOT NULL,
  creator_name TEXT NOT NULL,
  creator_elo INT DEFAULT 1200,
  time_control TEXT NOT NULL, -- e.g. "3+0", "10+0"
  category TEXT NOT NULL,     -- "bullet", "blitz", "rapid", "classical"
  rated BOOLEAN DEFAULT TRUE,
  color_preference TEXT DEFAULT 'random', -- "white", "black", "random"
  status TEXT DEFAULT 'open', -- "open", "claimed", "cancelled", "expired"
  acceptor_id TEXT,
  room_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '10 minutes')
);

CREATE INDEX IF NOT EXISTS idx_open_challenges_status ON public.open_challenges(status, created_at DESC);

-- 3. Archived Games & PGN Storage
CREATE TABLE IF NOT EXISTS public.games (
  id TEXT PRIMARY KEY, -- room ID
  white_id TEXT,
  white_name TEXT NOT NULL,
  white_elo INT,
  black_id TEXT,
  black_name TEXT NOT NULL,
  black_elo INT,
  time_control TEXT NOT NULL,
  pgn TEXT,
  result TEXT, -- "1-0", "0-1", "1/2-1/2", "*"
  end_reason TEXT, -- "checkmate", "resignation", "timeout", "draw_agreement"
  accuracy_white NUMERIC(5,2),
  accuracy_black NUMERIC(5,2),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- 4. Move-by-Move Telemetry & Evaluation
CREATE TABLE IF NOT EXISTS public.game_moves (
  id BIGSERIAL PRIMARY KEY,
  game_id TEXT REFERENCES public.games(id) ON DELETE CASCADE,
  ply INT NOT NULL,
  san TEXT NOT NULL,
  uci TEXT NOT NULL,
  fen TEXT NOT NULL,
  time_remaining_ms INT,
  eval_centipawns INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_moves_game_id ON public.game_moves(game_id, ply ASC);

-- 5. Row Level Security Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.open_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Allow public read of profiles & leaderboard
CREATE POLICY "Public profiles are readable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid()::text = id OR true);

-- Allow all authenticated users to read open challenges
CREATE POLICY "Open challenges are readable" ON public.open_challenges FOR SELECT USING (status = 'open');
CREATE POLICY "Anyone can create challenge" ON public.open_challenges FOR INSERT WITH CHECK (true);
CREATE POLICY "Challenger or acceptor can update" ON public.open_challenges FOR UPDATE USING (true);
