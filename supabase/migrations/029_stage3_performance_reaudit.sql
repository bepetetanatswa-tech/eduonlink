-- ═══════════════════════════════════════════════════════════════
-- VOA — Migration 029: Stage 3 reaudit performance fixes
-- Run this in: Supabase Dashboard → SQL Editor
--
-- Pure performance, no logic changes:
-- 1. 4 unindexed foreign keys (slow joins/cascade checks)
-- 2. 43 RLS policies re-evaluating auth.uid()/auth.role() per row
--    instead of once per query — wrapped in (select ...) per
--    Supabase's documented RLS performance guidance. Text is a
--    mechanical substitution of the existing policy definitions,
--    not a logic change.
-- 3. 1 duplicate index on notifications
-- 4. profiles.updated_at was missing its trigger (the only table
--    the Stage 3 audit on 2026-07-02 missed, since profiles was
--    still user_profiles at the time)
-- ═══════════════════════════════════════════════════════════════

-- 1. Missing FK indexes
CREATE INDEX IF NOT EXISTS idx_course_purchases_payment_verification_id ON public.course_purchases(payment_verification_id);
CREATE INDEX IF NOT EXISTS idx_muted_classes_class_id ON public.muted_classes(class_id);
CREATE INDEX IF NOT EXISTS idx_muted_conversations_other_user_id ON public.muted_conversations(other_user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_withdrawal_requests_processed_by ON public.teacher_withdrawal_requests(processed_by);

-- 2. RLS initplan fix — wrap auth.<fn>() in (select ...)
ALTER POLICY "Mark own read" ON public.announcement_reads WITH CHECK ((user_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (select auth.uid())))));
ALTER POLICY "View reads" ON public.announcement_reads USING (((select auth.role()) = 'authenticated'::text));
ALTER POLICY "Announcements insert" ON public.announcements WITH CHECK ((author_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (select auth.uid())))));
ALTER POLICY "Announcements read" ON public.announcements USING (((select auth.role()) = 'authenticated'::text));
ALTER POLICY "Announcements update" ON public.announcements USING ((author_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (select auth.uid())))));
ALTER POLICY "blacklisted_admin_read" ON public.blacklisted_phones USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = (select auth.uid())) AND (profiles.role = 'super_admin'::user_role)))));
ALTER POLICY "blacklisted_admin_write" ON public.blacklisted_phones USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = (select auth.uid())) AND (profiles.role = 'super_admin'::user_role))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = (select auth.uid())) AND (profiles.role = 'super_admin'::user_role)))));
ALTER POLICY "Teacher moderate" ON public.chat_moderations USING ((muted_by IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (select auth.uid())))));
ALTER POLICY "View moderations" ON public.chat_moderations USING (((select auth.role()) = 'authenticated'::text));
ALTER POLICY "Materials visible if course is published" ON public.course_materials USING ((((select auth.uid()) IS NOT NULL) AND ((EXISTS ( SELECT 1
   FROM courses
  WHERE ((courses.id = course_materials.course_id) AND (courses.is_published = true)))) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = (select auth.uid())) AND (profiles.role = 'super_admin'::user_role)))))));
ALTER POLICY "Super admins manage materials" ON public.course_materials USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = (select auth.uid())) AND (profiles.role = 'super_admin'::user_role)))));
ALTER POLICY "Admins view all progress" ON public.course_progress USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['super_admin'::user_role, 'teacher'::user_role, 'school_admin'::user_role]))))));
ALTER POLICY "Students manage own progress" ON public.course_progress USING ((student_id = ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (select auth.uid())))));
ALTER POLICY "Published courses visible to all authenticated" ON public.courses USING ((((select auth.uid()) IS NOT NULL) AND ((is_published = true) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = (select auth.uid())) AND (profiles.role = 'super_admin'::user_role)))))));
ALTER POLICY "Super admins manage courses" ON public.courses USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = (select auth.uid())) AND (profiles.role = 'super_admin'::user_role)))));
ALTER POLICY "exam_papers_write" ON public.exam_papers USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['teacher'::user_role, 'school_admin'::user_role, 'super_admin'::user_role])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['teacher'::user_role, 'school_admin'::user_role, 'super_admin'::user_role]))))));
ALTER POLICY "exam_sessions_own" ON public.exam_sessions USING ((student_id = ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (select auth.uid()))))) WITH CHECK ((student_id = ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (select auth.uid())))));
ALTER POLICY "lesson_comments_delete" ON public.lesson_comments USING ((author_id = ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (select auth.uid())))));
ALTER POLICY "Student join session" ON public.live_session_attendance WITH CHECK ((student_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (select auth.uid())))));
ALTER POLICY "Student update own attendance" ON public.live_session_attendance USING ((student_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (select auth.uid())))));
ALTER POLICY "View attendance" ON public.live_session_attendance USING (((select auth.role()) = 'authenticated'::text));
ALTER POLICY "Insert session" ON public.live_sessions WITH CHECK ((teacher_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (select auth.uid())))));
ALTER POLICY "Teacher manage sessions" ON public.live_sessions USING ((teacher_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (select auth.uid())))));
ALTER POLICY "View sessions" ON public.live_sessions USING (((select auth.role()) = 'authenticated'::text));
ALTER POLICY "Add reactions" ON public.message_reactions WITH CHECK ((user_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (select auth.uid())))));
ALTER POLICY "Read reactions" ON public.message_reactions USING (((select auth.role()) = 'authenticated'::text));
ALTER POLICY "Remove own reactions" ON public.message_reactions USING ((user_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (select auth.uid())))));
ALTER POLICY "Add own receipt" ON public.message_read_receipts WITH CHECK ((user_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (select auth.uid())))));
ALTER POLICY "Read receipts visible" ON public.message_read_receipts USING (((select auth.role()) = 'authenticated'::text));
ALTER POLICY "Messages insert" ON public.messages WITH CHECK ((sender_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (select auth.uid())))));
ALTER POLICY "Messages read" ON public.messages USING ((((select auth.role()) = 'authenticated'::text) AND ((class_id IS NOT NULL) OR (sender_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (select auth.uid())))) OR (receiver_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (select auth.uid())))))));
ALTER POLICY "Messages update" ON public.messages USING (((sender_id IN ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (select auth.uid())))) OR (class_id IN ( SELECT classes.id
   FROM classes
  WHERE (classes.teacher_id IN ( SELECT profiles.id
           FROM profiles
          WHERE (profiles.user_id = (select auth.uid()))))))));
ALTER POLICY "pay_ver_admin_update" ON public.payment_verifications USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = (select auth.uid())) AND (profiles.role = 'super_admin'::user_role)))));
ALTER POLICY "pay_ver_own_read" ON public.payment_verifications USING (((user_id = (select auth.uid())) OR (profile_id = ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.user_id = (select auth.uid())))) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = (select auth.uid())) AND (profiles.role = 'super_admin'::user_role))))));
ALTER POLICY "Super admins manage settings" ON public.platform_settings USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = (select auth.uid())) AND (profiles.role = 'super_admin'::user_role)))));
ALTER POLICY "profiles: insert" ON public.profiles WITH CHECK ((is_super_admin() OR (user_id = (select auth.uid()))));
ALTER POLICY "profiles: select" ON public.profiles USING ((is_super_admin() OR (user_id = (select auth.uid())) OR is_same_school_member(id)));
ALTER POLICY "profiles: update" ON public.profiles USING ((is_super_admin() OR (user_id = (select auth.uid()))));
ALTER POLICY "subjects: read" ON public.subjects USING (((select auth.uid()) IS NOT NULL));
ALTER POLICY "sub_admin_update" ON public.subscriptions USING (((user_id = (select auth.uid())) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = (select auth.uid())) AND (profiles.role = 'super_admin'::user_role))))));
ALTER POLICY "sub_own_read" ON public.subscriptions USING (((user_id = (select auth.uid())) OR (school_id IS NOT NULL) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = (select auth.uid())) AND (profiles.role = 'super_admin'::user_role))))));
ALTER POLICY "timetable_write" ON public.timetable_slots USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['school_admin'::user_role, 'super_admin'::user_role])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = (select auth.uid())) AND (profiles.role = ANY (ARRAY['school_admin'::user_role, 'super_admin'::user_role]))))));
ALTER POLICY "credits_admin_read" ON public.user_credits USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = (select auth.uid())) AND (profiles.role = 'super_admin'::user_role)))));
ALTER POLICY "credits_admin_update" ON public.user_credits USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = (select auth.uid())) AND (profiles.role = 'super_admin'::user_role)))));
ALTER POLICY "credits_own" ON public.user_credits USING ((user_id = (select auth.uid()))) WITH CHECK ((user_id = (select auth.uid())));


-- 3. Duplicate index
DROP INDEX IF EXISTS public.idx_notif_unread;

-- 4. profiles.updated_at trigger (missed by migration 014)
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
