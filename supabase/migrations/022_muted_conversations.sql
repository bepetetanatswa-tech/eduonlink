-- ═══════════════════════════════════════════════════════════════
-- VOA/Educonnect — Migration 022: Direct-message conversation muting
-- Run this in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.muted_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  other_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, other_user_id)
);

CREATE INDEX IF NOT EXISTS idx_muted_conversations_user ON public.muted_conversations(user_id);

ALTER TABLE public.muted_conversations ENABLE ROW LEVEL SECURITY;

-- Readable broadly (not sensitive) so the OTHER party can check "have they
-- muted me" before deciding whether to create a notification for them.
CREATE POLICY "muted_conversations: select" ON public.muted_conversations FOR SELECT USING (true);

CREATE POLICY "muted_conversations: insert own" ON public.muted_conversations FOR INSERT
  WITH CHECK (user_id = get_my_profile_id());

CREATE POLICY "muted_conversations: delete own" ON public.muted_conversations FOR DELETE
  USING (user_id = get_my_profile_id());

GRANT SELECT, INSERT, DELETE ON public.muted_conversations TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.muted_conversations TO service_role;
