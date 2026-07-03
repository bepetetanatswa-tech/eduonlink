-- ═══════════════════════════════════════════════════════════════
-- VOA — Migration 018: AI conversation flagging
-- Run this in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.ai_conversations
  ADD COLUMN IF NOT EXISTS flagged BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS flag_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_ai_conversations_flagged ON public.ai_conversations(flagged) WHERE flagged = TRUE;
