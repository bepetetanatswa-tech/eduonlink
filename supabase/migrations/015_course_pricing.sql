-- ═══════════════════════════════════════════════════════════════
-- VOA — Migration 015: Course/lesson pricing
-- Run this in: Supabase Dashboard → SQL Editor
--
-- Lets a teacher set a price on a course. This only adds the ability
-- to SET a price and show it — it does not add paywall enforcement
-- (checking payment before granting a student access to a paid
-- course). That's a separate, larger feature (would need to extend
-- the existing payment_verifications/EcoCash flow with a
-- per-course purchase record) and is intentionally out of scope here.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS price NUMERIC(10,2) NOT NULL DEFAULT 0
    CHECK (price >= 0);
