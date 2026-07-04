-- ═══════════════════════════════════════════════════════════════
-- EduOnLink — Migration 050: school financials rollup + realtime payments
-- Run this in: Supabase Dashboard → SQL Editor
--
-- School admins had no way to read course_purchases at all (only the
-- student, the selling teacher, and super_admin could). Adds a
-- read-only SELECT policy scoped to teachers who are members of the
-- admin's own school, for the new school Financials rollup page.
-- Independent teachers not linked to any school are unaffected -
-- their own earnings dashboard already scopes by teacher_id directly
-- and doesn't depend on school_members at all.
--
-- Also adds course_purchases to the supabase_realtime publication
-- (payment_verifications was already enabled, course_purchases
-- wasn't) so teacher earnings and school financials dashboards update
-- live the moment an admin approves a payment, no refresh needed.
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "School admin sees own teachers' sales" ON public.course_purchases
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.school_members sm_admin
      JOIN public.school_members sm_teacher ON sm_teacher.school_id = sm_admin.school_id
      WHERE sm_admin.user_id = get_my_profile_id()
        AND sm_admin.role = 'admin'
        AND sm_teacher.user_id = course_purchases.teacher_id
        AND sm_teacher.role = 'teacher'
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.course_purchases;
