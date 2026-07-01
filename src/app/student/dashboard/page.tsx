import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/dashboard/EmptyState";

export default async function StudentDashboardPage() {
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
  const { data: enrollments } = await (supabase.from("class_enrollments") as any)
    .select("id, class_id, status, classes(id, name, grade_level, subject)")
    .eq("student_id", profile.id)
    .eq("status", "active");

  const classIds = (enrollments ?? []).map((e: { class_id: string }) => e.class_id);

  const [
    { count: aiCount },
    { data: upcomingAssignments },
    { data: recentGrades },
  ] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("ai_conversations") as any).select("*", { count: "exact", head: true }).eq("student_id", profile.id),
    classIds.length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (supabase.from("assignments") as any)
          .select("id, title, due_date, class_id")
          .in("class_id", classIds)
          .gte("due_date", new Date().toISOString())
          .order("due_date")
          .limit(5)
      : Promise.resolve({ data: [] }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("grades") as any)
      .select("id, score, grade, academic_year, term, class_id")
      .eq("student_id", profile.id)
      .order("academic_year", { ascending: false })
      .limit(5),
  ]);

  const now = new Date();
  const dueSoon = (upcomingAssignments ?? []).filter((a: { due_date: string | null }) => {
    if (!a.due_date) return false;
    return (new Date(a.due_date).getTime() - now.getTime()) < 3 * 24 * 60 * 60 * 1000;
  }).length;

  return (
    <div style={{ maxWidth: 1100, display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif" }}>
            Welcome, {profile.full_name.split(" ")[0]} 🎓
          </h2>
          <p style={{ fontSize: "13px", color: "#4A5170", marginTop: 2 }}>Keep learning — every lesson counts.</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <Link href="/student/dashboard/ai-tutor" style={{ padding: "8px 16px", borderRadius: "10px", fontSize: "12px", fontWeight: 600, background: "rgba(189,147,249,0.12)", border: "1px solid rgba(189,147,249,0.25)", color: "#BD93F9", textDecoration: "none" }}>
            ✨ Ask Sir Taks
          </Link>
          <Link href="/student/dashboard/assignments" style={{ padding: "8px 16px", borderRadius: "10px", fontSize: "12px", fontWeight: 600, background: "rgba(77,127,255,0.12)", border: "1px solid rgba(77,127,255,0.25)", color: "#4D7FFF", textDecoration: "none" }}>
            View Assignments
          </Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "14px" }}>
        <StatCard label="Enrolled Classes" value={(enrollments ?? []).length} accentColor="#4D7FFF" icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>} />
        <StatCard label="Due Assignments" value={(upcomingAssignments ?? []).length} subtitle={dueSoon > 0 ? `${dueSoon} due within 3 days` : undefined} accentColor={dueSoon > 0 ? "#F5A623" : "#00E5A3"} icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>} />
        <StatCard label="AI Sessions" value={aiCount ?? 0} subtitle="with Sir Taks" accentColor="#BD93F9" icon={<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* My classes */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif" }}>My Classes</h3>
            <Link href="/student/dashboard/lessons" style={{ fontSize: "11px", color: "#4D7FFF", textDecoration: "none" }}>View all →</Link>
          </div>
          <div style={{ padding: "8px" }}>
            {(enrollments ?? []).length === 0 ? (
              <EmptyState icon={<svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>} title="No classes yet" description="Your teacher will enroll you in classes once you join a school." />
            ) : (enrollments ?? []).map((e: { id: string; classes: { id: string; name: string; grade_level: string | null; subject: string | null } | null }) => {
              const cls = e.classes;
              if (!cls) return null;
              return (
                <div key={e.id} style={{ padding: "10px 12px", borderRadius: "10px", marginBottom: 4, background: "rgba(77,127,255,0.04)", border: "1px solid rgba(77,127,255,0.08)" }}>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "#CDD6F4" }}>{cls.name}</p>
                  <p style={{ fontSize: "11px", color: "#4A5170" }}>{[cls.grade_level, cls.subject].filter(Boolean).join(" · ") || "Active class"}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming assignments + recent grades */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Upcoming */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", overflow: "hidden", flex: 1 }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif" }}>Upcoming</h3>
              <Link href="/student/dashboard/assignments" style={{ fontSize: "11px", color: "#4D7FFF", textDecoration: "none" }}>View all →</Link>
            </div>
            <div style={{ padding: "8px" }}>
              {(upcomingAssignments ?? []).length === 0 ? (
                <p style={{ padding: "16px", fontSize: "12px", color: "#4A5170", textAlign: "center" }}>No upcoming assignments 🎉</p>
              ) : (upcomingAssignments ?? []).map((a: { id: string; title: string; due_date: string | null }) => {
                const isUrgent = a.due_date && (new Date(a.due_date).getTime() - now.getTime()) < 3 * 24 * 60 * 60 * 1000;
                return (
                  <div key={a.id} style={{ padding: "8px 12px", borderRadius: "8px", marginBottom: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontSize: "12px", fontWeight: 500, color: "#CDD6F4" }}>{a.title}</p>
                    <span style={{ fontSize: "10px", fontWeight: 600, color: isUrgent ? "#F5A623" : "#4A5170" }}>
                      {a.due_date ? new Date(a.due_date).toLocaleDateString("en-ZW", { day: "numeric", month: "short" }) : "No date"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent grades */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", overflow: "hidden", flex: 1 }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif" }}>My Grades</h3>
              <Link href="/student/dashboard/grades" style={{ fontSize: "11px", color: "#4D7FFF", textDecoration: "none" }}>View all →</Link>
            </div>
            <div style={{ padding: "8px" }}>
              {(recentGrades ?? []).length === 0 ? (
                <p style={{ padding: "16px", fontSize: "12px", color: "#4A5170", textAlign: "center" }}>No grades recorded yet</p>
              ) : (recentGrades ?? []).map((g: { id: string; score: number | null; grade: string | null; academic_year: string; term: number }) => (
                <div key={g.id} style={{ padding: "8px 12px", borderRadius: "8px", marginBottom: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontSize: "11px", color: "#6B7290" }}>Term {g.term} · {g.academic_year}</p>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {g.score !== null && <span style={{ fontSize: "12px", fontWeight: 700, color: g.score >= 50 ? "#00E5A3" : "#FF6B6B" }}>{g.score}%</span>}
                    {g.grade && <span style={{ fontSize: "10px", fontWeight: 700, color: "#F5A623" }}>{g.grade}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sir Taks AI promo */}
      <div style={{ background: "linear-gradient(135deg, rgba(189,147,249,0.08), rgba(77,127,255,0.08))", border: "1px solid rgba(189,147,249,0.2)", borderRadius: "16px", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <p style={{ fontSize: "15px", fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif" }}>✨ Sir Taks AI Tutor</p>
          <p style={{ fontSize: "12px", color: "#6B7290", marginTop: 4 }}>Get instant ZIMSEC-aligned explanations for any topic. Available 24/7.</p>
        </div>
        <Link href="/student/dashboard/ai-tutor" style={{ padding: "10px 20px", borderRadius: "12px", fontSize: "13px", fontWeight: 700, background: "rgba(189,147,249,0.15)", border: "1px solid rgba(189,147,249,0.3)", color: "#BD93F9", textDecoration: "none", whiteSpace: "nowrap" }}>
          Start a Session →
        </Link>
      </div>
    </div>
  );
}
