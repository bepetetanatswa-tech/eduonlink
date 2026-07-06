-- maxClasses is a per-plan numeric cap defined only in TypeScript
-- (src/lib/subscription/plans.ts) — there's no reliable way to enforce a
-- number that lives in application code purely via an RLS WITH CHECK
-- clause without duplicating it into SQL and letting the two drift apart.
-- Route class creation exclusively through /api/classes/create (which
-- checks the count against plans.ts using a service-role client) by
-- revoking the INSERT grant itself, not just adding an RLS policy —
-- this blocks a direct REST/PostgREST call with a user JWT before RLS
-- policies are even evaluated, so there is no bypass path left.
revoke insert on public.classes from authenticated;
