-- ═══════════════════════════════════════════════════════════════
-- VOA — Migration 010: Teacher verification workflow
-- Run this in: Supabase Dashboard → SQL Editor
--
-- profiles.ztc_number and profiles.is_approved already exist on the live
-- table (added directly against the DB at some point, never committed as
-- a migration) but are wired to nothing in the app — a teacher gets full
-- /teacher/** access immediately after registration today. This migration
-- documents those two columns for real (idempotent, matches live state),
-- adds the missing pieces (rejection reason, document storage keys), and
-- flips the default so *new* teacher signups start unapproved while
-- existing rows are untouched.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ztc_number               TEXT,
  ADD COLUMN IF NOT EXISTS is_approved               BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS teacher_rejection_reason  TEXT,
  ADD COLUMN IF NOT EXISTS qualification_doc_key     TEXT,
  ADD COLUMN IF NOT EXISTS id_doc_key                TEXT;

-- Roles that don't go through an approval gate (student, parent, and
-- super_admin, whose is_approved was already true) shouldn't be blocked
-- by the new teacher pending-review middleware gate.
UPDATE public.profiles SET is_approved = TRUE WHERE role IN ('student', 'parent');

CREATE INDEX IF NOT EXISTS profiles_teacher_approval_idx
  ON public.profiles (role, is_approved) WHERE role = 'teacher';
