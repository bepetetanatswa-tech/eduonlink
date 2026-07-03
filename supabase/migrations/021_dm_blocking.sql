-- ═══════════════════════════════════════════════════════════════
-- VOA/Educonnect — Migration 021: Direct message blocking
-- Run this in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON public.blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON public.blocked_users(blocked_id);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Either party to a block relationship can see it exists (so the blocked
-- user's client also knows to disable its own send button, not just the
-- blocker's).
CREATE POLICY "blocked_users: select" ON public.blocked_users FOR SELECT
  USING (blocker_id = get_my_profile_id() OR blocked_id = get_my_profile_id() OR is_super_admin());

CREATE POLICY "blocked_users: insert own" ON public.blocked_users FOR INSERT
  WITH CHECK (blocker_id = get_my_profile_id());

CREATE POLICY "blocked_users: delete own" ON public.blocked_users FOR DELETE
  USING (blocker_id = get_my_profile_id());

GRANT SELECT, INSERT, DELETE ON public.blocked_users TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.blocked_users TO service_role;
