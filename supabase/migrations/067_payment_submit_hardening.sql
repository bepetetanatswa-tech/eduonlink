-- blacklisted_phones has RLS enabled but zero policies defined — Postgres
-- default-denies every command with no matching policy, so the client-side
-- blacklist check (`select ... from blacklisted_phones`) has always
-- silently returned no rows regardless of the actual blacklist, and the
-- admin's blacklist-add button has likely always failed too. Rather than
-- add policies, route both the check and the mutation exclusively through
-- service-role (payments submit route + a new admin blacklist route) —
-- no direct client access needed for either.
revoke insert, update, delete on public.blacklisted_phones from authenticated;
revoke select on public.blacklisted_phones from authenticated;

-- IP address logging for velocity/fraud checks on payment submission.
alter table public.payment_verifications add column if not exists ip_address text;
