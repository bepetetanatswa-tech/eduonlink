-- ═══════════════════════════════════════════════════════════════
-- EduOnLink — Migration 054: repoint lesson_comments to course_materials
-- Run this in: Supabase Dashboard → SQL Editor
--
-- lesson_comments.lesson_id referenced a "lessons" table that has zero
-- references anywhere in src/ — a completely dead, parallel schema
-- from an earlier design that was superseded by courses/course_materials
-- (what LessonCreator, the student lesson player, and everything else
-- actually use). Wiring up a Q&A UI against the dead table would be
-- pointless since nothing ever creates a "lessons" row. Repoints the FK
-- to course_materials instead. Safe: lesson_comments has 0 rows (it was
-- never wired to any UI), so there's no existing data referencing the
-- old table to migrate.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.lesson_comments DROP CONSTRAINT IF EXISTS lesson_comments_lesson_id_fkey;
ALTER TABLE public.lesson_comments
  ADD CONSTRAINT lesson_comments_lesson_id_fkey
  FOREIGN KEY (lesson_id) REFERENCES public.course_materials(id) ON DELETE CASCADE;
