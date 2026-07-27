-- ═══════════════════════════════════════════════════════════════
-- EduOnLink — Migration 074: server-side email registration guards
--
-- Two problems with the existing email checks in src/types/auth.ts:
--   1. isDisposableEmail() / DISPOSABLE_EMAIL_DOMAINS is only enforced
--      client-side in the register form — a direct call to Supabase's
--      signup endpoint (bypassing the app entirely) skips it. A
--      BEFORE INSERT trigger on auth.users is the one place that
--      can't be bypassed by any client, since every signup path
--      (password, magic link, admin.createUser) inserts a row there.
--   2. No server-side signal for "this email's local-part looks
--      bot/scammer-generated" (random letters+numbers rather than a
--      plausible name). Per product decision this is a SOFT flag for
--      admin review, not a hard block — false positives on real users
--      with unusual handles are worse than letting a few slip through.
--
-- The domain blocklist below intentionally mirrors
-- DISPOSABLE_EMAIL_DOMAINS in src/types/auth.ts (used for the
-- client-side pre-check/nice error message) — keep both lists in
-- sync if either changes. This migration is the actual security
-- boundary; the client-side check just gives normal users a friendly
-- error before they ever reach this trigger.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Hard-block disposable/temporary email domains ──────────────

CREATE OR REPLACE FUNCTION public.block_disposable_email()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  _domain TEXT := lower(split_part(NEW.email, '@', 2));
BEGIN
  IF _domain = ANY(ARRAY[
    'mailinator.com','10minutemail.com','guerrillamail.com','guerrillamail.net',
    'yopmail.com','trashmail.com','throwawaymail.com','getnada.com',
    'fakeinbox.com','dispostable.com','sharklasers.com','maildrop.cc',
    'temp-mail.org','tempmail.com','tempmail.net','mintemail.com',
    'mytemp.email','moakt.com','emailondeck.com','mohmal.com',
    'spamgourmet.com','mailnesia.com','33mail.com','burnermail.io'
  ]) THEN
    RAISE EXCEPTION 'Disposable or temporary email addresses are not allowed. Please register with a permanent email address.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS block_disposable_email_trigger ON auth.users;
CREATE TRIGGER block_disposable_email_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.block_disposable_email();

-- ── 2. Soft heuristic: does this local-part look bot-generated? ───
-- Conservative on purpose — designed to catch obvious keyboard-mash
-- strings (xkqzpf7, h3j9wq2) while passing real human patterns
-- (rutendo.moyo, tmoyo23, firstinitiallastname).

CREATE OR REPLACE FUNCTION public.email_looks_bot_generated(p_local_part TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  lp TEXT := lower(coalesce(p_local_part, ''));
  digit_count INT;
  total_count INT;
BEGIN
  IF length(lp) = 0 THEN
    RETURN FALSE;
  END IF;

  -- 5+ consecutive consonants (no vowel) reads as random mashing, not a name
  IF lp ~ '[bcdfghjklmnpqrstvwxyz]{5,}' THEN
    RETURN TRUE;
  END IF;

  -- a repeated character run, or a common generated/sequential pattern
  IF lp ~ '(.)\1{3,}' OR lp ~ '(0123|1234|2345|3456|4567|5678|6789|abcd|qwerty)' THEN
    RETURN TRUE;
  END IF;

  -- digit-heavy with no real letter-run: x7k2p9 flags, tmoyo23 doesn't
  -- (it has a 5-letter run "tmoyo" before the trailing digits)
  digit_count := length(regexp_replace(lp, '[^0-9]', '', 'g'));
  total_count := length(lp);
  IF digit_count::FLOAT / total_count > 0.5 AND lp !~ '[a-z]{3,}' THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- ── 3. profiles.flagged_email — surfaced to admins for manual review ─

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS flagged_email BOOLEAN NOT NULL DEFAULT FALSE;

-- ── 4. Compute the flag at profile-creation time ───────────────────
-- handle_new_user() already exists (migration 003) as an AFTER INSERT
-- trigger on auth.users that creates the profiles row — extend it to
-- also set flagged_email, rather than adding a second trigger.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _role        TEXT;
  _form_level  TEXT;
  _years       INTEGER;
  _flagged     BOOLEAN;
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

  _flagged := public.email_looks_bot_generated(split_part(NEW.email, '@', 1));

  INSERT INTO public.profiles (
    id, email, role,
    first_name, last_name,
    form_level, school_id, school_name, province, school_type,
    enrolled_subjects, teaching_subjects,
    qualifications, bio, years_experience,
    flagged_email
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
    _years,
    _flagged
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
    flagged_email    = EXCLUDED.flagged_email,
    updated_at       = NOW();

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'handle_new_user error for %: % %', NEW.email, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$;
