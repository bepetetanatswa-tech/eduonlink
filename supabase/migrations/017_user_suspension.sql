-- ═══════════════════════════════════════════════════════════════
-- VOA — Migration 017: Account suspension
-- Run this in: Supabase Dashboard → SQL Editor
--
-- The admin Users page has had a "Suspend" button with no onClick
-- handler at all (dead UI) — there was also no column to represent
-- suspension in the first place. Adding both.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_suspended_at ON public.profiles(suspended_at) WHERE suspended_at IS NOT NULL;
