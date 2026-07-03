-- ═══════════════════════════════════════════════════════════════
-- VOA/Educonnect — Migration 023: Per-type push notification preferences
-- Run this in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Presence of a row = that notification type is disabled for push, for that
-- user. Absence = enabled (the default) — avoids needing to seed a row per
-- type for every user.
CREATE TABLE IF NOT EXISTS public.disabled_push_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, type)
);

CREATE INDEX IF NOT EXISTS idx_disabled_push_types_user ON public.disabled_push_types(user_id);

ALTER TABLE public.disabled_push_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "disabled_push_types: select own" ON public.disabled_push_types FOR SELECT
  USING (user_id = get_my_profile_id());

CREATE POLICY "disabled_push_types: insert own" ON public.disabled_push_types FOR INSERT
  WITH CHECK (user_id = get_my_profile_id());

CREATE POLICY "disabled_push_types: delete own" ON public.disabled_push_types FOR DELETE
  USING (user_id = get_my_profile_id());

GRANT SELECT, INSERT, DELETE ON public.disabled_push_types TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.disabled_push_types TO service_role;

-- Extend the push trigger (migration 020) to skip the webhook call entirely
-- when the recipient has disabled push for this notification's type — no
-- HTTP round trip wasted on a type they don't want pushed.
CREATE OR REPLACE FUNCTION public.trigger_push_notification()
RETURNS TRIGGER AS $$
DECLARE
  secret TEXT;
  is_disabled BOOLEAN;
BEGIN
  BEGIN
    SELECT EXISTS(
      SELECT 1 FROM disabled_push_types WHERE user_id = NEW.user_id AND type = NEW.type
    ) INTO is_disabled;
    IF is_disabled THEN
      RETURN NEW;
    END IF;

    SELECT decrypted_secret INTO secret FROM vault.decrypted_secrets WHERE name = 'push_webhook_secret' LIMIT 1;
    PERFORM net.http_post(
      url := 'https://edu-production.vercel.app/api/push/send',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-push-secret', secret
      ),
      body := jsonb_build_object(
        'user_id', NEW.user_id,
        'title', NEW.title,
        'message', NEW.message,
        'link', NEW.link
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'trigger_push_notification failed (notification still saved): %', SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, vault;
