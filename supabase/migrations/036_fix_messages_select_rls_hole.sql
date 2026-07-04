-- VOA/Educonnect — Migration 036: close a cross-class message read hole.
--
-- Found while building class-card "last activity" data: messages has two
-- SELECT policies, combined with OR per Postgres RLS semantics.
--   "messages: select" (newer, correct-looking): sender=self OR
--     receiver=self OR super_admin — but this alone breaks class chat for
--     everyone except sender/receiver, since broadcast class messages have
--     no single receiver.
--   "Messages read" (older, left in place): authenticated AND
--     (class_id IS NOT NULL OR sender=self OR receiver=self) — the
--     class_id IS NOT NULL branch has NO membership check at all, so any
--     authenticated user on the platform can read every class's full chat
--     history, not just classes they belong to.
-- Replacing both with one policy: sender/receiver/super_admin (DMs) OR
-- actual class membership (enrolled student or the class's teacher) for
-- class messages.

CREATE OR REPLACE FUNCTION public.is_class_member(p_class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_enrollments
    WHERE class_id = p_class_id AND student_id = public.get_my_profile_id() AND status = 'active'
  ) OR EXISTS (
    SELECT 1 FROM public.classes
    WHERE id = p_class_id AND teacher_id = public.get_my_profile_id()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_class_member(UUID) TO authenticated;

DROP POLICY IF EXISTS "Messages read" ON public.messages;
DROP POLICY IF EXISTS "messages: select" ON public.messages;

CREATE POLICY "messages: select" ON public.messages
  FOR SELECT
  USING (
    public.is_super_admin()
    OR sender_id = public.get_my_profile_id()
    OR receiver_id = public.get_my_profile_id()
    OR (class_id IS NOT NULL AND public.is_class_member(class_id))
  );
