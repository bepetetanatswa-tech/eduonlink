-- ═══════════════════════════════════════════════════════════════
-- EduOnLink — Migration 053: assignment late penalty
-- Run this in: Supabase Dashboard → SQL Editor
--
-- allow_late only ever gated whether a late submission was accepted at
-- all - there was no actual score deduction, despite the spec calling
-- for "Late penalty (e.g., -5 marks per day late)". Adds a per-day
-- penalty amount; the rubric itself is stored as JSON in the existing
-- rubric text column (no schema change needed there) to keep
-- structured criteria without a new table.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS late_penalty_per_day numeric NOT NULL DEFAULT 0;
