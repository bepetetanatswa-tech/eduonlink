-- ═══════════════════════════════════════════════════════════════
-- VOA/Educonnect — Migration 026: server-side message notification RPCs
-- Run this in: Supabase Dashboard → SQL Editor
--
-- The notifications RLS insert policy only allows user_id = get_my_profile_id(),
-- i.e. a client can only ever create a notification row for themselves. The
-- class-chat and direct-message code paths try to insert notification rows
-- for the OTHER party (the recipient) directly from the client — that insert
-- is silently rejected by RLS, so recipients never actually receive a
-- notification. These SECURITY DEFINER functions move notification creation
-- server-side so it can target another user, while still validating the
-- caller actually has standing to notify that target.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.notify_class_message(p_class_id UUID, p_preview TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id UUID := public.get_my_profile_id();
  v_sender_name TEXT;
  v_class_name TEXT;
  v_teacher_id UUID;
  v_is_member BOOLEAN;
BEGIN
  IF v_sender_id IS NULL THEN
    RETURN;
  END IF;

  SELECT name, teacher_id INTO v_class_name, v_teacher_id
  FROM public.classes WHERE id = p_class_id;

  IF v_class_name IS NULL THEN
    RETURN;
  END IF;

  v_is_member := v_sender_id = v_teacher_id OR EXISTS (
    SELECT 1 FROM public.class_enrollments
    WHERE class_id = p_class_id AND student_id = v_sender_id AND status = 'active'
  );
  IF NOT v_is_member THEN
    RETURN;
  END IF;

  SELECT full_name INTO v_sender_name FROM public.profiles WHERE id = v_sender_id;

  INSERT INTO public.notifications (user_id, title, message, type, link)
  SELECT ce.student_id, 'New message in ' || v_class_name, v_sender_name || ': ' || p_preview,
         'message', '/student/dashboard/classes/' || p_class_id || '/chat'
  FROM public.class_enrollments ce
  WHERE ce.class_id = p_class_id AND ce.status = 'active' AND ce.student_id <> v_sender_id
    AND NOT EXISTS (SELECT 1 FROM public.muted_classes m WHERE m.user_id = ce.student_id AND m.class_id = p_class_id);

  IF v_teacher_id IS NOT NULL AND v_teacher_id <> v_sender_id
     AND NOT EXISTS (SELECT 1 FROM public.muted_classes m WHERE m.user_id = v_teacher_id AND m.class_id = p_class_id) THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (v_teacher_id, 'New message in ' || v_class_name, v_sender_name || ': ' || p_preview,
            'message', '/teacher/dashboard/classes/' || p_class_id || '/chat');
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_dm_message(p_recipient_id UUID, p_preview TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id UUID := public.get_my_profile_id();
  v_sender_name TEXT;
  v_recipient_role TEXT;
BEGIN
  IF v_sender_id IS NULL OR p_recipient_id = v_sender_id THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.blocked_users
    WHERE (blocker_id = v_sender_id AND blocked_id = p_recipient_id)
       OR (blocker_id = p_recipient_id AND blocked_id = v_sender_id)
  ) THEN
    RETURN;
  END IF;

  SELECT role INTO v_recipient_role FROM public.profiles WHERE id = p_recipient_id;
  IF v_recipient_role IS NULL THEN
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM public.muted_conversations WHERE user_id = p_recipient_id AND other_user_id = v_sender_id) THEN
    RETURN;
  END IF;

  SELECT full_name INTO v_sender_name FROM public.profiles WHERE id = v_sender_id;

  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (p_recipient_id, 'New message from ' || v_sender_name, p_preview, 'message',
          '/' || v_recipient_role || '/dashboard/messages?with=' || v_sender_id || '&focus=1');
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_dm_request(p_recipient_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id UUID := public.get_my_profile_id();
  v_sender_name TEXT;
  v_recipient_role TEXT;
BEGIN
  IF v_sender_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.dm_requests
    WHERE requester_id = v_sender_id AND recipient_id = p_recipient_id AND status = 'pending'
  ) THEN
    RETURN;
  END IF;

  SELECT role INTO v_recipient_role FROM public.profiles WHERE id = p_recipient_id;
  IF v_recipient_role IS NULL THEN
    RETURN;
  END IF;

  SELECT full_name INTO v_sender_name FROM public.profiles WHERE id = v_sender_id;

  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (p_recipient_id, 'Message request from ' || v_sender_name, 'wants to send you a message', 'message',
          '/' || v_recipient_role || '/dashboard/messages?with=' || v_sender_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.notify_class_message(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_dm_message(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_dm_request(UUID) TO authenticated;
