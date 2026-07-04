-- VOA/Educonnect (now EduOnLink) — Migration 045: cover two foreign keys
-- flagged by Supabase's performance advisor as unindexed.
--
-- class_courses.added_by and class_resources.uploaded_by (both added in
-- migration 037) had no covering index, which can force a sequential
-- scan on lookups/joins by uploader/adder as the tables grow.

CREATE INDEX IF NOT EXISTS class_courses_added_by_idx ON public.class_courses(added_by);
CREATE INDEX IF NOT EXISTS class_resources_uploaded_by_idx ON public.class_resources(uploaded_by);
