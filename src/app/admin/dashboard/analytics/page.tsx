/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityLinks } from "./ActivityLinks";

function BarChart({ data, color = "#B1502B" }: { data: { label: string; value: number }[]; color?: string }) {
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  const W = 540, H = 120, barW = Math.floor(W / data.length) - 4;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 30}`} style={{ overflow: "visible" }}>
      {data.map((d, i) => {
        const x = i * (W / data.length) + 2;
        const barH = Math.max((d.value / max) * H, d.value > 0 ? 4 : 1);
        const y = H - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} rx={3} fill={`${color}40`} stroke={color} strokeWidth={0.5} />
            {d.value > 0 && <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={9} fill={color}>{d.value}</text>}
            <text x={x + barW / 2} y={H + 16} textAnchor="middle" fontSize={8} fill="#6E7A6C">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  let students = 0, teachers = 0, parents = 0, schoolAdmins = 0, schools = 0,
    classes = 0, assignments = 0, courses = 0, aiConvos = 0;
  let allProfiles: { created_at: string }[] = [];
  let loadError = false;

  try {
    const results = await Promise.all([
      (supabase.from("profiles") as any).select("*", { count: "exact", head: true }).eq("role", "student"),
      (supabase.from("profiles") as any).select("*", { count: "exact", head: true }).eq("role", "teacher"),
      (supabase.from("profiles") as any).select("*", { count: "exact", head: true }).eq("role", "parent"),
      (supabase.from("profiles") as any).select("*", { count: "exact", head: true }).eq("role", "school_admin"),
      (supabase.from("schools") as any).select("*", { count: "exact", head: true }),
      (supabase.from("classes") as any).select("*", { count: "exact", head: true }),
      (supabase.from("assignments") as any).select("*", { count: "exact", head: true }),
      (supabase.from("courses") as any).select("*", { count: "exact", head: true }).eq("is_published", true),
      (supabase.from("ai_conversations") as any).select("*", { count: "exact", head: true }),
      (supabase.from("profiles") as any).select("created_at").order("created_at"),
    ]);
    students = results[0].count ?? 0;
    teachers = results[1].count ?? 0;
    parents = results[2].count ?? 0;
    schoolAdmins = results[3].count ?? 0;
    schools = results[4].count ?? 0;
    classes = results[5].count ?? 0;
    assignments = results[6].count ?? 0;
    courses = results[7].count ?? 0;
    aiConvos = results[8].count ?? 0;
    allProfiles = results[9].data ?? [];
  } catch (err) {
    console.error("AnalyticsPage: failed to load platform metrics:", err);
    loadError = true;
  }

  if (loadError) {
    return (
      <div style={{ maxWidth: 1000, display: "flex", flexDirection: "column", gap: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1C2620", fontFamily: "inherit", margin: 0 }}>Platform Analytics</h2>
          <p style={{ fontSize: 12, color: "#6E7A6C", marginTop: 4 }}>Live metrics across the EduOnLink platform</p>
        </div>
        <div style={{ background: "rgba(163,49,30,0.05)", border: "1px solid rgba(163,49,30,0.2)", borderRadius: 14, padding: "36px", textAlign: "center", color: "#A3311E", fontSize: 13 }}>
          Couldn&apos;t load analytics right now — the data source may be temporarily unavailable. Try refreshing the page.
        </div>
      </div>
    );
  }

  // Build 8-week signup chart
  const now = Date.now();
  const weeklySignups = Array.from({ length: 8 }, (_, i) => {
    const weekStart = new Date(now - (7 - i) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(now - (6 - i) * 7 * 24 * 60 * 60 * 1000);
    const count = allProfiles.filter((p: { created_at: string }) => {
      const d = new Date(p.created_at);
      return d >= weekStart && d < weekEnd;
    }).length;
    const label = weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    return { label, value: count };
  });

  // Role breakdown for donut-style bar
  const roles = [
    { label: "Students", count: students, color: "#A9873F" },
    { label: "Teachers", count: teachers, color: "#1F4738" },
    { label: "Parents", count: parents, color: "#A9873F" },
    { label: "School Admins", count: schoolAdmins, color: "#B1502B" },
  ];
  const totalUsers = roles.reduce((s, r) => s + r.count, 0);

  return (
    <div style={{ maxWidth: 1000, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1C2620", fontFamily: "inherit", margin: 0 }}>Platform Analytics</h2>
        <p style={{ fontSize: 12, color: "#6E7A6C", marginTop: 4 }}>Live metrics across the EduOnLink platform</p>
      </div>

      {/* Key stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(165px, 1fr))", gap: 12 }}>
        <StatCard label="Students" value={students} accentColor="#A9873F" icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} />
        <StatCard label="Teachers" value={teachers} accentColor="#1F4738" icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} />
        <StatCard label="Schools" value={schools} accentColor="#B1502B" icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} />
        <StatCard label="Published Courses" value={courses} accentColor="#A9873F" icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>} />
        <StatCard label="Classes" value={classes} accentColor="#A9873F" icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
        <StatCard label="AI Conversations" value={aiConvos} accentColor="#A9873F" icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
        {/* Weekly signup chart */}
        <div style={{ background: "rgba(28,38,32,0.02)", border: "1px solid rgba(28,38,32,0.06)", borderRadius: 16, padding: "20px 24px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1C2620", fontFamily: "inherit", margin: "0 0 20px" }}>New Signups — Last 8 Weeks</h3>
          <BarChart data={weeklySignups} color="#B1502B" />
        </div>

        {/* Role breakdown */}
        <div style={{ background: "rgba(28,38,32,0.02)", border: "1px solid rgba(28,38,32,0.06)", borderRadius: 16, padding: "20px" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1C2620", fontFamily: "inherit", margin: "0 0 16px" }}>User Roles ({totalUsers} total)</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {roles.map((r) => {
              const pct = totalUsers ? Math.round((r.count / totalUsers) * 100) : 0;
              return (
                <div key={r.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: "#566257" }}>{r.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#1C2620" }}>{r.count} <span style={{ color: "#6E7A6C", fontWeight: 400 }}>({pct}%)</span></span>
                  </div>
                  <div style={{ height: 6, background: "rgba(28,38,32,0.05)", borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: r.color, borderRadius: 3, transition: "width 0.5s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Platform activity summary */}
      <ActivityLinks
        items={[
          { label: "Total Assignments", value: assignments, link: "/admin/dashboard/courses", color: "#B1502B" },
          { label: "Active Courses", value: courses, link: "/admin/dashboard/courses", color: "#A9873F" },
          { label: "AI Sessions", value: aiConvos, link: "/admin/dashboard/ai", color: "#A9873F" },
        ]}
      />
    </div>
  );
}
