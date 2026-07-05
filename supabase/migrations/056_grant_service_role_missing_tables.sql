-- ═══════════════════════════════════════════════════════════════
-- EduOnLink — Migration 056: grant service_role on tables missing it
-- Run this in: Supabase Dashboard → SQL Editor
--
-- Found while seeding launch content via the service-role key: 22 tables
-- (courses, course_materials, library_resources, exam_papers,
-- timetable_slots, live_sessions, and 16 others) had zero grants to
-- service_role at all — not an RLS gap (service_role bypasses RLS by
-- design), but the coarser table-level GRANT that must exist before RLS
-- is even evaluated. Every other table in the schema (e.g. profiles) has
-- the standard full grant to service_role; these 22 were apparently
-- created by migrations that didn't include it. No app feature currently
-- shipped hits this (grepped every createAdminClient() call site — none
-- touch these tables), so this was latent, but it would silently break
-- any future admin/service-role code path touching them.
-- ═══════════════════════════════════════════════════════════════

GRANT ALL ON TABLE
  public.announcement_reads,
  public.blacklisted_phones,
  public.chat_moderations,
  public.class_courses,
  public.class_resources,
  public.course_materials,
  public.course_progress,
  public.courses,
  public.exam_papers,
  public.exam_sessions,
  public.lesson_comments,
  public.library_bookmarks,
  public.library_resources,
  public.live_session_attendance,
  public.live_sessions,
  public.message_reactions,
  public.message_read_receipts,
  public.message_stars,
  public.platform_settings,
  public.student_badges,
  public.timetable_slots,
  public.user_credits
TO service_role;
