-- ═══════════════════════════════════════════════════════════════
-- VOA — Migration 009: fix the column-grant privilege escalation fix
-- Run this in: Supabase Dashboard → SQL Editor
--
-- Migration 008's column-level REVOKE didn't actually take effect: it
-- turns out `authenticated` held a TABLE-level GRANT ALL on profiles
-- (from migration 002's blanket grant), and column-level privileges in
-- Postgres are additive on top of a table-level grant — a column
-- REVOKE can't subtract from one. Verified live: after 008,
-- `authenticated` still had UPDATE on role/is_approved/subscription_plan.
--
-- Fix: revoke the table-level UPDATE/INSERT entirely and re-grant only
-- the exact self-editable columns, matching /api/profile's own
-- UPDATABLE_FIELDS whitelist — so a direct PostgREST call with the
-- public anon key can never do more than the app's own API route
-- already allows. Verified live afterward: authenticated has UPDATE on
-- only the safe fields below, and no INSERT at all (profile creation
-- only ever happens via the handle_new_user() trigger or the
-- service-role admin client in ensureProfileExists()).
-- ═══════════════════════════════════════════════════════════════

REVOKE UPDATE, INSERT ON public.profiles FROM authenticated;

GRANT UPDATE (
  first_name, last_name, date_of_birth, gender, phone,
  province, district, town, bio, avatar_url,
  school_id, school_name, form_level, enrolled_subjects,
  guardian_name, guardian_phone, emergency_contact_name, emergency_contact_phone,
  occupation, preferred_contact_method,
  onboarding_step, onboarding_completed
) ON public.profiles TO authenticated;
