-- ═══════════════════════════════════════════════════════════════
-- VOA — Migration 027: fix silent-failure bugs found in Stage 3 reaudit
-- Run this in: Supabase Dashboard → SQL Editor
--
-- Reproduced against production via a disposable test user (2026-07-03):
-- 1. Admin Settings "Free AI Daily Limit" (and every other numeric/text
--    setting) save button fails with 42501 "permission denied for table
--    platform_settings" — the RLS policy allows super_admins to write,
--    but the table-level GRANT was SELECT-only for `authenticated`/`anon`.
--    RLS is a second gate on top of GRANTs, not a replacement for them.
-- 2. Avatar upload fails with 403 "new row violates row-level security
--    policy" — the `avatars` storage bucket has INSERT/UPDATE/DELETE
--    policies but no SELECT policy. Every other public bucket
--    (profile-images, course-pdfs, announcements, etc.) has one; the
--    Storage API's post-upload row return needs it even though public
--    read access itself goes through the RLS-bypassing
--    /object/public/ route.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. platform_settings: grant the writes RLS already intends to allow ──

GRANT INSERT, UPDATE ON public.platform_settings TO authenticated;

-- ── 2. avatars bucket: add the missing owner-scoped SELECT policy ──
-- (owner-only, not `true` — public avatar viewing goes through the
-- public-bucket URL bypass, not this RLS path, so no need to reopen the
-- "public bucket allows listing" surface that was already closed elsewhere)

DROP POLICY IF EXISTS "avatars_owner_select" ON storage.objects;
CREATE POLICY "avatars_owner_select" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);
