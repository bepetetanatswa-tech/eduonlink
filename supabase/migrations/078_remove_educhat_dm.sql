-- ═══════════════════════════════════════════════════════════════
-- EduOnLink — Migration 078: remove EduChat (direct messaging)
--
-- Product decision: drop the DM/"EduChat" hub (DirectMessages,
-- EduChatHub, per-role /dashboard/messages pages) entirely. Per-class
-- group chat (ClassChat, the messages/message_reactions/
-- message_read_receipts/message_stars/muted_classes/chat_moderations
-- tables, and notify_class_message) is a SEPARATE feature and is
-- explicitly kept — do not touch it here.
--
-- DM-only surface being removed: blocked_users, dm_requests,
-- muted_conversations, conversation_hides tables; notify_dm_message
-- and notify_dm_request RPCs; and the 1 pre-existing DM row in
-- `messages` (class_id IS NULL — class-chat rows have class_id set
-- and are untouched).
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Clear out existing DM rows from `messages` (class chat rows,
--      class_id IS NOT NULL, are left alone). Detach any self-referencing
--      parent_id pointers first so the FK (ON DELETE NO ACTION) doesn't
--      block the delete.
UPDATE public.messages
  SET parent_id = NULL
  WHERE parent_id IN (SELECT id FROM public.messages WHERE class_id IS NULL);

DELETE FROM public.messages WHERE class_id IS NULL;

-- ── 2. Drop DM-only notification RPCs (notify_class_message stays —
--      ClassChat still calls it).
DROP FUNCTION IF EXISTS public.notify_dm_message(UUID, TEXT);
DROP FUNCTION IF EXISTS public.notify_dm_request(UUID);

-- ── 3. Drop DM-only tables.
DROP TABLE IF EXISTS public.conversation_hides;
DROP TABLE IF EXISTS public.dm_requests;
DROP TABLE IF EXISTS public.muted_conversations;
DROP TABLE IF EXISTS public.blocked_users;
