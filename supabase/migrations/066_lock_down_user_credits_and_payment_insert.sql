-- CRITICAL FIX: user_credits had a FOR ALL "credits_own" policy letting any
-- authenticated user INSERT/UPDATE/DELETE their own row directly — i.e.
-- any user could run `update user_credits set ai_questions = 999999 ...`
-- and grant themselves unlimited AI/mock-exam/PDF credits for free,
-- completely bypassing payment. Lock this down to read-only for regular
-- users; all writes now go through a service-role client only (the new
-- tryConsumeCredit() helper and the admin payment-approval route below).
drop policy if exists "credits_own" on public.user_credits;
create policy "credits_own_read" on public.user_credits
for select
using (user_id = auth.uid());

revoke insert, update, delete on public.user_credits from authenticated;

-- Defense in depth: a user could otherwise insert a payment_verifications
-- row with status already set to 'approved', verified_by/verified_at
-- pre-filled. Nothing currently trusts payment_verifications.status
-- directly to grant access (subscriptions/course_purchases/class_purchases
-- are the real gates, populated only via triggers or the admin approval
-- route), so this wasn't directly exploitable for free access -- but it
-- would pollute the admin queue and revenue analytics with fake
-- already-approved rows. Force new submissions to be pending and unverified.
drop policy if exists "payments: insert" on public.payment_verifications;
create policy "payments: insert" on public.payment_verifications
for insert
with check (
  is_super_admin()
  or (
    user_id = get_my_profile_id()
    and status = 'pending'
    and verified_by is null
    and verified_at is null
  )
);
