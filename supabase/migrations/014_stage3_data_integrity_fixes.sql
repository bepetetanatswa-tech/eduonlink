-- ═══════════════════════════════════════════════════════════════
-- VOA — Migration 014: Stage 3 audit fixes
-- Run this in: Supabase Dashboard → SQL Editor
--
-- Found during Stage 3 audit (2026-07-02):
-- 1. 36 foreign-key columns had no covering index (slow joins + slow
--    cascade delete checks on every parent-row delete).
-- 2. 6 tables have an updated_at column but no trigger to maintain it
--    (ai_conversations, courses, hbc_projects, platform_settings,
--    schools, user_credits) — only `profiles` had one.
-- 3. Several "who did this" reference columns used NO ACTION instead
--    of SET NULL, meaning deleting that profile would hard-fail
--    instead of just clearing the reference.
-- 4. ZIMSEC subjects seed was missing 10 required subjects across
--    Primary/O-Level/A-Level (see subjects INSERT below).
-- 5. No DB-backed HBC stage template reference data existed — the six
--    stage names/descriptions were only hardcoded in
--    src/app/api/ai/hbc/route.ts. Seeded a proper reference table with
--    the exact same content so it has a single source of truth.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Indexes on every unindexed FK column ───────────────────────

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_actor_id ON public.admin_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_conversation_id ON public.ai_usage(conversation_id);
CREATE INDEX IF NOT EXISTS idx_announcement_reads_user_id ON public.announcement_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_announcements_author_id ON public.announcements(author_id);
CREATE INDEX IF NOT EXISTS idx_assignments_created_by ON public.assignments(created_by);
CREATE INDEX IF NOT EXISTS idx_attendance_marked_by ON public.attendance(marked_by);
CREATE INDEX IF NOT EXISTS idx_blacklisted_phones_created_by ON public.blacklisted_phones(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_moderations_class_id ON public.chat_moderations(class_id);
CREATE INDEX IF NOT EXISTS idx_chat_moderations_muted_by ON public.chat_moderations(muted_by);
CREATE INDEX IF NOT EXISTS idx_chat_moderations_user_id ON public.chat_moderations(user_id);
CREATE INDEX IF NOT EXISTS idx_course_materials_course_id ON public.course_materials(course_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_course_id ON public.course_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_material_id ON public.course_progress(material_id);
CREATE INDEX IF NOT EXISTS idx_courses_created_by ON public.courses(created_by);
CREATE INDEX IF NOT EXISTS idx_exam_papers_uploaded_by ON public.exam_papers(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_student_id ON public.exam_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_assignment_id ON public.grades(assignment_id);
CREATE INDEX IF NOT EXISTS idx_hbc_stages_approved_by ON public.hbc_stages(approved_by);
CREATE INDEX IF NOT EXISTS idx_lesson_comments_author_id ON public.lesson_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_lesson_comments_lesson_id ON public.lesson_comments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_comments_parent_id ON public.lesson_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_lessons_created_by ON public.lessons(created_by);
CREATE INDEX IF NOT EXISTS idx_live_session_attendance_student_id ON public.live_session_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_teacher_id ON public.live_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON public.message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_user_id ON public.message_read_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_parent_id ON public.messages(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_children_child_id ON public.parent_children(child_id);
CREATE INDEX IF NOT EXISTS idx_payment_verifications_profile_id ON public.payment_verifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_payment_verifications_verified_by ON public.payment_verifications(verified_by);
CREATE INDEX IF NOT EXISTS idx_platform_settings_updated_by ON public.platform_settings(updated_by);
CREATE INDEX IF NOT EXISTS idx_schools_approved_by ON public.schools(approved_by);
CREATE INDEX IF NOT EXISTS idx_submissions_graded_by ON public.submissions(graded_by);
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_id ON public.subscriptions(payment_id);
CREATE INDEX IF NOT EXISTS idx_timetable_slots_class_id ON public.timetable_slots(class_id);
CREATE INDEX IF NOT EXISTS idx_timetable_slots_school_id ON public.timetable_slots(school_id);
CREATE INDEX IF NOT EXISTS idx_timetable_slots_teacher_id ON public.timetable_slots(teacher_id);

-- ── 2. updated_at triggers on the tables missing one ──────────────

DROP TRIGGER IF EXISTS trg_ai_conversations_updated_at ON public.ai_conversations;
CREATE TRIGGER trg_ai_conversations_updated_at BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_courses_updated_at ON public.courses;
CREATE TRIGGER trg_courses_updated_at BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_hbc_projects_updated_at ON public.hbc_projects;
CREATE TRIGGER trg_hbc_projects_updated_at BEFORE UPDATE ON public.hbc_projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_platform_settings_updated_at ON public.platform_settings;
CREATE TRIGGER trg_platform_settings_updated_at BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_schools_updated_at ON public.schools;
CREATE TRIGGER trg_schools_updated_at BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_user_credits_updated_at ON public.user_credits;
CREATE TRIGGER trg_user_credits_updated_at BEFORE UPDATE ON public.user_credits
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 3. NO ACTION → SET NULL on "who did this" reference columns ──
-- (audit-style references should survive the actor profile being
-- deleted, not block the delete entirely)

ALTER TABLE public.schools DROP CONSTRAINT IF EXISTS schools_approved_by_fkey;
ALTER TABLE public.schools ADD CONSTRAINT schools_approved_by_fkey
  FOREIGN KEY (approved_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_created_by_fkey;
ALTER TABLE public.courses ADD CONSTRAINT courses_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.exam_papers DROP CONSTRAINT IF EXISTS exam_papers_uploaded_by_fkey;
ALTER TABLE public.exam_papers ADD CONSTRAINT exam_papers_uploaded_by_fkey
  FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.platform_settings DROP CONSTRAINT IF EXISTS platform_settings_updated_by_fkey;
ALTER TABLE public.platform_settings ADD CONSTRAINT platform_settings_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_graded_by_fkey;
ALTER TABLE public.submissions ADD CONSTRAINT submissions_graded_by_fkey
  FOREIGN KEY (graded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.blacklisted_phones DROP CONSTRAINT IF EXISTS blacklisted_phones_created_by_fkey;
ALTER TABLE public.blacklisted_phones ADD CONSTRAINT blacklisted_phones_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ── 4. Missing ZIMSEC subjects ─────────────────────────────────────

UPDATE public.subjects SET name = 'Environmental Science' WHERE code = 'SCI-P';

INSERT INTO public.subjects (name, code, level, curriculum_type) VALUES
  ('Creative Arts',                'CA-P',        'primary', 'hbc'),
  ('Physical Education',           'PE-P',        'primary', 'hbc'),
  ('Religious and Moral Education','RME-O',       'o_level', 'hbc'),
  ('French',                       'FR-O',        'o_level', 'both'),
  ('Fashion & Fabrics',            'FF-O',        'o_level', 'hbc'),
  ('Food & Nutrition',             'FN-O',        'o_level', 'hbc'),
  ('Shona Literature',             'SHONALIT-A',  'a_level', 'hbc'),
  ('French',                       'FR-A',        'a_level', 'both'),
  ('Art',                          'ART-A',       'a_level', 'hbc')
ON CONFLICT (code) DO NOTHING;

-- ── 5. HBC stage template reference table ─────────────────────────
-- Mirrors the six stages already hardcoded in src/app/api/ai/hbc/route.ts
-- (STAGE_DEFS) — same names/descriptions, now with a DB source of truth.

CREATE TABLE IF NOT EXISTS public.hbc_stage_templates (
  stage_number SMALLINT PRIMARY KEY CHECK (stage_number BETWEEN 1 AND 6),
  name         TEXT NOT NULL,
  description  TEXT NOT NULL
);

ALTER TABLE public.hbc_stage_templates ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.hbc_stage_templates TO authenticated, anon;
GRANT ALL ON public.hbc_stage_templates TO service_role;

DROP POLICY IF EXISTS "Anyone can read HBC stage templates" ON public.hbc_stage_templates;
CREATE POLICY "Anyone can read HBC stage templates" ON public.hbc_stage_templates
  FOR SELECT USING (true);

INSERT INTO public.hbc_stage_templates (stage_number, name, description) VALUES
  (1, 'Topic Selection & Rationale',   'Is the topic clearly defined? Is the heritage connection to Zimbabwe explicit? Is the rationale personal and convincing?'),
  (2, 'Research & Data Collection',    'Are multiple sources cited? Is primary research (interviews, observation) mentioned? Is methodology described? Are Zimbabwean sources included?'),
  (3, 'Analysis & Interpretation',     'Does the student go beyond facts to analyse meaning? Are patterns identified? Is the heritage significance interpreted, not just described?'),
  (4, 'Presentation Planning',         'Is there a clear structure outlined? Are visual/multimedia elements planned? Is the audience considered?'),
  (5, 'Product/Presentation Creation', 'Does the product reflect genuine student effort? Is heritage content accurately presented? Is it creative and original?'),
  (6, 'Evaluation & Reflection',       'Is the reflection honest and personal? Does the student identify what they learned? Are both strengths and weaknesses acknowledged?')
ON CONFLICT (stage_number) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;
