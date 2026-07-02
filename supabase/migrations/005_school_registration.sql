-- ═══════════════════════════════════════════════════════════════
-- VOA — Migration 005: School Registration & Verification
-- Run this in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Extend schools with registration/verification fields ──────

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS type              TEXT
    CHECK (type IN ('government','private','mission','international')),
  ADD COLUMN IF NOT EXISTS district          TEXT,
  ADD COLUMN IF NOT EXISTS website           TEXT,
  ADD COLUMN IF NOT EXISTS status            TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected')),
  ADD COLUMN IF NOT EXISTS rejection_reason  TEXT;

-- Backfill: any school already marked is_verified=true (added manually by
-- super_admin before this migration) should read as approved, not pending.
UPDATE public.schools SET status = 'approved' WHERE is_verified = TRUE AND status = 'pending';

-- Keep admin_id nullable-but-unique so one profile can't accidentally
-- register the same school twice via a race.
ALTER TABLE public.schools
  ADD CONSTRAINT schools_admin_id_unique UNIQUE (admin_id);

-- ── 2. School admin may create/update only their own school row ──

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "School admin manages own school" ON public.schools;
CREATE POLICY "School admin manages own school" ON public.schools
  FOR ALL USING (admin_id = public.get_my_profile_id())
  WITH CHECK (admin_id = public.get_my_profile_id());

DROP POLICY IF EXISTS "Anyone can view approved schools" ON public.schools;
CREATE POLICY "Anyone can view approved schools" ON public.schools
  FOR SELECT USING (status = 'approved' OR admin_id = public.get_my_profile_id());

DROP POLICY IF EXISTS "Super admin all schools" ON public.schools;
CREATE POLICY "Super admin all schools" ON public.schools
  FOR ALL USING (public.is_super_admin());

-- ── 3. School logos — new Supabase Storage bucket ─────────────────
-- Public read (school profile pages are public). Writes are keyed on the
-- uploading admin's own profile id (not the school id) — same convention
-- as the avatars bucket — so upload works even before the schools row
-- exists yet (registration order: account → logo → schools row).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('school-logos', 'school-logos', TRUE, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "School logo public read" ON storage.objects;
CREATE POLICY "School logo public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'school-logos');

DROP POLICY IF EXISTS "Users upload own school logo" ON storage.objects;
CREATE POLICY "Users upload own school logo" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'school-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users update own school logo" ON storage.objects;
CREATE POLICY "Users update own school logo" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'school-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users delete own school logo" ON storage.objects;
CREATE POLICY "Users delete own school logo" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'school-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
