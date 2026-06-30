-- ═══════════════════════════════════════════════════════════════
-- VOA — Migration 003: proper upsert trigger + fix stale profile
-- Run this in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Re-create trigger with proper UPSERT ──────────────────────
-- Old version used ON CONFLICT DO NOTHING, so re-registrations
-- with the same email didn't update any profile fields.
-- New version: UPSERT with COALESCE so existing non-null values
-- are preserved, missing values are filled from current metadata.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _role        TEXT;
  _form_level  TEXT;
  _years       INTEGER;
BEGIN
  -- Super admin detection
  _role := CASE WHEN NEW.email = 'bepetetanatswa@gmail.com'
                THEN 'super_admin'
                ELSE COALESCE(NEW.raw_user_meta_data->>'role', 'student')
           END;

  -- Validate form_level
  _form_level := NEW.raw_user_meta_data->>'form_level';
  IF _form_level IS NOT NULL AND _form_level NOT IN (
    'ecd','grade1','grade2','grade3','grade4','grade5','grade6','grade7',
    'form1','form2','form3','form4','form5','form6'
  ) THEN
    _form_level := NULL;
  END IF;

  -- Validate years_experience
  _years := CASE
    WHEN NEW.raw_user_meta_data->>'years_experience' ~ '^\d+$'
    THEN (NEW.raw_user_meta_data->>'years_experience')::INTEGER
    ELSE 0
  END;

  INSERT INTO public.profiles (
    id, email, role,
    first_name, last_name,
    form_level, school_id, school_name, province, school_type,
    enrolled_subjects, teaching_subjects,
    qualifications, bio, years_experience
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
    _years
  )
  ON CONFLICT (id) DO UPDATE SET
    -- Only fill in fields that are currently NULL/empty (don't overwrite user edits)
    role             = COALESCE(NULLIF(public.profiles.role, ''), EXCLUDED.role),
    first_name       = COALESCE(NULLIF(public.profiles.first_name, ''), EXCLUDED.first_name),
    last_name        = COALESCE(NULLIF(public.profiles.last_name, ''), EXCLUDED.last_name),
    school_name      = COALESCE(NULLIF(public.profiles.school_name, ''), EXCLUDED.school_name),
    province         = COALESCE(NULLIF(public.profiles.province, ''), EXCLUDED.province),
    school_type      = COALESCE(public.profiles.school_type, EXCLUDED.school_type),
    form_level       = COALESCE(public.profiles.form_level, EXCLUDED.form_level),
    enrolled_subjects  = COALESCE(public.profiles.enrolled_subjects, EXCLUDED.enrolled_subjects),
    teaching_subjects  = COALESCE(public.profiles.teaching_subjects, EXCLUDED.teaching_subjects),
    qualifications   = COALESCE(NULLIF(public.profiles.qualifications, ''), EXCLUDED.qualifications),
    years_experience = COALESCE(public.profiles.years_experience, EXCLUDED.years_experience),
    updated_at       = NOW();

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'handle_new_user error for %: % %', NEW.email, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$;

-- Re-attach trigger (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ── 2. Fix the existing super_admin profile row ──────────────────
-- The profile was created manually (trigger didn't fire for re-registration).
-- It has stale first_name='Taks' and missing school info.
-- We also set onboarding_completed=TRUE so the super admin goes
-- straight to the dashboard without the onboarding wizard.

UPDATE public.profiles
SET
  first_name           = 'Tanatswa',
  last_name            = 'Bepete',
  role                 = 'super_admin',
  school_name          = 'Eden Roses',
  province             = 'Manicaland',
  school_type          = 'private',
  onboarding_completed = TRUE,
  updated_at           = NOW()
WHERE email = 'bepetetanatswa@gmail.com';
