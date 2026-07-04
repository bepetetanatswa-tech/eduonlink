-- ═══════════════════════════════════════════════════════════════
-- EduOnLink — Migration 048: course_progress RLS policies
-- Run this in: Supabase Dashboard → SQL Editor
--
-- course_progress had RLS enabled with zero policies, meaning every
-- query against it — including the existing read-only queries in the
-- student lesson list — was silently blocked and always returned
-- empty. That's the actual reason lesson completion checkmarks could
-- never appear, not just a missing write path. Adds student
-- read/write access to their own rows, plus read access for the
-- class teacher (matches the "teacher sees student progress" spec).
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "course_progress: select" ON public.course_progress
  FOR SELECT
  USING (
    is_super_admin()
    OR student_id = get_my_profile_id()
    OR EXISTS (
      SELECT 1 FROM public.class_courses cc
      JOIN public.classes cl ON cl.id = cc.class_id
      WHERE cc.course_id = course_progress.course_id
        AND cl.teacher_id = get_my_profile_id()
    )
  );

CREATE POLICY "course_progress: insert" ON public.course_progress
  FOR INSERT
  WITH CHECK (is_super_admin() OR student_id = get_my_profile_id());

CREATE POLICY "course_progress: delete" ON public.course_progress
  FOR DELETE
  USING (is_super_admin() OR student_id = get_my_profile_id());
