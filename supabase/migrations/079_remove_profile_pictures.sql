-- ═══════════════════════════════════════════════════════════════
-- EduOnLink — Migration 079: remove profile pictures
--
-- Product decision: drop profile-picture upload entirely. Initials-based
-- avatars (already the existing fallback everywhere avatar_url was
-- rendered) are now the only avatar presentation, app-wide.
--
-- The "avatars" and "profile-images" storage buckets (profile-images was
-- a dead, zero-object legacy duplicate — grep-confirmed unused in src/
-- before this migration) are NOT dropped here: Supabase blocks direct
-- SQL DELETE on storage.objects/storage.buckets
-- ("Direct deletion from storage tables is not allowed. Use the Storage
-- API instead.") — bucket cleanup has to go through the Storage
-- Management API or the Supabase Dashboard, not a SQL migration.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.profiles DROP COLUMN IF EXISTS avatar_url;
