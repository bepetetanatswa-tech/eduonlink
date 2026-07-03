-- ═══════════════════════════════════════════════════════════════
-- VOA/Educonnect — Migration 025: Message-request gate (student -> teacher DMs)
-- Run this in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.dm_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ,
  UNIQUE (requester_id, recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_dm_requests_requester ON public.dm_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_dm_requests_recipient ON public.dm_requests(recipient_id);

ALTER TABLE public.dm_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dm_requests: select" ON public.dm_requests FOR SELECT
  USING (requester_id = get_my_profile_id() OR recipient_id = get_my_profile_id() OR is_super_admin());

CREATE POLICY "dm_requests: insert own" ON public.dm_requests FOR INSERT
  WITH CHECK (requester_id = get_my_profile_id());

CREATE POLICY "dm_requests: update as recipient" ON public.dm_requests FOR UPDATE
  USING (recipient_id = get_my_profile_id());

GRANT SELECT, INSERT, UPDATE ON public.dm_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.dm_requests TO service_role;
