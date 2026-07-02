-- ═══════════════════════════════════════════════════════════════
-- VOA — Migration 013: capture user_agent on login attempts
-- Run this in: Supabase Dashboard → SQL Editor
--
-- Backs the "recent sign-in activity" view in the profile Security
-- section (src/components/profile/SecurityPanel.tsx) — shows a user
-- their own successful logins with rough device/browser info.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.login_attempts ADD COLUMN IF NOT EXISTS user_agent TEXT;
