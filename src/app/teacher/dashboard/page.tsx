import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { getEffectiveProfile } from "@/lib/impersonation";

export default async function TeacherDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { profile } = await getEffectiveProfile(user);

  if (!profile) redirect("/auth/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: classes } = await (supabase.from("classes") as any)
    .select("id, name, grade_level, subject, academic_year")
    .eq("teacher_id", profile.id)
    .order("created_at", { ascending: false });

  const classIds = (classes ?? []).map((c: { id: string }) => c.id);

  const [
    { count: totalStudents },
    { count: pendingGrades },
    { data: recentAssignments },
    { data: platformStudentCount },
  ] = await Promise.all([
    classIds.length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (supabase.from("class_enrollments") as any).select("*", { count: "exact", head: true }).in("class_id", classIds).eq("status", "active")
      : Promise.resolve({ count: 0 }),
    classIds.length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (supabase.from("submissions") as any).select("*", { count: "exact", head: true }).in("assignment_id",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (await (supabase.from("assignments") as any).select("id").in("class_id", classIds)).data?.map((a: { id: string }) => a.id) ?? []
        ).is("graded_at", null)
      : Promise.resolve({ count: 0 }),
    classIds.length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (supabase.from("assignments") as any).select("id, title, due_date, class_id").in("class_id", classIds).order("created_at", { ascending: false }).limit(5)
      : Promise.resolve({ data: [] }),
    supabase.rpc("get_platform_student_count" as any),
  ]);

  return (
    <div style={{ maxWidth: 1100, display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif" }}>
            Welcome back, {profile.full_name.split(" ")[0]}
          </h2>
          <p style={{ fontSize: "13px", color: "#4A5170", marginTop: 2 }}>Here&apos;s your teaching overview.</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Link href="/teacher/dashboard/attendance" style={{ padding: "8px 16px", borderRadius: "10px", fontSize: "12px", fontWeight: 600, background: "rgba(0,229,163,0.12)", border: "1px solid rgba(0,229,163,0.25)", color: "#00E5A3", textDecoration: "none" }}>Mark Attendance</Link>
          <Link href="/teacher/dashboard/assignments" style={{ padding: "8px 16px", borderRadius: "10px", fontSize: "12px", fontWeight: 600, background: "rgba(77,127,255,0.12)", border: "1px solid rgba(77,127,255,0.25)", color: "#4D7FFF", textDecoration: "none" }}>+ Assignment</Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "14px" }}>
        <StatCard label="My Classes" value={(classes ?? []).length} accentColor="#4D7FFF" icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>} />
        <StatCard label="Total Students" value={totalStudents ?? 0} accentColor="#BD93F9" icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
        <StatCard label="Pending Grades" value={pendingGrades ?? 0} subtitle="Submissions to mark" accentColor="#F5A623" icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>} />
        <StatCard label="Students on EduOnLink" value={Number(platformStudentCount ?? 0)} subtitle="Grow your reach — create more classes" accentColor="#00E5A3" icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* My classes */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif" }}>My Classes</h3>
            <Link href="/teacher/dashboard/classes" style={{ fontSize: "11px", color: "#4D7FFF", textDecoration: "none" }}>View all →</Link>
          </div>
          <div style={{ padding: "8px" }}>
            {(classes ?? []).length === 0 ? (
              <EmptyState icon={<svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>} title="No classes yet" description="Your school admin will assign classes to you." />
            ) : (classes ?? []).map((c: { id: string; name: string; grade_level: string | null; subject: string | null; academic_year: string }) => (
              <div key={c.id} style={{ padding: "10px 12px", borderRadius: "10px", marginBottom: 4, background: "rgba(255,255,255,0.02)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "#CDD6F4" }}>{c.name}</p>
                  <p style={{ fontSize: "11px", color: "#4A5170" }}>{[c.grade_level, c.subject].filter(Boolean).join(" · ") || c.academic_year}</p>
                </div>
                <Link href="/teacher/dashboard/classes" style={{ fontSize: "11px", color: "#4D7FFF", textDecoration: "none" }}>Open →</Link>
              </div>
            ))}
          </div>
        </div>

        {/* Recent assignments */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif" }}>Recent Assignments</h3>
            <Link href="/teacher/dashboard/assignments" style={{ fontSize: "11px", color: "#4D7FFF", textDecoration: "none" }}>View all →</Link>
          </div>
          <div style={{ padding: "8px" }}>
            {(recentAssignments ?? []).length === 0 ? (
              <EmptyState icon={<svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} title="No assignments yet" description="Create your first assignment for your classes." />
            ) : (recentAssignments ?? []).map((a: { id: string; title: string; due_date: string | null }) => (
              <div key={a.id} style={{ padding: "10px 12px", borderRadius: "10px", marginBottom: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontSize: "13px", fontWeight: 500, color: "#CDD6F4" }}>{a.title}</p>
                {a.due_date && (
                  <span style={{ fontSize: "10px", color: new Date(a.due_date) < new Date() ? "#FF6B6B" : "#4A5170" }}>
                    {new Date(a.due_date) < new Date() ? "Overdue" : new Date(a.due_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
