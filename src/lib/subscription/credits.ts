/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Atomically consumes one purchased credit of the given type, if the user
 * has any left. Uses an optimistic-concurrency guard (WHERE balance = last
 * known value) instead of a raw decrement so two simultaneous requests
 * can't both succeed off the same balance. Returns false (no-op) if the
 * user has no credits or the row doesn't exist — never throws.
 *
 * NOTE: user_credits.user_id references auth.users(id), NOT profiles.id
 * (unlike almost every other table in this app) — always pass the id from
 * supabase.auth.getUser(), never a profile id.
 */
export async function tryConsumeCredit(
  admin: any,
  authUserId: string,
  creditType: "ai_questions" | "mock_exams" | "pdf_downloads"
): Promise<boolean> {
  const { data } = await admin.from("user_credits").select(creditType).eq("user_id", authUserId).maybeSingle();
  const balance: number = data?.[creditType] ?? 0;
  if (balance <= 0) return false;

  const { data: updated } = await admin.from("user_credits")
    .update({ [creditType]: balance - 1, updated_at: new Date().toISOString() })
    .eq("user_id", authUserId)
    .eq(creditType, balance)
    .select("user_id")
    .maybeSingle();

  return !!updated;
}
