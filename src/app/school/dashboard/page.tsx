import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/dashboard/EmptyState";

export default async function SchoolDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id, full_name, email, role")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect("/auth/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: school } = await (supabase.from("schools") as any)
    .select("id, name, province, subscription_plan, is_verified")
    .eq("admin_id", profile.id)
    .single();

  const schoolId = school?.id ?? null;

  const [
    { count: studentCount },
    { count: teacherCount },
    { count: classCount },
    { data: announcements },
    { data: recentTeachers },
  ] = await Promise.all([
    schoolId
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (supabase.from("school_members") as any).select("*", { count: "exact", head: true }).eq("school_id", schoolId).eq("role", "student")
      : Promise.resolve({ count: 0 }),
    schoolId
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (supabase.from("school_members") as any).select("*", { count: "exact", head: true }).eq("school_id", schoolId).eq("role", "teacher")
      : Promise.resolve({ count: 0 }),
    schoolId
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (supabase.from("classes") as any).select("*", { count: "exact", head: true }).eq("school_id", schoolId)
      : Promise.resolve({ count: 0 }),
    schoolId
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (supabase.from("announcements") as any).select("id, title, content, created_at").eq("school_id", schoolId).order("created_at", { ascending: false }).limit(5)
      : Promise.resolve({ data: [] }),
    schoolId
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (supabase.from("school_members") as any).select("id, user_id, joined_at, profiles(full_name, email)").eq("school_id", schoolId).eq("role", "teacher").order("joined_at", { ascending: false }).limit(5)
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <div style={{ maxWidth: 1100, display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif" }}>
            {school ? school.name : "School Overview"}
          </h2>
          <div style={{ display: "flex", gap: "8px", marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
            {school?.province && <span style={{ fontSize: "12px", color: "#4A5170" }}>{school.province}</span>}
            {school && (
              <span style={{ fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "6px", color: school.is_verified ? "#00E5A3" : "#F5A623", background: school.is_verified ? "rgba(0,229,163,0.1)" : "rgba(245,166,35,0.1)", border: `1px solid ${school.is_verified ? "rgba(0,229,163,0.2)" : "rgba(245,166,35,0.2)"}` }}>
                {school.is_verified ? "Verified" : "Pending Verification"}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Link href="/school/dashboard/teachers" style={{ padding: "8px 16px", borderRadius: "10px", fontSize: "12px", fontWeight: 600, background: "rgba(0,229,163,0.12)", border: "1px solid rgba(0,229,163,0.25)", color: "#00E5A3", textDecoration: "none" }}>+ Invite Teacher</Link>
          <Link href="/school/dashboard/announcements" style={{ padding: "8px 16px", borderRadius: "10px", fontSize: "12px", fontWeight: 600, background: "rgba(77,127,255,0.12)", border: "1px solid rgba(77,127,255,0.25)", color: "#4D7FFF", textDecoration: "none" }}>Post Announcement</Link>
        </div>
      </div>

      {!school && (
        <div style={{ padding: "16px 20px", background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: "12px", color: "#F5A623", fontSize: "13px" }}>
          No school is linked to your account yet. Contact the VOA super admin to set up your school profile.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "14px" }}>
        <StatCard label="Students" value={studentCount ?? 0} accentColor="#BD93F9" icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
        <StatCard label="Teachers" value={teacherCount ?? 0} accentColor="#00E5A3" icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} />
        <StatCard label="Classes" value={classCount ?? 0} accentColor="#4D7FFF" icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif" }}>Announcements</h3>
            <Link href="/school/dashboard/announcements" style={{ fontSize: "11px", color: "#4D7FFF", textDecoration: "none" }}>View all →</Link>
          </div>
          <div style={{ padding: "8px" }}>
            {(announcements ?? []).length === 0 ? (
              <EmptyState icon={<svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>} title="No announcements" description="Post an announcement to inform your school community." />
            ) : (announcements ?? []).map((a: { id: string; title: string; content: string; created_at: string }) => (
              <div key={a.id} style={{ padding: "10px", borderRadius: "10px", marginBottom: 4 }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#CDD6F4" }}>{a.title}</p>
                <p style={{ fontSize: "11px", color: "#6B7290", marginTop: 2 }}>{a.content.slice(0, 80)}{a.content.length > 80 ? "…" : ""}</p>
                <p style={{ fontSize: "10px", color: "#4A5170", marginTop: 4 }}>{new Date(a.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif" }}>Recent Teachers</h3>
            <Link href="/school/dashboard/teachers" style={{ fontSize: "11px", color: "#4D7FFF", textDecoration: "none" }}>View all →</Link>
          </div>
          <div style={{ padding: "8px" }}>
            {(recentTeachers ?? []).length === 0 ? (
              <EmptyState icon={<svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>} title="No teachers yet" description="Invite teachers to join your school." />
            ) : (recentTeachers ?? []).map((t: { id: string; joined_at: string; profiles: { full_name: string; email: string } | null }) => (
              <div key={t.id} style={{ padding: "10px", borderRadius: "10px", marginBottom: 4, display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: 28, height: 28, borderRadius: "8px", background: "rgba(0,229,163,0.1)", border: "1px solid rgba(0,229,163,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "10px", fontWeight: 700, color: "#00E5A3" }}>
                  {t.profiles?.full_name?.charAt(0).toUpperCase() ?? "?"}
                </div>
                <div>
                  <p style={{ fontSize: "12px", fontWeight: 600, color: "#CDD6F4" }}>{t.profiles?.full_name ?? "Unknown"}</p>
                  <p style={{ fontSize: "10px", color: "#4A5170" }}>Joined {new Date(t.joined_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
