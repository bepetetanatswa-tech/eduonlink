import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/StatCard";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [
    { count: students }, { count: teachers }, { count: parents }, { count: schools }, { count: classes }, { count: assignments },
  ] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("profiles") as any).select("*", { count: "exact", head: true }).eq("role", "student"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("profiles") as any).select("*", { count: "exact", head: true }).eq("role", "teacher"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("profiles") as any).select("*", { count: "exact", head: true }).eq("role", "parent"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("schools") as any).select("*", { count: "exact", head: true }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("classes") as any).select("*", { count: "exact", head: true }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("assignments") as any).select("*", { count: "exact", head: true }),
  ]);

  return (
    <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif" }}>Platform Analytics</h2>
        <p style={{ fontSize: "12px", color: "#4A5170", marginTop: 2 }}>Real-time platform metrics</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "14px" }}>
        <StatCard label="Students" value={students ?? 0} accentColor="#BD93F9" icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} />
        <StatCard label="Teachers" value={teachers ?? 0} accentColor="#00E5A3" icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} />
        <StatCard label="Parents" value={parents ?? 0} accentColor="#FF9A3C" icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
        <StatCard label="Schools" value={schools ?? 0} accentColor="#4D7FFF" icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} />
        <StatCard label="Classes" value={classes ?? 0} accentColor="#F5A623" icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>} />
        <StatCard label="Assignments" value={assignments ?? 0} accentColor="#8892B0" icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} />
      </div>
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "24px", textAlign: "center" }}>
        <p style={{ fontSize: "13px", color: "#4A5170" }}>📊 Interactive charts coming in the next release — growth trends, engagement rates, revenue over time.</p>
      </div>
    </div>
  );
}
