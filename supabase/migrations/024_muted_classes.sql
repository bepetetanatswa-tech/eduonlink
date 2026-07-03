-- ═══════════════════════════════════════════════════════════════
-- VOA/Educonnect — Migration 024: Class chat notification muting
-- Run this in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.muted_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, class_id)
);

CREATE INDEX IF NOT EXISTS idx_muted_classes_user ON public.muted_classes(user_id);

ALTER TABLE public.muted_classes ENABLE ROW LEVEL SECURITY;

-- Readable broadly (not sensitive) so other class members' senders can check
-- who has muted this class before creating notifications for them.
CREATE POLICY "muted_classes: select" ON public.muted_classes FOR SELECT USING (true);

CREATE POLICY "muted_classes: insert own" ON public.muted_classes FOR INSERT
  WITH CHECK (user_id = get_my_profile_id());

CREATE POLICY "muted_classes: delete own" ON public.muted_classes FOR DELETE
  USING (user_id = get_my_profile_id());

GRANT SELECT, INSERT, DELETE ON public.muted_classes TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.muted_classes TO service_role;
