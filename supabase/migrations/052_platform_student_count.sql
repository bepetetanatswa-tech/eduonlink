-- ═══════════════════════════════════════════════════════════════
-- EduOnLink — Migration 052: platform-wide student count RPC
-- Run this in: Supabase Dashboard → SQL Editor
--
-- Teacher/school dashboards want to show the total number of students
-- on the whole platform (a motivational "here's how many students you
-- could reach" stat, not their own enrolled count). profiles RLS only
-- lets a caller see their own row + same-school members, so a direct
-- count() query would badly undercount for anyone outside a shared
-- school. This RPC returns the true platform-wide total regardless.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_platform_student_count()
RETURNS bigint
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT count(*) FROM profiles WHERE role = 'student';
$$;

GRANT EXECUTE ON FUNCTION public.get_platform_student_count() TO authenticated;
