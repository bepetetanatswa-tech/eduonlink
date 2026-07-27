-- ═══════════════════════════════════════════════════════════════
-- EduOnLink — Migration 076: per-user "delete chat" for EduChat DMs
--
-- Live RLS on `messages` only lets a user delete rows THEY sent
-- (`messages: delete` — sender_id = get_my_profile_id()), so a bulk
-- "delete this chat" can't remove the other participant's messages
-- without a privileged bulk-delete surface. Per product decision,
-- "delete chat" instead hides the conversation from the acting
-- user's own conversation list only — the other participant's copy
-- is untouched, matching WhatsApp/iMessage semantics. If the other
-- person sends a new message, the conversation reappears
-- automatically (handled by the trigger below), so a hide is a
-- "clear my view for now," not a permanent block.
--
-- Correction to the earlier audit: the two UPDATE policies on
-- `messages` ("Messages update" / "messages: update") looked
-- redundant at a glance but are NOT — one lets senders edit/soft-
-- delete their own messages, the other lets receivers mark
-- read/delivered. Both are load-bearing; left untouched. Only the
-- INSERT policies are genuinely redundant (see bottom of this file).
-- ═══════════════════════════════════════════════════════════════

-- ── 1. conversation_hides ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.conversation_hides (
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  other_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hidden_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, other_user_id)
);

ALTER TABLE public.conversation_hides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversation_hides: select own" ON public.conversation_hides;
CREATE POLICY "conversation_hides: select own" ON public.conversation_hides
  FOR SELECT USING (user_id = get_my_profile_id());

DROP POLICY IF EXISTS "conversation_hides: insert own" ON public.conversation_hides;
CREATE POLICY "conversation_hides: insert own" ON public.conversation_hides
  FOR INSERT WITH CHECK (user_id = get_my_profile_id());

DROP POLICY IF EXISTS "conversation_hides: delete own" ON public.conversation_hides;
CREATE POLICY "conversation_hides: delete own" ON public.conversation_hides
  FOR DELETE USING (user_id = get_my_profile_id());

-- ── 2. Auto-unhide when the other person sends a new message ─────
-- Runs as the sender (who has no RLS access to the receiver's hide
-- row), so this needs SECURITY DEFINER — scope is narrow and fixed
-- (delete exactly one hide row keyed off the inserted message).

CREATE OR REPLACE FUNCTION public.unhide_conversation_on_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.receiver_id IS NOT NULL THEN
    DELETE FROM public.conversation_hides
    WHERE user_id = NEW.receiver_id AND other_user_id = NEW.sender_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS unhide_conversation_on_new_message_trigger ON public.messages;
CREATE TRIGGER unhide_conversation_on_new_message_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE PROCEDURE public.unhide_conversation_on_new_message();

-- ── 3. Drop the genuinely-redundant legacy INSERT policy ─────────
-- "Messages insert" (sender_id resolved via a profiles join) is a
-- strict subset of "messages: insert" (same restriction, expressed
-- via get_my_profile_id(), plus a super_admin bypass) — safe to drop,
-- unlike the UPDATE policies above.

DROP POLICY IF EXISTS "Messages insert" ON public.messages;
