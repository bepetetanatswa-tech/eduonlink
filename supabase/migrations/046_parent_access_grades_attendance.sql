-- ═══════════════════════════════════════════════════════════════
-- EduOnLink — Migration 046: parent read access to grades + attendance
-- Run this in: Supabase Dashboard → SQL Editor
--
-- Parents had a "Report Cards" page (StudentGrades with parentView) and
-- were meant to see their child's attendance, but the grades/attendance
-- SELECT policies only allowed super_admin, the student themself,
-- the class teacher, or the school admin — a parent querying
-- student_id = <child's profile id> matched none of those and always
-- got zero rows back. is_parent_of() mirrors the existing
-- is_my_class_teacher() pattern, checking parent_children for a
-- confirmed link.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.is_parent_of(p_child_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM parent_children
    WHERE child_id = p_child_id
      AND parent_id = get_my_profile_id()
      AND status = 'confirmed'
  );
$$;

DROP POLICY IF EXISTS "grades: select" ON public.grades;
CREATE POLICY "grades: select" ON public.grades
  FOR SELECT
  USING (
    is_super_admin()
    OR student_id = get_my_profile_id()
    OR is_my_class_teacher(class_id)
    OR is_my_school_admin(class_school_id(class_id))
    OR is_parent_of(student_id)
  );

DROP POLICY IF EXISTS "attendance: select" ON public.attendance;
CREATE POLICY "attendance: select" ON public.attendance
  FOR SELECT
  USING (
    is_super_admin()
    OR student_id = get_my_profile_id()
    OR is_my_class_teacher(class_id)
    OR is_my_school_admin(class_school_id(class_id))
    OR is_parent_of(student_id)
  );
