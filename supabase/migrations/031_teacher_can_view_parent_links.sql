-- ═══════════════════════════════════════════════════════════════
-- VOA — Migration 031: teachers can look up their students' parent links
-- Run this in: Supabase Dashboard → SQL Editor
--
-- AttendanceMarker.tsx notifies parents of absent/late students via
-- parent_children, but the only SELECT policy on that table let a
-- parent see their own links (or super_admin) — a teacher had no way
-- to resolve child_id -> parent_id, so the notification would always
-- silently match zero rows even after fixing the broken join logic
-- in the same commit.
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "Teachers view parent links for same-school students" ON public.parent_children
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = (select auth.uid())
        AND profiles.role IN ('teacher', 'school_admin')
    )
    AND is_same_school_member(child_id)
  );
