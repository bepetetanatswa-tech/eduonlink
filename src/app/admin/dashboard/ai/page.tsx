/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AIMonitorClient } from "./AIMonitorClient";

// Gemini 1.5 Flash blended rate ($0.075/1M input + $0.30/1M output tokens,
// averaged) — tokens_used only stores a combined total, not the
// input/output split, and the app has a multi-provider fallback
// (src/lib/ai/providers.ts) so a request may not have been served by
// Gemini at all. This is a rough estimate, not a real billing figure.
const ESTIMATED_COST_PER_1K_TOKENS = 0.00015;

export default async function AIMonitorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: rawConvos } = await (supabase.from("ai_conversations") as any)
    .select(`
      id, student_id, subject, title, messages, created_at, updated_at, flagged, flag_reason,
      profiles!student_id(full_name, email, school_id)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  // profiles.school_id isn't a formal FK to schools (no constraint exists),
  // so PostgREST can't embed it directly — resolve school names separately.
  const schoolIds = Array.from(new Set((rawConvos ?? []).map((c: any) => c.profiles?.school_id).filter(Boolean)));
  const { data: schoolRows } = schoolIds.length
    ? await (supabase.from("schools") as any).select("id, name").in("id", schoolIds)
    : { data: [] };
  const schoolNameById = new Map((schoolRows ?? []).map((s: { id: string; name: string }) => [s.id, s.name]));

  const convos = (rawConvos ?? []).map((c: any) => ({
    ...c,
    profiles: c.profiles ? { ...c.profiles, schools: c.profiles.school_id ? { name: schoolNameById.get(c.profiles.school_id) ?? null } : null } : null,
  }));

  const today = new Date().toISOString().split("T")[0];
  const { data: usageRows } = await (supabase.from("ai_usage") as any)
    .select("user_id, questions_used")
    .eq("date", today)
    .order("questions_used", { ascending: false })
    .limit(20);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const { data: recentUsage } = await (supabase.from("ai_usage") as any)
    .select("tokens_used")
    .gte("date", thirtyDaysAgo);

  const { data: settingRow } = await (supabase.from("platform_settings") as any)
    .select("value").eq("key", "free_ai_daily_limit").maybeSingle();

  const totalConvos = (convos ?? []).length;
  const totalQuestionsToday = (usageRows ?? []).reduce((sum: number, r: { questions_used: number }) => sum + (r.questions_used ?? 0), 0);
  const activeUsersToday = (usageRows ?? []).length;
  const tokens30d = (recentUsage ?? []).reduce((sum: number, r: { tokens_used: number }) => sum + (r.tokens_used ?? 0), 0);
  const estimatedCost30d = (tokens30d / 1000) * ESTIMATED_COST_PER_1K_TOKENS;
  const dailyLimit = Number(settingRow?.value) || 10;

  // Most common opening questions — group first user-role message per
  // conversation by normalized text, count frequency.
  const openingCounts = new Map<string, number>();
  for (const c of convos ?? []) {
    const msgs = Array.isArray(c.messages) ? c.messages : [];
    const firstUserMsg = msgs.find((m: any) => m.role === "user");
    if (!firstUserMsg?.content) continue;
    const normalized = String(firstUserMsg.content).trim().toLowerCase().slice(0, 120);
    if (!normalized) continue;
    openingCounts.set(normalized, (openingCounts.get(normalized) ?? 0) + 1);
  }
  const topQuestions = Array.from(openingCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([text, count]) => ({ text, count }));

  // Usage per school
  const schoolCounts = new Map<string, number>();
  for (const c of convos ?? []) {
    const schoolName = c.profiles?.schools?.name ?? "No school linked";
    schoolCounts.set(schoolName, (schoolCounts.get(schoolName) ?? 0) + 1);
  }
  const bySchool = Array.from(schoolCounts.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <AIMonitorClient
      convos={convos ?? []}
      usageRows={usageRows ?? []}
      totalConvos={totalConvos}
      totalQuestionsToday={totalQuestionsToday}
      activeUsersToday={activeUsersToday}
      estimatedCost30d={estimatedCost30d}
      dailyLimit={dailyLimit}
      topQuestions={topQuestions}
      bySchool={bySchool}
    />
  );
}
