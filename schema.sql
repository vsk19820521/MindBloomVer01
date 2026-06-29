-- ============================================================
-- MindBloom — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Users table: one row per child profile
CREATE TABLE IF NOT EXISTS public.users (
  username        TEXT PRIMARY KEY,
  password_hash   TEXT NOT NULL,
  parent_code     TEXT NOT NULL DEFAULT '0000',
  parent_email    TEXT,
  parent_phone    TEXT,
  birth_month     SMALLINT,
  birth_year      SMALLINT,
  puzzle_band     TEXT NOT NULL DEFAULT '8-9',
  profile         JSONB NOT NULL DEFAULT '{}',
  -- profile stores: childFirstName, childLastName, childGender, childAge,
  --                 childAvatar, livingCountry, culturalAffiliation
  game_state      JSONB NOT NULL DEFAULT '{}',
  -- game_state stores: currentDay, unlockedUpToDay, lastActiveDate, coins,
  --                    level, levelName, theme, isMuted, completedPuzzles
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update the updated_at timestamp on every row change
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;
CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Index for fast username lookups (already covered by PK, but explicit)
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON public.users (username);

-- NOTE: Row Level Security (RLS) is intentionally OFF for now.
-- The service role key (used only in serverless functions) provides sufficient isolation.
-- Enable RLS later when adding JWT-based auth.
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Verify the table was created
SELECT 'users table created successfully' AS status;
