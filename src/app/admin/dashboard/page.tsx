import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/StatCard";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const ROLE_COLOR: Record<string, string> = {
  super_admin: "#F5A623", school_admin: "#4D7FFF", teacher: "#00E5A3",
  student: "#BD93F9", parent: "#FF9A3C",
};
const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin", school_admin: "School Admin",
  teacher: "Teacher", student: "Student", parent: "Parent",
};

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [
    { count: totalUsers },
    { count: totalSchools },
    { count: totalAI },
    { count: pendingPayments },
    { count: recentSignups },
    { data: recentUsers },
    { data: payments },
    { data: roleCounts },
  ] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("profiles") as any).select("*", { count: "exact", head: true }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("schools") as any).select("*", { count: "exact", head: true }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("ai_conversations") as any).select("*", { count: "exact", head: true }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("payment_verifications") as any).select("*", { count: "exact", head: true }).eq("status", "pending"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("profiles") as any).select("*", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("profiles") as any)
      .select("id, full_name, email, role, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("payment_verifications") as any)
      .select("id, amount, status, phone_number, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("profiles") as any).select("role"),
  ]);

  const breakdown: Record<string, number> = {};
  for (const p of (roleCounts ?? [])) {
    breakdown[p.role] = (breakdown[p.role] ?? 0) + 1;
  }

  return (
    <div style={{ maxWidth: 1200, display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Welcome */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif" }}>
            God-Mode Overview ⚡
          </h2>
          <p style={{ fontSize: "13px", color: "#4A5170", marginTop: 2 }}>
            Everything happening on the EduOnLink platform, right now.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <Link href="/admin/dashboard/users" style={{
            padding: "8px 16px", borderRadius: "10px", fontSize: "12px", fontWeight: 600,
            background: "rgba(77,127,255,0.15)", border: "1px solid rgba(77,127,255,0.25)",
            color: "#4D7FFF", textDecoration: "none",
          }}>
            Manage Users
          </Link>
          {!!pendingPayments && (
            <Link href="/admin/dashboard/payments" style={{
              padding: "8px 16px", borderRadius: "10px", fontSize: "12px", fontWeight: 600,
              background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.3)",
              color: "#F5A623", textDecoration: "none",
            }}>
              {pendingPayments} Pending Payments
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
        <StatCard label="Total Users" value={totalUsers ?? 0} subtitle="All registered accounts"
          accentColor="#4D7FFF" trend={{ value: recentSignups ?? 0, label: "new this week" }}
          icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
        />
        <StatCard label="Partner Schools" value={totalSchools ?? 0} subtitle="Registered institutions"
          accentColor="#00E5A3"
          icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <StatCard label="AI Conversations" value={totalAI ?? 0} subtitle="Sir Taks sessions total"
          accentColor="#BD93F9"
          icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
        />
        <StatCard label="Pending Payments" value={pendingPayments ?? 0} subtitle="EcoCash verifications"
          accentColor="#F5A623"
          icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}
        />
      </div>

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px" }}>

        {/* Recent users table */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif" }}>Recent Signups</h3>
            <Link href="/admin/dashboard/users" style={{ fontSize: "12px", color: "#4D7FFF", textDecoration: "none" }}>View all →</Link>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  {["User", "Role", "Joined"].map((h) => (
                    <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: "10px", fontWeight: 600, color: "#4A5170", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(recentUsers ?? []).length === 0 ? (
                  <tr><td colSpan={3} style={{ padding: "32px", textAlign: "center", color: "#4A5170", fontSize: "13px" }}>No users yet</td></tr>
                ) : (recentUsers ?? []).map((u: { id: string; full_name: string; email: string; role: string; created_at: string }) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <td style={{ padding: "12px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: 30, height: 30, borderRadius: "8px", background: "linear-gradient(135deg, #1A3575, #4D7FFF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                          {u.full_name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                        </div>
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: 500, color: "#CDD6F4" }}>{u.full_name}</p>
                          <p style={{ fontSize: "11px", color: "#4A5170" }}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 20px" }}>
                      <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "6px", color: ROLE_COLOR[u.role] ?? "#8892B0", background: `${ROLE_COLOR[u.role] ?? "#8892B0"}15`, border: `1px solid ${ROLE_COLOR[u.role] ?? "#8892B0"}30` }}>
                        {ROLE_LABEL[u.role] ?? u.role}
                      </span>
                    </td>
                    <td style={{ padding: "12px 20px", fontSize: "11px", color: "#4A5170" }}>{timeAgo(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Role breakdown */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "16px 20px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "14px" }}>User Breakdown</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {Object.entries(ROLE_LABEL).map(([role, label]) => {
                const count = breakdown[role] ?? 0;
                const pct = totalUsers ? Math.round((count / totalUsers) * 100) : 0;
                return (
                  <div key={role}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: "12px", color: "#8892B0" }}>{label}</span>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#CDD6F4" }}>{count}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: "2px", background: "rgba(255,255,255,0.05)" }}>
                      <div style={{ height: "100%", borderRadius: "2px", width: `${pct}%`, background: ROLE_COLOR[role] ?? "#4D7FFF" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent payments */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "16px 20px", flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif" }}>Recent Payments</h3>
              <Link href="/admin/dashboard/payments" style={{ fontSize: "11px", color: "#4D7FFF", textDecoration: "none" }}>View all →</Link>
            </div>
            {(payments ?? []).length === 0 ? (
              <p style={{ fontSize: "13px", color: "#4A5170", textAlign: "center", padding: "20px 0" }}>No payments yet</p>
            ) : (payments ?? []).map((p: { id: string; amount: number; status: string; phone_number: string | null; created_at: string }) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div>
                  <p style={{ fontSize: "12px", color: "#CDD6F4", fontWeight: 600 }}>${p.amount.toFixed(2)}</p>
                  <p style={{ fontSize: "10px", color: "#4A5170" }}>{p.phone_number ?? "—"} · {timeAgo(p.created_at)}</p>
                </div>
                <span style={{
                  fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "6px",
                  color: p.status === "approved" ? "#00E5A3" : p.status === "rejected" ? "#FF6B6B" : "#F5A623",
                  background: p.status === "approved" ? "rgba(0,229,163,0.1)" : p.status === "rejected" ? "rgba(255,107,107,0.1)" : "rgba(245,166,35,0.1)",
                  border: `1px solid ${p.status === "approved" ? "rgba(0,229,163,0.2)" : p.status === "rejected" ? "rgba(255,107,107,0.2)" : "rgba(245,166,35,0.2)"}`,
                }}>
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "20px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif", marginBottom: "14px" }}>Quick Actions</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {[
            { label: "User Management", href: "/admin/dashboard/users", color: "#4D7FFF" },
            { label: "School Management", href: "/admin/dashboard/schools", color: "#00E5A3" },
            { label: "Verify Payments", href: "/admin/dashboard/payments", color: "#F5A623" },
            { label: "AI Monitor", href: "/admin/dashboard/ai", color: "#BD93F9" },
            { label: "Analytics", href: "/admin/dashboard/analytics", color: "#FF9A3C" },
            { label: "Broadcast", href: "/admin/dashboard/broadcast", color: "#4D7FFF" },
            { label: "Platform Settings", href: "/admin/dashboard/settings", color: "#8892B0" },
          ].map((a) => (
            <Link key={a.href} href={a.href} style={{
              padding: "8px 16px", borderRadius: "10px", fontSize: "12px", fontWeight: 600,
              background: `${a.color}12`, border: `1px solid ${a.color}25`,
              color: a.color, textDecoration: "none",
            }}>
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
