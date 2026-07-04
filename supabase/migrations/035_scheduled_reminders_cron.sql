-- VOA/Educonnect — Migration 035: cron-driven reminders (live class starting
-- in 15 min, subscription expiring in ~3 days).
--
-- Both of these are time-based, not triggered by a user action, so they
-- can't be a client-called RPC like the rest of the notification fixes.
-- Vercel Cron on the Hobby tier only runs once per day, which can't
-- deliver a timely "15 minutes before class" warning — so this runs
-- inside Postgres via pg_cron instead, independent of hosting-plan
-- limits. Inserting into public.notifications reuses the existing
-- AFTER INSERT trigger (migration 020) that fires the web-push webhook,
-- so no separate push-sending code is needed here.

CREATE EXTENSION IF NOT EXISTS pg_cron;

ALTER TABLE public.live_sessions ADD COLUMN IF NOT EXISTS reminder_15_sent BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS expiry_reminder_sent BOOLEAN NOT NULL DEFAULT FALSE;

CREATE OR REPLACE FUNCTION public.send_scheduled_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Live class starting in 15 minutes (checked on a 15-min cron tick, so
  -- this window is wide enough to always catch a session exactly once).
  INSERT INTO public.notifications (user_id, title, message, type, link)
  SELECT ce.student_id,
         c.name || ' starts in 15 minutes',
         ls.title,
         'info',
         '/student/dashboard/classes/' || ls.class_id || '/live'
  FROM public.live_sessions ls
  JOIN public.classes c ON c.id = ls.class_id
  JOIN public.class_enrollments ce ON ce.class_id = ls.class_id AND ce.status = 'active'
  WHERE ls.status = 'scheduled'
    AND ls.reminder_15_sent = FALSE
    AND ls.scheduled_at BETWEEN now() + INTERVAL '10 minutes' AND now() + INTERVAL '20 minutes';

  UPDATE public.live_sessions
  SET reminder_15_sent = TRUE
  WHERE status = 'scheduled'
    AND reminder_15_sent = FALSE
    AND scheduled_at BETWEEN now() + INTERVAL '10 minutes' AND now() + INTERVAL '20 minutes';

  -- Subscription expiring in ~3 days.
  INSERT INTO public.notifications (user_id, title, message, type, link)
  SELECT s.user_id,
         'Subscription expiring soon',
         'Your ' || COALESCE(s.plan_key, s.plan::text) || ' plan expires on ' || to_char(s.end_date, 'YYYY-MM-DD') || '. Renew to keep full access.',
         'payment',
         '/' || p.role || '/dashboard/subscription'
  FROM public.subscriptions s
  JOIN public.profiles p ON p.id = s.user_id
  WHERE s.status = 'active'
    AND s.expiry_reminder_sent = FALSE
    AND s.end_date BETWEEN now() + INTERVAL '2 days 12 hours' AND now() + INTERVAL '3 days 12 hours';

  UPDATE public.subscriptions
  SET expiry_reminder_sent = TRUE
  WHERE status = 'active'
    AND expiry_reminder_sent = FALSE
    AND end_date BETWEEN now() + INTERVAL '2 days 12 hours' AND now() + INTERVAL '3 days 12 hours';
END;
$$;

SELECT cron.schedule(
  'send-scheduled-reminders',
  '*/15 * * * *',
  $$ SELECT public.send_scheduled_reminders(); $$
);
