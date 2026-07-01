import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function SchoolsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: schools } = await (supabase.from("schools") as any)
    .select("id, name, province, subscription_plan, is_verified, created_at")
    .order("created_at", { ascending: false });

  return (
    <div style={{ maxWidth: 1000, display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif" }}>School Management</h2>
        <p style={{ fontSize: "12px", color: "#4A5170", marginTop: 2 }}>{(schools ?? []).length} registered schools</p>
      </div>
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                {["School", "Province", "Plan", "Status", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "10px", fontWeight: 600, color: "#4A5170", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(schools ?? []).length === 0 ? (
                <tr><td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "#4A5170", fontSize: "13px" }}>No schools registered yet</td></tr>
              ) : (schools ?? []).map((s: { id: string; name: string; province: string | null; subscription_plan: string; is_verified: boolean; created_at: string }) => (
                <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "14px 20px" }}>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#CDD6F4" }}>{s.name}</p>
                    <p style={{ fontSize: "11px", color: "#4A5170" }}>{new Date(s.created_at).toLocaleDateString()}</p>
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: "12px", color: "#6B7290" }}>{s.province ?? "—"}</td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "6px", color: "#4D7FFF", background: "rgba(77,127,255,0.1)", border: "1px solid rgba(77,127,255,0.2)", textTransform: "capitalize" }}>
                      {s.subscription_plan}
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "6px", color: s.is_verified ? "#00E5A3" : "#F5A623", background: s.is_verified ? "rgba(0,229,163,0.1)" : "rgba(245,166,35,0.1)", border: `1px solid ${s.is_verified ? "rgba(0,229,163,0.2)" : "rgba(245,166,35,0.2)"}` }}>
                      {s.is_verified ? "Verified" : "Pending"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, background: "rgba(77,127,255,0.1)", border: "1px solid rgba(77,127,255,0.2)", color: "#4D7FFF", cursor: "pointer" }}>Edit</button>
                      {!s.is_verified && <button style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, background: "rgba(0,229,163,0.1)", border: "1px solid rgba(0,229,163,0.2)", color: "#00E5A3", cursor: "pointer" }}>Verify</button>}
                    </div>
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
