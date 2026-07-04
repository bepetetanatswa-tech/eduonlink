-- VOA/Educonnect — Migration 037: class-course linking + class resources.
--
-- Two real gaps found while building the class detail page: (1) "Lessons"
-- had no relationship to a class at all in the schema (course materials
-- belong to courses, not classes), so a class's Lessons tab couldn't show
-- anything meaningfully scoped to that class; (2) "Resources" had no
-- table or UI anywhere — only an unused storage bucket reserved for it.

-- ── 1. class_courses: lets a teacher explicitly attach courses to a class ──

CREATE TABLE IF NOT EXISTS public.class_courses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id   UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  course_id  UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  added_by   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (class_id, course_id)
);

ALTER TABLE public.class_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "class_courses: select" ON public.class_courses
  FOR SELECT
  USING (public.is_super_admin() OR public.is_class_member(class_id));

CREATE POLICY "class_courses: insert" ON public.class_courses
  FOR INSERT
  WITH CHECK (public.is_super_admin() OR public.is_my_class_teacher(class_id));

CREATE POLICY "class_courses: delete" ON public.class_courses
  FOR DELETE
  USING (public.is_super_admin() OR public.is_my_class_teacher(class_id));

GRANT SELECT, INSERT, DELETE ON public.class_courses TO authenticated;

CREATE INDEX IF NOT EXISTS class_courses_class_idx ON public.class_courses(class_id);
CREATE INDEX IF NOT EXISTS class_courses_course_idx ON public.class_courses(course_id);

-- ── 2. class_resources: files a teacher shares with a specific class ──

CREATE TABLE IF NOT EXISTS public.class_resources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id    UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  file_url    TEXT NOT NULL,
  file_name   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.class_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "class_resources: select" ON public.class_resources
  FOR SELECT
  USING (public.is_super_admin() OR public.is_class_member(class_id));

CREATE POLICY "class_resources: insert" ON public.class_resources
  FOR INSERT
  WITH CHECK (public.is_super_admin() OR public.is_my_class_teacher(class_id));

CREATE POLICY "class_resources: delete" ON public.class_resources
  FOR DELETE
  USING (public.is_super_admin() OR public.is_my_class_teacher(class_id));

GRANT SELECT, INSERT, DELETE ON public.class_resources TO authenticated;

CREATE INDEX IF NOT EXISTS class_resources_class_idx ON public.class_resources(class_id);
