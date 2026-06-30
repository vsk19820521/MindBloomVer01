-- ============================================================
-- Phase 6: Admin Dashboard — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Table for tracking puzzle reports by parents
CREATE TABLE IF NOT EXISTS public.puzzle_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL REFERENCES public.users(username),
  puzzle_id TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'reviewed', 'resolved'
  reported_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for tracking puzzle failures (analytics)
CREATE TABLE IF NOT EXISTS public.puzzle_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL REFERENCES public.users(username),
  puzzle_id TEXT NOT NULL,
  failed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes to speed up admin queries
CREATE INDEX IF NOT EXISTS idx_reports_puzzle ON public.puzzle_reports(puzzle_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.puzzle_reports(status);
CREATE INDEX IF NOT EXISTS idx_failures_puzzle ON public.puzzle_failures(puzzle_id);
CREATE INDEX IF NOT EXISTS idx_failures_user ON public.puzzle_failures(username);

-- RLS off for now
ALTER TABLE public.puzzle_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.puzzle_failures DISABLE ROW LEVEL SECURITY;

SELECT 'Admin tables created successfully' AS status;
