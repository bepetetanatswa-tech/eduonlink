-- ═══════════════════════════════════════════════════════════════
-- EduOnLink — Migration 049: backfill untracked academic schema
-- Run this in: Supabase Dashboard → SQL Editor
--
-- assignments, submissions, attendance, grades, timetable_slots,
-- exam_papers, exam_sessions, and three RLS helper functions
-- (assignment_class_id, class_school_id, is_enrolled_in_class) were
-- all created directly against the live database and never captured
-- in a tracked migration — a fresh environment restored from this
-- migrations folder alone would be missing the entire academic
-- system. This migration reproduces the live schema exactly, using
-- IF NOT EXISTS / DROP-then-CREATE everywhere so it's safe to run
-- against the existing production database with no effect, while
-- also making the schema reproducible from scratch.
--
-- Also fixes a live bug found while writing this: TimetableEditor.tsx
-- upserts on (school_id, class_id, day_of_week, period_number), but
-- no matching UNIQUE constraint ever existed — every timetable slot
-- save was failing with "no unique or exclusion constraint matching
-- the ON CONFLICT specification".
-- ═══════════════════════════════════════════════════════════════

-- ── Types ──────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Tables ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  instructions text,
  due_date timestamptz,
  max_score numeric NOT NULL DEFAULT 100,
  attachment_url text,
  rubric text,
  allow_late boolean DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text,
  file_url text,
  score numeric CHECK (score >= 0),
  feedback text,
  status text DEFAULT 'submitted',
  is_late boolean DEFAULT false,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  graded_at timestamptz,
  graded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  UNIQUE (assignment_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status public.attendance_status NOT NULL DEFAULT 'present',
  reason text,
  marked_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  UNIQUE (class_id, student_id, date)
);

CREATE TABLE IF NOT EXISTS public.grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  assignment_id uuid REFERENCES public.assignments(id) ON DELETE SET NULL,
  term smallint NOT NULL CHECK (term = ANY (ARRAY[1, 2, 3])),
  academic_year text NOT NULL DEFAULT EXTRACT(year FROM now())::text,
  score numeric CHECK (score >= 0 AND score <= 100),
  grade text,
  class_rank smallint,
  locked boolean NOT NULL DEFAULT false,
  teacher_comment text,
  UNIQUE (student_id, class_id, subject_id, term, academic_year)
);

CREATE TABLE IF NOT EXISTS public.timetable_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject_name text NOT NULL,
  day_of_week smallint NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  period_number smallint NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  room text,
  created_at timestamptz DEFAULT now()
);

-- CREATE TABLE IF NOT EXISTS is a full no-op when the table already
-- exists (as it did live) — it does NOT retrofit missing constraints
-- onto an existing table, so the UNIQUE below must be added separately.
-- This is the fix for TimetableEditor.tsx's upsert onConflict target,
-- which had no matching constraint and was failing on every save.
DO $$ BEGIN
  ALTER TABLE public.timetable_slots ADD CONSTRAINT timetable_slots_school_class_day_period_key
    UNIQUE (school_id, class_id, day_of_week, period_number);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.exam_papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject text NOT NULL,
  level text,
  year integer,
  description text,
  file_url text,
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.exam_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject text NOT NULL,
  questions_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  answers_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  score integer,
  total integer,
  time_taken integer,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- ── Indexes ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_assignments_class_id ON public.assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due ON public.assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignments_created_by ON public.assignments(created_by);
CREATE INDEX IF NOT EXISTS idx_submissions_asgn_id ON public.submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON public.submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_graded_by ON public.submissions(graded_by);
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON public.attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_marked_by ON public.attendance(marked_by);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON public.grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_class_id ON public.grades(class_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject_id ON public.grades(subject_id);
CREATE INDEX IF NOT EXISTS idx_grades_assignment_id ON public.grades(assignment_id);
CREATE INDEX IF NOT EXISTS idx_timetable_slots_class_id ON public.timetable_slots(class_id);
CREATE INDEX IF NOT EXISTS idx_timetable_slots_school_id ON public.timetable_slots(school_id);
CREATE INDEX IF NOT EXISTS idx_timetable_slots_teacher_id ON public.timetable_slots(teacher_id);
CREATE INDEX IF NOT EXISTS idx_exam_papers_uploaded_by ON public.exam_papers(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_student_id ON public.exam_sessions(student_id);

-- ── RLS helper functions ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.assignment_class_id(p_assignment_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT class_id FROM assignments WHERE id = p_assignment_id LIMIT 1; $$;

CREATE OR REPLACE FUNCTION public.class_school_id(p_class_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT school_id FROM classes WHERE id = p_class_id LIMIT 1; $$;

CREATE OR REPLACE FUNCTION public.is_enrolled_in_class(p_class_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM class_enrollments
    WHERE class_id = p_class_id AND student_id = get_my_profile_id() AND status = 'active'
  );
$$;

-- ── RLS ────────────────────────────────────────────────────────
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assignments: select" ON public.assignments;
CREATE POLICY "assignments: select" ON public.assignments FOR SELECT USING (
  is_super_admin() OR is_my_class_teacher(class_id) OR is_enrolled_in_class(class_id) OR is_my_school_admin(class_school_id(class_id))
);
DROP POLICY IF EXISTS "assignments: insert" ON public.assignments;
CREATE POLICY "assignments: insert" ON public.assignments FOR INSERT WITH CHECK (
  is_super_admin() OR is_my_class_teacher(class_id)
);
DROP POLICY IF EXISTS "assignments: update" ON public.assignments;
CREATE POLICY "assignments: update" ON public.assignments FOR UPDATE USING (
  is_super_admin() OR created_by = get_my_profile_id()
);
DROP POLICY IF EXISTS "assignments: delete" ON public.assignments;
CREATE POLICY "assignments: delete" ON public.assignments FOR DELETE USING (
  is_super_admin() OR created_by = get_my_profile_id()
);

DROP POLICY IF EXISTS "submissions: select" ON public.submissions;
CREATE POLICY "submissions: select" ON public.submissions FOR SELECT USING (
  is_super_admin() OR student_id = get_my_profile_id()
  OR is_my_class_teacher(assignment_class_id(assignment_id))
  OR is_my_school_admin(class_school_id(assignment_class_id(assignment_id)))
);
DROP POLICY IF EXISTS "submissions: insert" ON public.submissions;
CREATE POLICY "submissions: insert" ON public.submissions FOR INSERT WITH CHECK (
  is_super_admin() OR student_id = get_my_profile_id()
);
DROP POLICY IF EXISTS "submissions: update" ON public.submissions;
CREATE POLICY "submissions: update" ON public.submissions FOR UPDATE USING (
  is_super_admin() OR student_id = get_my_profile_id() OR is_my_class_teacher(assignment_class_id(assignment_id))
);
DROP POLICY IF EXISTS "submissions: delete" ON public.submissions;
CREATE POLICY "submissions: delete" ON public.submissions FOR DELETE USING (
  is_super_admin() OR is_my_class_teacher(assignment_class_id(assignment_id))
);

DROP POLICY IF EXISTS "attendance: select" ON public.attendance;
CREATE POLICY "attendance: select" ON public.attendance FOR SELECT USING (
  is_super_admin() OR student_id = get_my_profile_id() OR is_my_class_teacher(class_id)
  OR is_my_school_admin(class_school_id(class_id)) OR is_parent_of(student_id)
);
DROP POLICY IF EXISTS "attendance: insert" ON public.attendance;
CREATE POLICY "attendance: insert" ON public.attendance FOR INSERT WITH CHECK (
  is_super_admin() OR is_my_class_teacher(class_id)
);
DROP POLICY IF EXISTS "attendance: update" ON public.attendance;
CREATE POLICY "attendance: update" ON public.attendance FOR UPDATE USING (
  is_super_admin() OR is_my_class_teacher(class_id) OR marked_by = get_my_profile_id()
);
DROP POLICY IF EXISTS "attendance: delete" ON public.attendance;
CREATE POLICY "attendance: delete" ON public.attendance FOR DELETE USING (
  is_super_admin() OR is_my_class_teacher(class_id)
);

DROP POLICY IF EXISTS "grades: select" ON public.grades;
CREATE POLICY "grades: select" ON public.grades FOR SELECT USING (
  is_super_admin() OR student_id = get_my_profile_id() OR is_my_class_teacher(class_id)
  OR is_my_school_admin(class_school_id(class_id)) OR is_parent_of(student_id)
);
DROP POLICY IF EXISTS "grades: insert" ON public.grades;
CREATE POLICY "grades: insert" ON public.grades FOR INSERT WITH CHECK (
  is_super_admin() OR is_my_class_teacher(class_id)
);
DROP POLICY IF EXISTS "grades: update" ON public.grades;
CREATE POLICY "grades: update" ON public.grades FOR UPDATE
  USING (is_super_admin() OR (is_my_class_teacher(class_id) AND NOT locked))
  WITH CHECK (is_super_admin() OR is_my_class_teacher(class_id));
DROP POLICY IF EXISTS "grades: delete" ON public.grades;
CREATE POLICY "grades: delete" ON public.grades FOR DELETE USING (
  is_super_admin() OR is_my_class_teacher(class_id)
);

DROP POLICY IF EXISTS "timetable_select" ON public.timetable_slots;
CREATE POLICY "timetable_select" ON public.timetable_slots FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "timetable_write" ON public.timetable_slots;
CREATE POLICY "timetable_write" ON public.timetable_slots FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = ANY (ARRAY['school_admin'::user_role, 'super_admin'::user_role]))
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = ANY (ARRAY['school_admin'::user_role, 'super_admin'::user_role]))
);

DROP POLICY IF EXISTS "exam_papers_select" ON public.exam_papers;
CREATE POLICY "exam_papers_select" ON public.exam_papers FOR SELECT USING (true);
DROP POLICY IF EXISTS "exam_papers_write" ON public.exam_papers;
CREATE POLICY "exam_papers_write" ON public.exam_papers FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = ANY (ARRAY['teacher'::user_role, 'school_admin'::user_role, 'super_admin'::user_role]))
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = ANY (ARRAY['teacher'::user_role, 'school_admin'::user_role, 'super_admin'::user_role]))
);

DROP POLICY IF EXISTS "exam_sessions_own" ON public.exam_sessions;
CREATE POLICY "exam_sessions_own" ON public.exam_sessions FOR ALL USING (
  student_id = (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())
) WITH CHECK (
  student_id = (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid())
);
