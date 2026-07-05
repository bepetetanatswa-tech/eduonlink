-- ═══════════════════════════════════════════════════════════════
-- EduOnLink — Migration 057: grant authenticated on library/badges tables
-- Run this in: Supabase Dashboard → SQL Editor
--
-- Found while seeding Digital Library launch content: library_resources,
-- library_bookmarks and student_badges have zero grants to `authenticated`
-- at all — meaning the entire Digital Library feature (shipped in commit
-- cfd7ca3) has never actually been reachable by any real logged-in user,
-- regardless of RLS, since GRANT is checked before RLS. Their RLS
-- policies already assume full read/write access scoped correctly
-- (library_resources_select is USING (true), library_resources_write and
-- library_bookmarks_own are FOR ALL), so grant ALL to match, same as
-- every other correctly-configured table in this schema.
-- ═══════════════════════════════════════════════════════════════

GRANT ALL ON TABLE
  public.library_resources,
  public.library_bookmarks,
  public.student_badges
TO authenticated;
