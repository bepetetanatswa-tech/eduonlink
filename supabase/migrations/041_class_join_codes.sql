-- VOA/Educonnect (now EduOnLink) — Migration 041: student self-enrollment
-- via class join codes.
--
-- Closes the last blocked item from the Stage 6 push-notification audit:
-- "new student joined class" couldn't be wired up because no enrollment-
-- creation flow existed anywhere in the app at all (class_enrollments
-- could only ever be inserted by a teacher/school_admin/super_admin per
-- RLS, and nothing in the UI did even that for students - enrollments
-- only ever existed via seed data). Adds a short, shareable join code per
-- class and a SECURITY DEFINER RPC students can call to enroll themselves.

ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS join_code TEXT UNIQUE;

CREATE OR REPLACE FUNCTION public.generate_join_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; -- no 0/O/1/I — easy to read aloud/type
  code TEXT;
  exists_already BOOLEAN;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    SELECT EXISTS(SELECT 1 FROM public.classes WHERE join_code = code) INTO exists_already;
    EXIT WHEN NOT exists_already;
  END LOOP;
  RETURN code;
END;
$$;

-- Backfill existing classes.
UPDATE public.classes SET join_code = public.generate_join_code() WHERE join_code IS NULL;

ALTER TABLE public.classes ALTER COLUMN join_code SET NOT NULL;

-- New classes get a code automatically unless one is explicitly provided.
CREATE OR REPLACE FUNCTION public.set_class_join_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.join_code IS NULL THEN
    NEW.join_code := public.generate_join_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_class_join_code ON public.classes;
CREATE TRIGGER trg_set_class_join_code
  BEFORE INSERT ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.set_class_join_code();

-- Student self-enrollment by code. Runs as SECURITY DEFINER since the
-- existing class_enrollments INSERT policy only allows the class's own
-- teacher/school_admin/super_admin to create enrollment rows.
CREATE OR REPLACE FUNCTION public.join_class_by_code(p_code TEXT)
RETURNS TABLE(class_id UUID, class_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id UUID := public.get_my_profile_id();
  v_student_name TEXT;
  v_class RECORD;
  v_already_enrolled BOOLEAN;
BEGIN
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;

  SELECT id, name, teacher_id INTO v_class
  FROM public.classes WHERE join_code = upper(trim(p_code));

  IF v_class.id IS NULL THEN
    RAISE EXCEPTION 'Invalid join code';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.class_enrollments
    WHERE class_enrollments.class_id = v_class.id AND student_id = v_student_id AND status = 'active'
  ) INTO v_already_enrolled;

  IF v_already_enrolled THEN
    RAISE EXCEPTION 'Already enrolled in this class';
  END IF;

  INSERT INTO public.class_enrollments (class_id, student_id, status)
  VALUES (v_class.id, v_student_id, 'active')
  ON CONFLICT (class_id, student_id) DO UPDATE SET status = 'active';

  SELECT full_name INTO v_student_name FROM public.profiles WHERE id = v_student_id;

  IF v_class.teacher_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      v_class.teacher_id,
      'New student joined ' || v_class.name,
      COALESCE(v_student_name, 'A student') || ' joined your class using the join code.',
      'info',
      '/teacher/dashboard/classes/' || v_class.id || '/students'
    );
  END IF;

  RETURN QUERY SELECT v_class.id, v_class.name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_class_by_code(TEXT) TO authenticated;
