-- ═══════════════════════════════════════════════════════════════
-- VOA — Auth Schema  (Run this in Supabase SQL Editor)
-- ═══════════════════════════════════════════════════════════════

-- ── Schools ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.schools (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  type         TEXT DEFAULT 'government' CHECK (type IN ('government','private','mission','international')),
  province     TEXT,
  district     TEXT,
  address      TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  admin_id     UUID,                        -- filled in after admin registers
  verified     BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Profiles ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email               TEXT NOT NULL UNIQUE,
  first_name          TEXT,
  last_name           TEXT,
  display_name        TEXT GENERATED ALWAYS AS (COALESCE(first_name || ' ' || last_name, email)) STORED,
  avatar_url          TEXT,
  phone               TEXT,
  role                TEXT NOT NULL DEFAULT 'student'
                      CHECK (role IN ('student','teacher','parent','school_admin','super_admin')),
  -- Student fields
  form_level          TEXT CHECK (form_level IN (
                        'ecd','grade1','grade2','grade3','grade4','grade5','grade6','grade7',
                        'form1','form2','form3','form4','form5','form6'
                      )),
  school_id           UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  school_name         TEXT,
  enrolled_subjects   TEXT[],
  -- Teacher fields
  teaching_subjects   TEXT[],
  qualifications      TEXT,
  bio                 TEXT,
  years_experience    INTEGER DEFAULT 0,
  qualification_docs  TEXT[],              -- Supabase Storage URLs
  -- Parent fields
  -- (links via parent_children table)
  -- School Admin fields
  -- Shared / onboarding
  onboarding_completed  BOOLEAN DEFAULT FALSE,
  onboarding_step       INTEGER DEFAULT 0,
  email_verified        BOOLEAN DEFAULT FALSE,
  is_active             BOOLEAN DEFAULT TRUE,
  last_seen_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── Parent → Child links ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.parent_children (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  child_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  verified   BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_id, child_id)
);

-- ── Auto-create profile on signup ────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _role TEXT;
BEGIN
  -- Super admin detection
  IF NEW.email = 'bepetetanatswa@gmail.com' THEN
    _role := 'super_admin';
  ELSE
    _role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  END IF;

  INSERT INTO public.profiles (
    id, email, role, first_name, last_name,
    form_level, school_id, school_name, enrolled_subjects,
    teaching_subjects, qualifications, bio, years_experience
  ) VALUES (
    NEW.id,
    NEW.email,
    _role,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'form_level',
    CASE
      WHEN NEW.raw_user_meta_data->>'school_id' IS NOT NULL
      THEN (NEW.raw_user_meta_data->>'school_id')::UUID
      ELSE NULL
    END,
    NEW.raw_user_meta_data->>'school_name',
    CASE
      WHEN NEW.raw_user_meta_data->'enrolled_subjects' IS NOT NULL
      THEN ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'enrolled_subjects'))
      ELSE NULL
    END,
    CASE
      WHEN NEW.raw_user_meta_data->'teaching_subjects' IS NOT NULL
      THEN ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'teaching_subjects'))
      ELSE NULL
    END,
    NEW.raw_user_meta_data->>'qualifications',
    NEW.raw_user_meta_data->>'bio',
    CASE
      WHEN NEW.raw_user_meta_data->>'years_experience' IS NOT NULL
      THEN (NEW.raw_user_meta_data->>'years_experience')::INTEGER
      ELSE 0
    END
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── Auto-update updated_at ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER schools_updated_at BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ── Row Level Security ────────────────────────────────────────────
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_children ENABLE ROW LEVEL SECURITY;

-- Profiles: users read/update own row; super_admin reads all
CREATE POLICY "Own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Super admin all profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Schools: public read, school_admin updates own
CREATE POLICY "Schools public read" ON public.schools
  FOR SELECT USING (TRUE);

CREATE POLICY "School admin manages own school" ON public.schools
  FOR ALL USING (
    admin_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Parent-children: parent sees own links
CREATE POLICY "Parent own links" ON public.parent_children
  FOR ALL USING (parent_id = auth.uid());

-- ── Indexes ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS profiles_role_idx      ON public.profiles(role);
CREATE INDEX IF NOT EXISTS profiles_school_idx    ON public.profiles(school_id);
CREATE INDEX IF NOT EXISTS profiles_email_idx     ON public.profiles(email);
CREATE INDEX IF NOT EXISTS parent_children_idx    ON public.parent_children(parent_id, child_id);
