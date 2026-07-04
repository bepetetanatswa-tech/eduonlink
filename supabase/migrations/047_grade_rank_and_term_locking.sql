-- ═══════════════════════════════════════════════════════════════
-- EduOnLink — Migration 047: persisted class rank + term locking on grades
-- Run this in: Supabase Dashboard → SQL Editor
--
-- GradeBook.tsx only ever sorted the currently-displayed roster
-- client-side for rank, which reset on every reload and was never
-- stored. Ministry-grade report cards need a persisted rank, and a
-- way to lock a term's grades once submitted so they can't be quietly
-- edited afterward. The update policy is split into USING (checked
-- against the OLD row: a teacher may only touch a row that isn't
-- already locked) and WITH CHECK (checked against the NEW row: the
-- class must still be theirs) so a teacher can transition a row from
-- unlocked -> locked in one UPDATE, but once locked, only
-- super_admin can touch it again (including to unlock).
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.grades ADD COLUMN IF NOT EXISTS class_rank SMALLINT;
ALTER TABLE public.grades ADD COLUMN IF NOT EXISTS locked BOOLEAN NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "grades: update" ON public.grades;
CREATE POLICY "grades: update" ON public.grades
  FOR UPDATE
  USING (
    is_super_admin()
    OR (is_my_class_teacher(class_id) AND NOT locked)
  )
  WITH CHECK (
    is_super_admin()
    OR is_my_class_teacher(class_id)
  );
