-- ═══════════════════════════════════════════════════════════════
-- VOA — Migration 028: fix missing table-level GRANTs (same bug class as 027)
-- Run this in: Supabase Dashboard → SQL Editor
--
-- Found by cross-checking every public-schema RLS policy's command
-- (INSERT/UPDATE/DELETE) against actual GRANTs held by `authenticated`.
-- RLS policies existed and were correct in every case below — but
-- without the matching GRANT, Postgres rejects the write before RLS is
-- even evaluated (42501 "permission denied for table X"), which reads
-- to the user as "the button doesn't do anything."
--
-- Confirmed live-broken (client code calls these directly via the
-- browser Supabase client, not an admin/service-role API route):
--   - courses / course_materials: admin CourseManager.tsx cannot
--     create, edit, publish, delete courses, or manage materials.
--   - student_badges: HBCWorkflow.tsx cannot award the "Independent
--     Thinker" badge on HBC project completion.
-- Not yet exercised by any UI (no current write path), fixed for
-- consistency / to not repeat this bug when the feature is built:
--   - course_progress (student lesson-progress tracking is read-only
--     today — no insert/update call exists anywhere in the app yet)
--   - live_sessions DELETE, profiles INSERT/UPDATE, platform_settings
--     DELETE
-- ═══════════════════════════════════════════════════════════════

GRANT INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.course_materials TO authenticated;
GRANT UPDATE, DELETE ON public.course_progress TO authenticated;
GRANT INSERT ON public.student_badges TO authenticated;
GRANT DELETE ON public.live_sessions TO authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT DELETE ON public.platform_settings TO authenticated;
