import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface AuditEntry {
  id: string;
  actor_email: string;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

const ACTION_COLOR: Record<string, string> = {
  approved: "#00E5A3",
  added: "#00E5A3",
  rejected: "#FF6B6B",
  deleted: "#FF6B6B",
};

function colorFor(action: string): string {
  for (const [k, c] of Object.entries(ACTION_COLOR)) {
    if (action.includes(k)) return c;
  }
  return "#4D7FFF";
}

export default async function AuditLogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id, role").eq("user_id", user.id).single();
  if (!profile || profile.role !== "super_admin") redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: entries } = await (supabase.from("admin_audit_log") as any)
    .select("id, actor_email, action, target_type, target_id, details, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (entries ?? []) as AuditEntry[];

  return (
    <div style={{ maxWidth: 1000, display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>Admin Audit Log</h2>
        <p style={{ fontSize: 12, color: "#4A5170", marginTop: 4 }}>{rows.length} most recent actions · append-only, cannot be edited or deleted by any admin</p>
      </div>

      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                {["When", "Admin", "Action", "Target", "Details"].map((h) => (
                  <th key={h} style={{ padding: "10px 18px", textAlign: "left", fontSize: 10, fontWeight: 600, color: "#4A5170", letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#4A5170", fontSize: 13 }}>No admin actions logged yet</td></tr>
              ) : rows.map((e) => (
                <tr key={e.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "10px 18px", fontSize: 11, color: "#6B7290", whiteSpace: "nowrap" }}>{new Date(e.created_at).toLocaleString()}</td>
                  <td style={{ padding: "10px 18px", fontSize: 12, color: "#CDD6F4" }}>{e.actor_email}</td>
                  <td style={{ padding: "10px 18px" }}>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6,
                      color: colorFor(e.action), background: `${colorFor(e.action)}18`, border: `1px solid ${colorFor(e.action)}35`,
                    }}>
                      {e.action}
                    </span>
                  </td>
                  <td style={{ padding: "10px 18px", fontSize: 11, color: "#4A5170", fontFamily: "monospace" }}>{e.target_type}{e.target_id ? ` · ${e.target_id.slice(0, 8)}` : ""}</td>
                  <td style={{ padding: "10px 18px", fontSize: 11, color: "#6B7290", maxWidth: 300 }}>
                    {e.details ? JSON.stringify(e.details) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
