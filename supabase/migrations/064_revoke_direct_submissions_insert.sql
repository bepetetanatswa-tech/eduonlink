-- The "assignments" plan gate (Student Pro required to submit) is a
-- TypeScript-side limit (src/lib/subscription/plans.ts) with no reliable
-- SQL-side equivalent to check in an RLS WITH CHECK clause. Route the
-- initial submission exclusively through /api/assignments/submit by
-- revoking INSERT from authenticated — a free-tier student can then never
-- create a submissions row via direct REST access, so there is nothing
-- for them to UPDATE either (UPDATE stays granted since teachers grade
-- submissions via direct client update in AssignmentManager.tsx, and a
-- gated student never gets past the missing row to begin with).
revoke insert on public.submissions from authenticated;
