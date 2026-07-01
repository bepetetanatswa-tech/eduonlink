import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AIMonitorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: convos } = await (supabase.from("ai_conversations") as any)
    .select("id, student_id, created_at, messages")
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div style={{ maxWidth: 800, display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif" }}>AI Monitor</h2>
        <p style={{ fontSize: "12px", color: "#4A5170", marginTop: 2 }}>{(convos ?? []).length} Sir Taks conversations shown</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {(convos ?? []).length === 0 ? (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "40px", textAlign: "center", color: "#4A5170", fontSize: "13px" }}>
            No AI conversations yet
          </div>
        ) : (convos ?? []).map((c: { id: string; student_id: string; created_at: string; messages: unknown[] }) => (
          <div key={c.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: "12px", color: "#6B7290", fontFamily: "monospace" }}>Student: {c.student_id.slice(0, 8)}…</p>
              <p style={{ fontSize: "11px", color: "#4A5170", marginTop: 2 }}>{Array.isArray(c.messages) ? c.messages.length : 0} messages</p>
            </div>
            <p style={{ fontSize: "11px", color: "#4A5170" }}>{new Date(c.created_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
