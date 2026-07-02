-- ═══════════════════════════════════════════════════════════════
-- VOA — Migration 006: fix schools.subscription_plan type mismatch
-- Run this in: Supabase Dashboard → SQL Editor
--
-- schools.subscription_plan was a Postgres ENUM with old values
-- (free/basic/premium/enterprise). src/lib/subscription/plans.ts —
-- the canonical plan list used by the Stage 8 payment system and
-- everywhere else in the app — uses newer keys (free_school,
-- school_starter, school_standard, school_pro, school_enterprise).
-- Any write of a real plan key has been failing with
-- "invalid input value for enum subscription_plan" since Stage 8.
-- Converting to TEXT removes the mismatch permanently — new plan
-- tiers can be added in plans.ts without ever needing a migration.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.schools ALTER COLUMN subscription_plan DROP DEFAULT;
ALTER TABLE public.schools ALTER COLUMN subscription_plan TYPE TEXT USING subscription_plan::TEXT;
ALTER TABLE public.schools ALTER COLUMN subscription_plan SET DEFAULT 'free_school';

-- Best-effort remap of old values to the new scheme so existing rows
-- aren't stuck on a plan key nothing in the app recognizes anymore.
UPDATE public.schools SET subscription_plan = 'free_school'      WHERE subscription_plan = 'free';
UPDATE public.schools SET subscription_plan = 'school_starter'   WHERE subscription_plan = 'basic';
UPDATE public.schools SET subscription_plan = 'school_standard'  WHERE subscription_plan = 'premium';
UPDATE public.schools SET subscription_plan = 'school_enterprise' WHERE subscription_plan = 'enterprise';
