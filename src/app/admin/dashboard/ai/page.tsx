import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AIMonitorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: convos } = await (supabase.from("ai_conversations") as any)
    .select(`
      id, student_id, subject, title, created_at, updated_at,
      profiles!student_id(full_name, email)
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  const today = new Date().toISOString().split("T")[0];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usageRows } = await (supabase.from("ai_usage") as any)
    .select("user_id, questions_used")
    .eq("date", today)
    .order("questions_used", { ascending: false })
    .limit(20);

  const totalConvos = (convos ?? []).length;
  const totalQuestionsToday = (usageRows ?? []).reduce(
    (sum: number, r: { questions_used: number }) => sum + (r.questions_used ?? 0), 0
  );
  const activeUsersToday = (usageRows ?? []).length;

  return (
    <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>AI Monitor</h2>
        <p style={{ fontSize: 12, color: "#4A5170", marginTop: 4 }}>Sir Taks usage across all users</p>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
        {[
          { label: "Total Conversations", value: totalConvos, color: "#4D7FFF" },
          { label: "Questions Today", value: totalQuestionsToday, color: "#00E5A3" },
          { label: "Active Users Today", value: activeUsersToday, color: "#BD93F9" },
        ].map((s) => (
          <div key={s.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "16px 18px" }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: s.color, margin: "0 0 4px", fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</p>
            <p style={{ fontSize: 11, color: "#4A5170", margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Today's usage by user */}
      {(usageRows ?? []).length > 0 && (
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "#6B7290", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Today&apos;s Usage</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {(usageRows ?? []).map((r: { user_id: string; questions_used: number }) => (
              <div key={r.user_id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: "8px", background: "rgba(77,127,255,0.1)", border: "1px solid rgba(77,127,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#4D7FFF", fontWeight: 700 }}>
                  {r.questions_used}
                </div>
                <p style={{ fontSize: 12, color: "#8892B0", fontFamily: "monospace", margin: 0 }}>{r.user_id}</p>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 60, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min((r.questions_used / 10) * 100, 100)}%`, background: r.questions_used >= 10 ? "#F5A623" : "#00E5A3" }} />
                  </div>
                  <span style={{ fontSize: 10, color: "#4A5170" }}>{r.questions_used}/10</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conversations */}
      <div>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "#6B7290", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Recent Conversations</h3>
        {totalConvos === 0 ? (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "36px", textAlign: "center", color: "#4A5170", fontSize: 13 }}>
            No AI conversations yet — they&apos;ll appear here once students start using Sir Taks
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(convos ?? []).map((c: {
              id: string;
              student_id: string;
              subject: string | null;
              title: string | null;
              created_at: string;
              profiles: { full_name: string; email: string } | null;
            }) => (
              <div key={c.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: "9px", background: "rgba(189,147,249,0.1)", border: "1px solid rgba(189,147,249,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#BD93F9", flexShrink: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
                  {c.profiles?.full_name?.charAt(0).toUpperCase() ?? "?"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#CDD6F4", margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.profiles?.full_name ?? "Unknown Student"}
                  </p>
                  <p style={{ fontSize: 11, color: "#4A5170", margin: 0 }}>
                    {c.subject ?? "General"}{c.title ? ` · ${c.title}` : ""}
                  </p>
                </div>
                <div style={{ flexShrink: 0, textAlign: "right" }}>
                  <p style={{ fontSize: 11, color: "#4A5170", margin: 0 }}>{new Date(c.created_at).toLocaleDateString()}</p>
                  <p style={{ fontSize: 10, color: "#2A2D3E", margin: "2px 0 0" }}>{new Date(c.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
