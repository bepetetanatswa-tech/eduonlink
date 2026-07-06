/* eslint-disable @typescript-eslint/no-explicit-any */
import { getPlan, PlanDefinition } from "@/lib/subscription/plans";

const STUDENT_TIERS = ["free_student", "student_pro", "student_pro_plus"];
const TEACHER_TIERS = ["free_teacher", "teacher_pro", "teacher_pro_plus"];

function higherTier(tiers: string[], a: string, b: string): string {
  const ai = tiers.indexOf(a);
  const bi = tiers.indexOf(b);
  return bi > ai ? b : a;
}

/**
 * Single source of truth for "what plan is this profile effectively on right
 * now" — checks the profile's own subscription first, then (mirroring the
 * precedent already established by the AI quota resolver) upgrades a
 * student/teacher to the Pro-equivalent tier if their school has an active
 * school_* subscription, since school plans grant "all Student/Teacher Pro
 * features" to enrolled members per the pricing spec. Never grants Pro Plus
 * via school membership — that tier is an individual add-on only.
 */
export async function resolveEffectivePlan(admin: any, profileId: string, role: string): Promise<PlanDefinition> {
  if (role !== "student" && role !== "teacher") {
    // Admins/parents aren't gated by these consumer plans.
    return getPlan(role === "school_admin" || role === "super_admin" ? "school_enterprise" : "student_pro_plus");
  }

  const tiers = role === "student" ? STUDENT_TIERS : TEACHER_TIERS;
  const freeKey = role === "student" ? "free_student" : "free_teacher";
  const proKey = role === "student" ? "student_pro" : "teacher_pro";

  const [{ data: personalSub }, { data: membership }] = await Promise.all([
    admin.from("subscriptions").select("plan_key, status").eq("user_id", profileId).in("status", ["active", "trial"]).maybeSingle(),
    admin.from("school_members").select("school_id").eq("user_id", profileId).maybeSingle(),
  ]);

  let planKey: string = tiers.includes(personalSub?.plan_key) ? personalSub.plan_key : freeKey;

  if (membership?.school_id) {
    const { data: schoolSub } = await admin
      .from("subscriptions")
      .select("plan_key, status")
      .eq("school_id", membership.school_id)
      .in("status", ["active", "trial"])
      .maybeSingle();

    if (schoolSub?.plan_key?.startsWith("school_")) {
      planKey = higherTier(tiers, planKey, proKey);
    }
  }

  return getPlan(planKey);
}
