-- ═══════════════════════════════════════════════════════════════
-- VOA — Migration 008: Critical RLS fix + privilege-escalation lockdown
-- Run this in: Supabase Dashboard → SQL Editor
--
-- Found during Stage 2 security audit (2026-07-02):
--
-- 1. get_my_profile_id() and is_super_admin() compare profiles.id to
--    auth.uid() — but profiles.id is an independently generated UUID,
--    NOT the auth user id (that's profiles.user_id). So both functions
--    always return NULL/false for every real user, including the real
--    super_admin. Every RLS policy that depends on them (schools,
--    profiles "select", parent_children "super admin") was silently
--    failing closed. parent_children's own two policies had the same
--    id/user_id mixup inline. my_role() already had it right — these
--    two functions did not, apparently regressed after migration 007.
--
-- 2. profiles has a blanket `GRANT ALL` to `authenticated` (migration
--    002) with only row-level RLS ("own row") restricting writes — no
--    column-level restriction. That means any signed-in user can call
--    PostgREST directly with the public anon key + their own session
--    and PATCH their own row's `role` to 'super_admin' (or flip
--    `is_approved`, or grant themselves a paid `subscription_plan`)
--    completely bypassing the app's /api/profile route and its safe
--    field whitelist. This migration closes that at the DB layer with
--    both a column-privilege REVOKE and a defense-in-depth trigger, so
--    a future well-meaning `GRANT ALL` doesn't silently reopen it.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Fix the id/auth.uid() mixup ────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  );
$$;

DROP POLICY IF EXISTS "Parent own links" ON public.parent_children;
CREATE POLICY "Parent own links" ON public.parent_children
  FOR ALL USING (parent_id = public.get_my_profile_id())
  WITH CHECK (parent_id = public.get_my_profile_id());

DROP POLICY IF EXISTS "Super admin all parent_children" ON public.parent_children;
CREATE POLICY "Super admin all parent_children" ON public.parent_children
  FOR ALL USING (public.is_super_admin());

-- ── 2. Close the privilege-escalation hole ────────────────────────

REVOKE UPDATE (
  id, user_id, email, role, is_approved, ztc_number,
  subscription_plan, subscription_expires_at, created_at
) ON public.profiles FROM authenticated;

REVOKE INSERT (
  role, is_approved, ztc_number,
  subscription_plan, subscription_expires_at
) ON public.profiles FROM authenticated;

-- Defense in depth: even if a future migration re-runs `GRANT ALL`
-- and reopens the column grants above, this trigger still blocks any
-- non-service-role, non-super-admin write to the sensitive fields.
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_user = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Not allowed to change role directly';
  END IF;

  IF NEW.is_approved IS DISTINCT FROM OLD.is_approved AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Not allowed to change approval status directly';
  END IF;

  IF (NEW.subscription_plan IS DISTINCT FROM OLD.subscription_plan
      OR NEW.subscription_expires_at IS DISTINCT FROM OLD.subscription_expires_at)
     AND NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Not allowed to change subscription directly';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();
