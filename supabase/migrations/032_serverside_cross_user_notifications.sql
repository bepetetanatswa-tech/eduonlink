-- ═══════════════════════════════════════════════════════════════
-- VOA/Educonnect — Migration 032: move remaining cross-user notification
-- inserts server-side (SECURITY DEFINER), matching the pattern already
-- established in migration 026 for chat/DM notifications.
--
-- Root cause: the `notifications` INSERT policy only allows
-- `user_id = get_my_profile_id()` (or super_admin). Several client
-- components were inserting notification rows for OTHER users directly
-- from the browser (RLS-bound) client:
--   - AttendanceMarker.tsx  (teacher -> parent, attendance alert)
--   - GradeBook.tsx         (teacher -> student, grade posted)
--   - AnnouncementForm.tsx  (teacher/school_admin -> many users)
--   - broadcast/page.tsx    (super_admin -> many users — this one
--                            actually succeeds today via the is_super_admin()
--                            bypass, but duplicates AnnouncementForm's bug:
--                            message truncated to N chars with NO ellipsis,
--                            so long announcements/broadcasts end mid-
--                            sentence — the "notification banner is cut off"
--                            symptom reported in testing)
--   - LiveClassRoom.tsx     (teacher -> students, "class is live")
--
-- All of the first four (non-admin) callers were silently no-oping:
-- the insert is rejected by RLS, swallowed because none of these call
-- sites checked the insert's error/count, so nothing ever reached the
-- recipient or their phone.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Attendance alerts (teacher -> confirmed parents of absent/late students) ──

CREATE OR REPLACE FUNCTION public.notify_attendance_alerts(p_class_id UUID, p_date DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID := public.get_my_profile_id();
  v_class_name TEXT;
BEGIN
  IF v_caller_id IS NULL THEN
    RETURN;
  END IF;

  SELECT name INTO v_class_name FROM public.classes
  WHERE id = p_class_id AND teacher_id = v_caller_id;

  IF v_class_name IS NULL THEN
    RETURN; -- caller isn't the teacher of this class
  END IF;

  INSERT INTO public.notifications (user_id, title, message, type, link)
  SELECT DISTINCT pc.parent_id,
         'Attendance Alert',
         prof.full_name || ' was marked ' || a.status || ' in ' || v_class_name || ' on ' || to_char(p_date, 'YYYY-MM-DD'),
         'warning',
         '/parent/dashboard'
  FROM public.attendance a
  JOIN public.parent_children pc ON pc.child_id = a.student_id AND pc.status = 'confirmed'
  JOIN public.profiles prof ON prof.id = a.student_id
  WHERE a.class_id = p_class_id AND a.date = p_date AND a.status IN ('absent', 'late');
END;
$$;

-- ── 2. Grade posted (teacher -> the specific students just graded) ──

CREATE OR REPLACE FUNCTION public.notify_grades_posted(p_class_id UUID, p_student_ids UUID[], p_term SMALLINT, p_subject TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID := public.get_my_profile_id();
  v_class_exists BOOLEAN;
BEGIN
  IF v_caller_id IS NULL THEN
    RETURN;
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.classes WHERE id = p_class_id AND teacher_id = v_caller_id) INTO v_class_exists;
  IF NOT v_class_exists THEN
    RETURN;
  END IF;

  INSERT INTO public.notifications (user_id, title, message, type, link)
  SELECT ce.student_id, 'Grades Updated',
         'Your Term ' || p_term || ' ' || COALESCE(p_subject, '') || ' grade has been posted',
         'grade', '/student/dashboard/grades'
  FROM public.class_enrollments ce
  WHERE ce.class_id = p_class_id AND ce.status = 'active' AND ce.student_id = ANY(p_student_ids);
END;
$$;

-- ── 3. Announcement posted (author -> targeted users, with a real preview) ──

CREATE OR REPLACE FUNCTION public.notify_announcement(p_announcement_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID := public.get_my_profile_id();
  v_ann RECORD;
  v_preview TEXT;
BEGIN
  IF v_caller_id IS NULL THEN
    RETURN;
  END IF;

  SELECT * INTO v_ann FROM public.announcements WHERE id = p_announcement_id AND author_id = v_caller_id;
  IF v_ann IS NULL THEN
    RETURN; -- caller isn't the author
  END IF;

  v_preview := CASE WHEN length(v_ann.content) > 140 THEN left(v_ann.content, 140) || '…' ELSE v_ann.content END;

  INSERT INTO public.notifications (user_id, title, message, type, link)
  SELECT p.id,
         CASE WHEN v_ann.is_emergency THEN '🚨 Emergency: ' || v_ann.title ELSE v_ann.title END,
         v_preview,
         CASE WHEN v_ann.is_emergency THEN 'warning' ELSE 'announcement' END,
         '/' || p.role || '/dashboard/announcements'
  FROM public.profiles p
  WHERE p.id <> v_caller_id
    AND (v_ann.target_role IS NULL OR p.role = v_ann.target_role);
END;
$$;

-- ── 4. Live class started (teacher -> enrolled students) ──

CREATE OR REPLACE FUNCTION public.notify_live_class_started(p_session_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID := public.get_my_profile_id();
  v_session RECORD;
  v_class_name TEXT;
BEGIN
  IF v_caller_id IS NULL THEN
    RETURN;
  END IF;

  SELECT * INTO v_session FROM public.live_sessions
  WHERE id = p_session_id AND teacher_id = v_caller_id;
  IF v_session IS NULL THEN
    RETURN;
  END IF;

  SELECT name INTO v_class_name FROM public.classes WHERE id = v_session.class_id;

  INSERT INTO public.notifications (user_id, title, message, type, link)
  SELECT ce.student_id,
         COALESCE(v_class_name, 'Class') || ' is now LIVE!',
         v_session.title,
         'info',
         '/student/dashboard/classes/' || v_session.class_id || '/live'
  FROM public.class_enrollments ce
  WHERE ce.class_id = v_session.class_id AND ce.status = 'active';
END;
$$;

GRANT EXECUTE ON FUNCTION public.notify_attendance_alerts(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_grades_posted(UUID, UUID[], SMALLINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_announcement(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_live_class_started(UUID) TO authenticated;
