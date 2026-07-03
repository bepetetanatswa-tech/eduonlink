-- ═══════════════════════════════════════════════════════════════
-- VOA/Educonnect — Migration 020: Web Push notifications
-- Run this in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TABLE IF NOT EXISTS public.user_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON public.user_push_subscriptions(user_id);

ALTER TABLE public.user_push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_subs: select own" ON public.user_push_subscriptions FOR SELECT
  USING (user_id = get_my_profile_id() OR is_super_admin());

CREATE POLICY "push_subs: insert own" ON public.user_push_subscriptions FOR INSERT
  WITH CHECK (user_id = get_my_profile_id());

CREATE POLICY "push_subs: delete own" ON public.user_push_subscriptions FOR DELETE
  USING (user_id = get_my_profile_id());

-- RLS alone isn't enough — Postgres also requires explicit table-level grants
-- before RLS policies even get evaluated for a role, including service_role.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_push_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_push_subscriptions TO service_role;

-- Shared secret lives in Vault, not embedded in the function body (which would
-- otherwise be readable indefinitely via pg_proc by anyone with DB access).
-- IMPORTANT: do not commit a real secret value here. Run this once by hand in
-- the SQL Editor with your own generated value substituted for
-- 'REPLACE_WITH_RANDOM_SECRET' (e.g. `openssl rand -hex 32`), matching
-- whatever you set as PUSH_WEBHOOK_SECRET in your env — this line is
-- intentionally a no-op placeholder in version control.
SELECT vault.create_secret(
  'REPLACE_WITH_RANDOM_SECRET',
  'push_webhook_secret',
  'Shared secret for the /api/push/send webhook, verified by that route'
) WHERE NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'push_webhook_secret');

-- Every notification insert (regardless of which feature created it) fires a
-- best-effort webhook to /api/push/send instead of refactoring every call
-- site that writes to `notifications`. If the domain changes, update the URL
-- below (and the equivalent Vercel env-based check inside the route stays
-- the same either way).
-- Wrapped in EXCEPTION so that any push failure (vault access, net.http_post,
-- a bad payload, whatever) can never roll back the actual notification insert
-- that triggered it — push delivery is strictly best-effort.
CREATE OR REPLACE FUNCTION public.trigger_push_notification()
RETURNS TRIGGER AS $$
DECLARE
  secret TEXT;
BEGIN
  BEGIN
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

DROP TRIGGER IF EXISTS notifications_push_trigger ON public.notifications;
CREATE TRIGGER notifications_push_trigger
  AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.trigger_push_notification();
