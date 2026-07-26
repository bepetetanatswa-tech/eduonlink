import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/StatCard";
import { IconFamily, IconSchool, IconChip, IconCoins } from "@/components/icons";

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
  super_admin: "#A9873F", school_admin: "#B1502B", teacher: "#1F4738",
  student: "#566257", parent: "#3E4A41",
};
const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin", school_admin: "School Admin",
  teacher: "Teacher", student: "Student", parent: "Parent",
};

const QUICK_ACTIONS = [
  { label: "User management", href: "/admin/dashboard/users" },
  { label: "School management", href: "/admin/dashboard/schools" },
  { label: "Verify payments", href: "/admin/dashboard/payments" },
  { label: "AI monitor", href: "/admin/dashboard/ai" },
  { label: "Analytics", href: "/admin/dashboard/analytics" },
  { label: "Broadcast", href: "/admin/dashboard/broadcast" },
  { label: "Platform settings", href: "/admin/dashboard/settings" },
];

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
    <div className="max-w-[1200px] flex flex-col gap-6">
      {/* Welcome */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display font-semibold text-xl text-edu-ink">Platform overview</h2>
          <p className="text-[13px] text-edu-slate-500 mt-0.5">
            Everything happening on the EduOnLink platform, right now.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/admin/dashboard/users" className="btn-primary py-2 px-4 text-xs">
            Manage users
          </Link>
          {!!pendingPayments && (
            <Link href="/admin/dashboard/payments" className="btn-gold py-2 px-4 text-xs">
              {pendingPayments} pending payments
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
        <StatCard label="Total users" value={totalUsers ?? 0} subtitle="All registered accounts"
          accentColor="#B1502B" trend={{ value: recentSignups ?? 0, label: "new this week" }}
          icon={<IconFamily size={18} />}
        />
        <StatCard label="Partner schools" value={totalSchools ?? 0} subtitle="Registered institutions"
          accentColor="#1F4738" icon={<IconSchool size={18} />}
        />
        <StatCard label="AI conversations" value={totalAI ?? 0} subtitle="Sir Taks sessions total"
          accentColor="#A9873F" icon={<IconChip size={18} />}
        />
        <StatCard label="Pending payments" value={pendingPayments ?? 0} subtitle="EcoCash verifications"
          accentColor="#A9873F" icon={<IconCoins size={18} />}
        />
      </div>

      {/* Two-column layout */}
      <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 320px" }}>
        {/* Recent users table */}
        <div className="border border-edu-slate-200 rounded overflow-hidden">
          <div className="px-5 py-4 border-b border-edu-slate-200 flex justify-between items-center">
            <h3 className="font-display font-semibold text-sm text-edu-ink">Recent signups</h3>
            <Link href="/admin/dashboard/users" className="text-xs text-edu-copper">View all</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-edu-slate-200">
                  {["User", "Role", "Joined"].map((h) => (
                    <th key={h} className="px-5 py-2.5 text-left text-[10px] font-semibold text-edu-slate-500 tracking-[0.06em] uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(recentUsers ?? []).length === 0 ? (
                  <tr><td colSpan={3} className="px-8 py-8 text-center text-edu-slate-500 text-[13px]">No users yet</td></tr>
                ) : (recentUsers ?? []).map((u: { id: string; full_name: string; email: string; role: string; created_at: string }) => (
                  <tr key={u.id} className="border-b border-edu-slate-100">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-edu-paper bg-edu-copper">
                          {u.full_name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-edu-ink">{u.full_name}</p>
                          <p className="text-[11px] text-edu-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ color: ROLE_COLOR[u.role] ?? "#566257", background: `${ROLE_COLOR[u.role] ?? "#566257"}15`, border: `1px solid ${ROLE_COLOR[u.role] ?? "#566257"}30` }}
                      >
                        {ROLE_LABEL[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[11px] text-edu-slate-500">{timeAgo(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-4">
          {/* Role breakdown */}
          <div className="border border-edu-slate-200 rounded px-5 py-4">
            <h3 className="font-display font-semibold text-sm text-edu-ink mb-3.5">User breakdown</h3>
            <div className="flex flex-col gap-2.5">
              {Object.entries(ROLE_LABEL).map(([role, label]) => {
                const count = breakdown[role] ?? 0;
                const pct = totalUsers ? Math.round((count / totalUsers) * 100) : 0;
                return (
                  <div key={role}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-edu-slate-600">{label}</span>
                      <span className="text-xs font-semibold text-edu-ink">{count}</span>
                    </div>
                    <div className="h-1 rounded-full bg-edu-slate-100">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: ROLE_COLOR[role] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent payments */}
          <div className="border border-edu-slate-200 rounded px-5 py-4 flex-1">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-display font-semibold text-sm text-edu-ink">Recent payments</h3>
              <Link href="/admin/dashboard/payments" className="text-[11px] text-edu-copper">View all</Link>
            </div>
            {(payments ?? []).length === 0 ? (
              <p className="text-[13px] text-edu-slate-500 text-center py-5">No payments yet</p>
            ) : (payments ?? []).map((p: { id: string; amount: number; status: string; phone_number: string | null; created_at: string }) => {
              const statusColor = p.status === "approved" ? "#1F4738" : p.status === "rejected" ? "#A3311E" : "#A9873F";
              return (
                <div key={p.id} className="flex justify-between items-center py-2 border-b border-edu-slate-100">
                  <div>
                    <p className="text-xs font-semibold text-edu-ink">${p.amount.toFixed(2)}</p>
                    <p className="text-[10px] text-edu-slate-500">{p.phone_number ?? "—"} · {timeAgo(p.created_at)}</p>
                  </div>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ color: statusColor, background: `${statusColor}15`, border: `1px solid ${statusColor}30` }}
                  >
                    {p.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="border border-edu-slate-200 rounded p-5">
        <h3 className="font-display font-semibold text-sm text-edu-ink mb-3.5">Quick actions</h3>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((a) => (
            <Link key={a.href} href={a.href} className="btn-ghost py-2 px-4 text-xs">
              {a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
