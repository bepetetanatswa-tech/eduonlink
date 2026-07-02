-- ═══════════════════════════════════════════════════════════════
-- VOA — Migration 007: fix public.get_my_profile_id()
-- Run this in: Supabase Dashboard → SQL Editor
--
-- get_my_profile_id() is used by RLS policies on parent_children
-- (migration 004) and schools (migration 005), but returns NULL for
-- a real authenticated user even though their profile row exists and
-- is directly readable — meaning every policy that depends on it has
-- been silently denying access. Redefining it explicitly as
-- SECURITY DEFINER guarantees it can read profiles regardless of
-- whatever RLS state that table is in, breaking any circular
-- dependency between the function and table-level RLS.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid();
$$;
