-- ═══════════════════════════════════════════════════════════════
-- EduOnLink — Migration 077: conversation_hides becomes a permanent
-- per-user watermark, not an auto-clearing toggle
--
-- Migration 076's unhide_conversation_on_new_message trigger deleted
-- the hide row entirely the moment the other person sent a new
-- message — which meant ALL prior history (from before the delete)
-- would resurface along with the new message. That's wrong: per
-- product clarification, deleting a chat means the user no longer
-- wants that history in their own view, permanently — only messages
-- sent AFTER the delete should ever show again for them. The other
-- participant's copy is still untouched (unchanged from 076).
--
-- hidden_at now works as a watermark: the app filters out any
-- message with created_at <= hidden_at when building this user's
-- conversation list and when fetching an opened thread. No DB-side
-- filtering needed here — RLS still just scopes conversation_hides
-- rows to their owner; the watermark comparison happens client-side
-- against ordinary SELECTs on `messages`, which the user's existing
-- "messages: select" policy already allows.
-- ═══════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS unhide_conversation_on_new_message_trigger ON public.messages;
DROP FUNCTION IF EXISTS public.unhide_conversation_on_new_message();
