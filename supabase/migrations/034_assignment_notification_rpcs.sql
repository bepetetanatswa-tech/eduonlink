-- VOA/Educonnect — Migration 034: assignment posted / submitted notifications.
--
-- Two of the Stage 6 push-notification events were never wired up at all:
-- "assignment posted" (teacher -> enrolled students) and "student submitted
-- assignment" (student -> class teacher). Both follow the same
-- SECURITY DEFINER pattern as migration 032/026 since the notifications
-- RLS insert policy only allows user_id = the caller's own profile.

CREATE OR REPLACE FUNCTION public.notify_assignment_posted(p_assignment_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID := public.get_my_profile_id();
  v_class_id UUID;
  v_class_name TEXT;
  v_title TEXT;
BEGIN
  IF v_caller_id IS NULL THEN
    RETURN;
  END IF;

  SELECT a.class_id, c.name, a.title INTO v_class_id, v_class_name, v_title
  FROM public.assignments a
  JOIN public.classes c ON c.id = a.class_id
  WHERE a.id = p_assignment_id AND c.teacher_id = v_caller_id;

  IF v_class_id IS NULL THEN
    RETURN; -- caller isn't the teacher of this assignment's class
  END IF;

  INSERT INTO public.notifications (user_id, title, message, type, link)
  SELECT ce.student_id,
         'New assignment: ' || v_title,
         v_title || ' has been posted for ' || v_class_name,
         'assignment', '/student/dashboard/assignments'
  FROM public.class_enrollments ce
  WHERE ce.class_id = v_class_id AND ce.status = 'active';
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_assignment_submitted(p_assignment_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_id UUID := public.get_my_profile_id();
  v_teacher_id UUID;
  v_class_name TEXT;
  v_title TEXT;
  v_student_name TEXT;
BEGIN
  IF v_caller_id IS NULL THEN
    RETURN;
  END IF;

  SELECT c.teacher_id, c.name, a.title INTO v_teacher_id, v_class_name, v_title
  FROM public.assignments a
  JOIN public.classes c ON c.id = a.class_id
  WHERE a.id = p_assignment_id;

  IF v_teacher_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.submissions
    WHERE assignment_id = p_assignment_id AND student_id = v_caller_id
  ) THEN
    RETURN; -- caller has no submission for this assignment
  END IF;

  SELECT full_name INTO v_student_name FROM public.profiles WHERE id = v_caller_id;

  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (v_teacher_id,
          'New submission: ' || v_title,
          COALESCE(v_student_name, 'A student') || ' submitted ' || v_title || ' (' || v_class_name || ')',
          'assignment', '/teacher/dashboard/assignments');
END;
$$;

GRANT EXECUTE ON FUNCTION public.notify_assignment_posted(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_assignment_submitted(UUID) TO authenticated;
