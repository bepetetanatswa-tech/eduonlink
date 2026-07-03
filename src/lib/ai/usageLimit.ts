/* eslint-disable @typescript-eslint/no-explicit-any */
export interface AiUsageRow {
  id: string;
  questions_used: number;
  tokens_used: number;
}

export interface AiQuota {
  limit: number | null; // null = unlimited
  used: number;
  usageRow: AiUsageRow | null;
}

const DEFAULT_FREE_DAILY_LIMIT = 5;
const STUDENT_PRO_DAILY_LIMIT = 20;

/**
 * Single source of truth for "how many AI questions has this user got left
 * today". Shared by /api/ai/chat and /api/ai/hbc so both routes agree.
 */
export async function resolveAiQuota(admin: any, profileId: string, role: string): Promise<AiQuota> {
  const today = new Date().toISOString().split("T")[0];

  const { data: usageRow } = await admin
    .from("ai_usage")
    .select("id, questions_used, tokens_used")
    .eq("user_id", profileId)
    .eq("date", today)
    .maybeSingle();

  const used: number = usageRow?.questions_used ?? 0;

  if (role !== "student") {
    return { limit: null, used, usageRow: usageRow ?? null };
  }

  // 1. Personal subscription — plan_key is the real plan slug (student_pro,
  // free_student, ...). `plan` is a legacy generic enum and must not be used.
  const { data: personalSub } = await admin
    .from("subscriptions")
    .select("plan_key, status")
    .eq("user_id", profileId)
    .in("status", ["active", "trial"])
    .maybeSingle();

  if (personalSub?.plan_key === "student_pro") {
    return { limit: STUDENT_PRO_DAILY_LIMIT, used, usageRow: usageRow ?? null };
  }

  // 2. School-tier — unlimited if the student's school has an active
  // school_* subscription.
  const { data: membership } = await admin
    .from("school_members")
    .select("school_id")
    .eq("user_id", profileId)
    .maybeSingle();

  if (membership?.school_id) {
    const { data: schoolSub } = await admin
      .from("subscriptions")
      .select("plan_key, status")
      .eq("school_id", membership.school_id)
      .in("status", ["active", "trial"])
      .maybeSingle();

    if (schoolSub?.plan_key?.startsWith("school_")) {
      return { limit: null, used, usageRow: usageRow ?? null };
    }
  }

  // 3. Free tier — admin-configurable, defaults to 5.
  const { data: settingRow } = await admin
    .from("platform_settings")
    .select("value")
    .eq("key", "free_ai_daily_limit")
    .maybeSingle();

  const parsed = Number(settingRow?.value);
  const limit = Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_FREE_DAILY_LIMIT;

  return { limit, used, usageRow: usageRow ?? null };
}

/** Increments today's usage row (creating it if absent). Non-fatal on error — caller should catch. */
export async function recordAiUsage(admin: any, profileId: string, usageRow: AiUsageRow | null, tokensUsed: number) {
  const today = new Date().toISOString().split("T")[0];
  if (usageRow) {
    await admin
      .from("ai_usage")
      .update({
        questions_used: usageRow.questions_used + 1,
        tokens_used: (usageRow.tokens_used ?? 0) + tokensUsed,
      })
      .eq("id", usageRow.id);
  } else {
    await admin
      .from("ai_usage")
      .insert({ user_id: profileId, date: today, questions_used: 1, tokens_used: tokensUsed });
  }
}
