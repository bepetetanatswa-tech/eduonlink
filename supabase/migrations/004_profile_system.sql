-- ═══════════════════════════════════════════════════════════════
-- VOA — Migration 004: Profile System (Stage 9a — Student + Parent)
-- Run this in: Supabase Dashboard → SQL Editor
--
-- NOTE: migrations 001-003 describe a "profiles" schema that was
-- never actually applied — the live table only has:
--   id, user_id, full_name, email, role, avatar_url, phone,
--   created_at, updated_at
-- This migration extends THAT real schema (verified live via the
-- REST OpenAPI introspection endpoint on 2026-07-01), not the one
-- described in 001-003.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Extend profiles with onboarding/profile fields ────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name             TEXT,
  ADD COLUMN IF NOT EXISTS last_name              TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth          DATE,
  ADD COLUMN IF NOT EXISTS gender                 TEXT
    CHECK (gender IN ('male','female','other','prefer_not_to_say')),
  ADD COLUMN IF NOT EXISTS province               TEXT,
  ADD COLUMN IF NOT EXISTS district               TEXT,
  ADD COLUMN IF NOT EXISTS town                    TEXT,
  ADD COLUMN IF NOT EXISTS bio                     TEXT,
  -- School linkage: pick a registered school OR type one manually
  ADD COLUMN IF NOT EXISTS school_id               UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS school_name             TEXT,
  ADD COLUMN IF NOT EXISTS school_type             TEXT
    CHECK (school_type IN ('government','private','mission','international')),
  -- Student fields
  ADD COLUMN IF NOT EXISTS form_level              TEXT
    CHECK (form_level IN (
      'ecd','grade1','grade2','grade3','grade4','grade5','grade6','grade7',
      'form1','form2','form3','form4','form5','form6'
    )),
  ADD COLUMN IF NOT EXISTS enrolled_subjects       TEXT[],
  ADD COLUMN IF NOT EXISTS guardian_name           TEXT,
  ADD COLUMN IF NOT EXISTS guardian_phone          TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_name  TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
  -- Parent fields
  ADD COLUMN IF NOT EXISTS occupation              TEXT,
  ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT
    CHECK (preferred_contact_method IN ('email','sms','whatsapp')),
  -- Teacher fields (columns only for now — collected at registration
  -- today but silently dropped since profiles had nowhere to store
  -- them; wizard/UI for these lands in Stage 9b)
  ADD COLUMN IF NOT EXISTS qualifications          TEXT,
  ADD COLUMN IF NOT EXISTS years_experience         INTEGER,
  ADD COLUMN IF NOT EXISTS teaching_subjects        TEXT[],
  -- Onboarding progress
  ADD COLUMN IF NOT EXISTS onboarding_completed     BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_step          INTEGER NOT NULL DEFAULT 0;

-- Super admin founder account: never force through the wizard.
UPDATE public.profiles
SET onboarding_completed = TRUE
WHERE role = 'super_admin';

-- ── 2. Parent → Child links (did not exist live at all) ──────────

CREATE TABLE IF NOT EXISTS public.parent_children (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  child_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL DEFAULT 'guardian'
    CHECK (relationship IN ('mother','father','guardian','uncle','aunt','grandparent','other')),
  status       TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','verified','rejected')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (parent_id, child_id)
);

-- Safety net: if parent_children already existed from a prior partial run
-- of this migration, CREATE TABLE IF NOT EXISTS above is a no-op and won't
-- backfill a missing column — so add it explicitly too.
ALTER TABLE public.parent_children
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','verified','rejected'));

ALTER TABLE public.parent_children ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.parent_children TO authenticated, service_role;

DROP POLICY IF EXISTS "Parent manages own links" ON public.parent_children;
CREATE POLICY "Parent manages own links" ON public.parent_children
  FOR ALL USING (parent_id = public.get_my_profile_id())
  WITH CHECK (parent_id = public.get_my_profile_id());

DROP POLICY IF EXISTS "Child can view own links" ON public.parent_children;
CREATE POLICY "Child can view own links" ON public.parent_children
  FOR SELECT USING (child_id = public.get_my_profile_id());

DROP POLICY IF EXISTS "Super admin all parent links" ON public.parent_children;
CREATE POLICY "Super admin all parent links" ON public.parent_children
  FOR ALL USING (public.is_super_admin());

CREATE INDEX IF NOT EXISTS parent_children_parent_idx ON public.parent_children(parent_id);
CREATE INDEX IF NOT EXISTS parent_children_child_idx  ON public.parent_children(child_id);

-- ── 3. Storage policies for the (already-existing) avatars bucket ─
-- Bucket "avatars" already exists (public, 5MB, jpeg/png/webp) but
-- has never had upload policies wired up — nothing in the app
-- references it yet. Convention: object path = "{auth.uid()}/*".

DROP POLICY IF EXISTS "Avatar public read" ON storage.objects;
CREATE POLICY "Avatar public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
CREATE POLICY "Users upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users update own avatar" ON storage.objects;
CREATE POLICY "Users update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users delete own avatar" ON storage.objects;
CREATE POLICY "Users delete own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
