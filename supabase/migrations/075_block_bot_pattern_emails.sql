-- ═══════════════════════════════════════════════════════════════
-- EduOnLink — Migration 075: hard-block bot-pattern local-parts too
--
-- Migration 074 added email_looks_bot_generated() as a soft signal
-- only (flagged_email on profiles, reviewed manually by admins).
-- Per explicit product decision, random-letters-and-numbers local
-- parts (e.g. xkqzpf7@gmail.com) should be rejected at registration
-- outright, same as a disposable-domain email — the domain isn't
-- what makes an email disposable/fake, a nonsense local-part on an
-- otherwise-legitimate domain is just as much a throwaway signup.
--
-- Extends block_disposable_email() (the BEFORE INSERT trigger on
-- auth.users from migration 074) to also reject on
-- email_looks_bot_generated(). profiles.flagged_email and the
-- AFTER INSERT computation in handle_new_user() are left in place —
-- harmless now (any email that would flag is already rejected before
-- handle_new_user ever runs) and still useful for a one-time backfill
-- against accounts that registered before this migration existed.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.block_disposable_email()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  _domain     TEXT := lower(split_part(NEW.email, '@', 2));
  _local_part TEXT := split_part(NEW.email, '@', 1);
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

  IF public.email_looks_bot_generated(_local_part) THEN
    RAISE EXCEPTION 'This email address looks auto-generated rather than a real address. Please register with your own personal email address.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

-- One-time backfill: flag existing accounts (pre-dating this block) whose
-- local-part matches the bot-pattern heuristic, so admins can review them.
UPDATE public.profiles
SET flagged_email = TRUE
WHERE flagged_email = FALSE
  AND public.email_looks_bot_generated(split_part(email, '@', 1));
