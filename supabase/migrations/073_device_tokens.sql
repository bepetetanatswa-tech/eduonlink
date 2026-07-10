-- ═══════════════════════════════════════════════════════════════
-- EduOnLink — Migration 073: Native push device tokens
-- Run this in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════
--
-- Web Push (user_push_subscriptions, migration 020) covers browsers.
-- The Android app is a Capacitor WebView shell, and background push
-- delivery to a fully-closed WebView isn't reliable the way a native
-- FCM listener is — so native clients register an FCM token here
-- instead. /api/push/send (extended in this same change) sends to both:
-- Web Push subscriptions AND FCM tokens for a given user, best-effort,
-- same as the existing web push path.

CREATE TABLE IF NOT EXISTS public.user_device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL DEFAULT 'android' CHECK (platform IN ('android', 'ios')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON public.user_device_tokens(user_id);

ALTER TABLE public.user_device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "device_tokens: select own" ON public.user_device_tokens FOR SELECT
  USING (user_id = get_my_profile_id() OR is_super_admin());

CREATE POLICY "device_tokens: insert own" ON public.user_device_tokens FOR INSERT
  WITH CHECK (user_id = get_my_profile_id());

CREATE POLICY "device_tokens: delete own" ON public.user_device_tokens FOR DELETE
  USING (user_id = get_my_profile_id());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_device_tokens TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_device_tokens TO service_role;
