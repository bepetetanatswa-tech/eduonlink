-- mockExams is a per-plan numeric monthly cap defined only in TypeScript
-- (src/lib/subscription/plans.ts), same reasoning as classes/submissions:
-- route the initial mock-exam attempt exclusively through
-- /api/exam-prep/start-mock (which counts this month's exam_sessions rows
-- against the plan limit using a service-role client) by revoking INSERT
-- from authenticated. UPDATE stays granted — submitMock() only completes
-- an existing session (scoring), it never creates a new attempt.
revoke insert on public.exam_sessions from authenticated;
