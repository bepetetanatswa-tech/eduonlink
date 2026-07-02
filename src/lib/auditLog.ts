import { createAdminClient } from "@/lib/supabase/admin";

interface LogAdminActionInput {
  actorId: string | null;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  details?: Record<string, unknown> | null;
}

// Only ever call this with a service-role client (or from server code that
// already re-verified the caller is super_admin) — the DB grants no INSERT
// on admin_audit_log to `authenticated` at all, so this is the only path
// that can write a row.
export async function logAdminAction(input: LogAdminActionInput) {
  const admin = createAdminClient();
  const { error } = await admin.from("admin_audit_log").insert({
    actor_id: input.actorId,
    actor_email: input.actorEmail,
    action: input.action,
    target_type: input.targetType,
    target_id: input.targetId ?? null,
    details: input.details ?? null,
  });
  if (error) console.error("logAdminAction error:", error.message);
}
