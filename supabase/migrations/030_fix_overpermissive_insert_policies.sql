-- ═══════════════════════════════════════════════════════════════
-- VOA — Migration 030: fix overly-permissive INSERT policies
-- Run this in: Supabase Dashboard → SQL Editor
--
-- Found during stage 1-6 audit: 3 tables had a WITH CHECK (true)
-- INSERT policy layered alongside a correctly-scoped one. RLS
-- policies for the same command are OR'd together, so the correct
-- policy was being completely bypassed by the permissive one —
-- any authenticated user could insert a payment_verifications or
-- subscriptions row for ANY user_id (forging paid status), or a
-- lesson_comments row impersonating any author_id.
--
-- payment_verifications/subscriptions: the correctly-scoped sibling
-- policy only ever failed to satisfy real inserts because the
-- client code was passing the wrong id (see the EcoCashPayment.tsx /
-- CoursePurchase.tsx / subscription page.tsx fixes in this same
-- commit) — now that's fixed, the scoped policy alone is sufficient
-- and the `true` escape hatch can be safely removed.
--
-- lesson_comments has no UI feature calling it anywhere in the app
-- (grepped, zero references) — tightened for defense in depth.
-- ═══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "pay_ver_own_insert" ON public.payment_verifications;
DROP POLICY IF EXISTS "sub_own_insert" ON public.subscriptions;

DROP POLICY IF EXISTS "lesson_comments_insert" ON public.lesson_comments;
CREATE POLICY "lesson_comments_insert" ON public.lesson_comments
  FOR INSERT
  WITH CHECK (author_id = get_my_profile_id());
