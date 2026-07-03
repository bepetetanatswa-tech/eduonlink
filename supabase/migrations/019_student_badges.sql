-- ═══════════════════════════════════════════════════════════════
-- VOA — Migration 019: Student badges (gamification)
-- Run this in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.student_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL,
  context JSONB,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_badges_student ON public.student_badges(student_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_badges_unique ON public.student_badges(student_id, badge_key, (context->>'project_id'));

ALTER TABLE public.student_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_badges: select" ON public.student_badges FOR SELECT
  USING (
    is_super_admin()
    OR student_id = get_my_profile_id()
    OR EXISTS (
      SELECT 1 FROM school_members sm_t
      JOIN school_members sm_s ON sm_t.school_id = sm_s.school_id
      WHERE sm_t.user_id = get_my_profile_id() AND sm_t.role = 'teacher'::member_role AND sm_s.user_id = student_badges.student_id
    )
  );

CREATE POLICY "student_badges: insert" ON public.student_badges FOR INSERT
  WITH CHECK (student_id = get_my_profile_id() OR is_super_admin());
