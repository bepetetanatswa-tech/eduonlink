-- ═══════════════════════════════════════════════════════════════
-- VOA — Migration 012: Login attempt tracking + lockout
-- Run this in: Supabase Dashboard → SQL Editor
--
-- Backs the app-level "5 failed attempts → 15 minute lockout" rule from
-- the original security spec. No INSERT/SELECT grant to `authenticated`
-- or `anon` at all — a login attempt happens BEFORE the caller has a
-- session, so this can only ever be written/read by the service-role
-- client in /api/auth/check-lockout and /api/auth/record-attempt.
--
-- Note: this is app-level, defense-in-depth. It protects the app's own
-- login page from scripted brute-force through the UI, but it can't
-- stop someone from bypassing the Next.js app entirely and calling
-- Supabase's own /auth/v1/token endpoint directly with the public
-- anon key — that path is only bounded by Supabase's own project-level
-- Auth rate limits (Dashboard → Authentication → Rate Limits), which
-- this migration does not touch.
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.login_attempts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL,
  ip         TEXT,
  success    BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.login_attempts TO service_role;

CREATE INDEX IF NOT EXISTS login_attempts_email_time_idx ON public.login_attempts (email, created_at DESC);
