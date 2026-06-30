-- ═══════════════════════════════════════════════════════════════
-- VOA — Fix grants + harden trigger
-- Run this in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── 0. Add missing columns to profiles ──────────────────────────
-- province and school_type were collected in the register form but
-- the original schema had no columns to store them in.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS province    TEXT,
  ADD COLUMN IF NOT EXISTS school_type TEXT
    CHECK (school_type IN ('government','private','mission','international'));

-- ── 1. Grant missing table privileges ────────────────────────────
-- Tables created via SQL Editor don't get auto-grants like ones
-- created through the Supabase dashboard UI do.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON public.profiles        TO anon, authenticated, service_role;
GRANT ALL ON public.schools         TO anon, authenticated, service_role;
GRANT ALL ON public.parent_children TO anon, authenticated, service_role;

-- Also grant on any sequences (for serial/generated columns)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- ── 2. Re-create trigger function with exception handling ────────
-- The previous version had no exception handling — any DB error
-- (constraint violation, type mismatch, etc.) would surface as
-- "Database error saving new user" and roll back auth.users too.
-- Now we log the error to pg_log and let the auth user be created
-- even if the profile insert fails (profile can be re-created later).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _role TEXT;
  _form_level TEXT;
BEGIN
  -- Super admin detection
  IF NEW.email = 'bepetetanatswa@gmail.com' THEN
    _role := 'super_admin';
  ELSE
    _role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  END IF;

  -- Validate form_level against the allowed CHECK values
  _form_level := NEW.raw_user_meta_data->>'form_level';
  IF _form_level IS NOT NULL AND _form_level NOT IN (
    'ecd','grade1','grade2','grade3','grade4','grade5','grade6','grade7',
    'form1','form2','form3','form4','form5','form6'
  ) THEN
    _form_level := NULL;  -- silently ignore invalid value
  END IF;

  INSERT INTO public.profiles (
    id, email, role, first_name, last_name,
    form_level, school_id, school_name, province, school_type,
    enrolled_subjects, teaching_subjects, qualifications, bio, years_experience
  ) VALUES (
    NEW.id,
    NEW.email,
    _role,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    _form_level,
    CASE
      WHEN NEW.raw_user_meta_data->>'school_id' IS NOT NULL
      THEN (NEW.raw_user_meta_data->>'school_id')::UUID
      ELSE NULL
    END,
    NEW.raw_user_meta_data->>'school_name',
    NEW.raw_user_meta_data->>'province',
    NEW.raw_user_meta_data->>'school_type',
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
        AND NEW.raw_user_meta_data->>'years_experience' ~ '^\d+$'
      THEN (NEW.raw_user_meta_data->>'years_experience')::INTEGER
      ELSE 0
    END
  )
  ON CONFLICT DO NOTHING;  -- catches any unique constraint violation (id OR email)

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't block the auth user creation
  RAISE LOG 'handle_new_user error for %: % %', NEW.email, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$;

-- Re-attach trigger (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── 3. Confirm RLS policies exist (idempotent re-create) ─────────
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_children ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Own profile"             ON public.profiles;
DROP POLICY IF EXISTS "Super admin all profiles" ON public.profiles;

CREATE POLICY "Own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Super admin all profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

DROP POLICY IF EXISTS "Schools public read"           ON public.schools;
DROP POLICY IF EXISTS "School admin manages own school" ON public.schools;

CREATE POLICY "Schools public read" ON public.schools
  FOR SELECT USING (TRUE);

CREATE POLICY "School admin manages own school" ON public.schools
  FOR ALL USING (
    admin_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

DROP POLICY IF EXISTS "Parent own links" ON public.parent_children;
CREATE POLICY "Parent own links" ON public.parent_children
  FOR ALL USING (parent_id = auth.uid());
