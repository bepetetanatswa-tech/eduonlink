/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ClassCard } from "./ClassCard";
import { JoinClassButton } from "@/components/academic/JoinClassButton";

export default async function StudentClassesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await (supabase.from("profiles") as any).select("id").eq("user_id", user.id).single();
  if (!profile) redirect("/auth/login");

  const { data: enrollments } = await (supabase.from("class_enrollments") as any)
    .select("class_id, status, classes(id,name,subject,grade_level,teacher_id,profiles!classes_teacher_id_fkey(full_name,avatar_url))")
    .eq("student_id", profile.id)
    .eq("status", "active");

  const classes = (enrollments ?? []).map((e: any) => ({
    ...e.classes,
    teacherName: e.classes?.profiles?.full_name,
    teacherAvatar: e.classes?.profiles?.avatar_url,
  }));
  const classIds = classes.map((c: any) => c.id);

  const today = new Date().toISOString().slice(0, 10);
  const [nextSessions, lastActivity, unreadNotifs, attendanceToday] = classIds.length ? await Promise.all([
    (supabase.from("live_sessions") as any)
      .select("class_id, scheduled_at")
      .in("class_id", classIds)
      .eq("status", "scheduled")
      .gt("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true }),
    (supabase.from("messages") as any)
      .select("class_id, created_at")
      .in("class_id", classIds)
      .order("created_at", { ascending: false }),
    (supabase.from("notifications") as any)
      .select("link")
      .eq("user_id", profile.id)
      .eq("type", "message")
      .eq("read", false),
    (supabase.from("attendance") as any)
      .select("class_id, status")
      .eq("student_id", profile.id)
      .eq("date", today)
      .in("class_id", classIds),
  ]) : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const nextSessionByClass = new Map<string, string>();
  (nextSessions.data ?? []).forEach((s: { class_id: string; scheduled_at: string }) => {
    if (!nextSessionByClass.has(s.class_id)) nextSessionByClass.set(s.class_id, s.scheduled_at);
  });

  const lastActivityByClass = new Map<string, string>();
  (lastActivity.data ?? []).forEach((m: { class_id: string; created_at: string }) => {
    if (!lastActivityByClass.has(m.class_id)) lastActivityByClass.set(m.class_id, m.created_at);
  });

  const unreadByClass = new Map<string, number>();
  (unreadNotifs.data ?? []).forEach((n: { link: string | null }) => {
    const match = n.link?.match(/\/classes\/([^/]+)\/chat/);
    if (match) unreadByClass.set(match[1], (unreadByClass.get(match[1]) ?? 0) + 1);
  });

  const attendanceByClass = new Map<string, string>();
  (attendanceToday.data ?? []).forEach((a: { class_id: string; status: string }) => {
    attendanceByClass.set(a.class_id, a.status);
  });

  const enriched = classes.map((c: any) => ({
    ...c,
    nextSessionAt: nextSessionByClass.get(c.id) ?? null,
    lastActivityAt: lastActivityByClass.get(c.id) ?? null,
    unreadCount: unreadByClass.get(c.id) ?? 0,
    attendanceToday: attendanceByClass.get(c.id) ?? null,
  }));

  const S = { border: "rgba(28,38,32,0.07)", accent: "#B1502B", text: "#1C2620", muted: "#566257", dim: "#6E7A6C" };

  return (
    <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: S.text, fontFamily: "inherit", margin: 0 }}>My Classes</h2>
          <p style={{ fontSize: 12, color: S.dim, marginTop: 4 }}>{classes.length} class{classes.length !== 1 ? "es" : ""} enrolled</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <Link href="/student/dashboard/classes/browse" style={{ padding: "8px 16px", borderRadius: 10, background: "rgba(28,38,32,0.04)", border: `1px solid ${S.border}`, color: S.text, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            Browse Classes
          </Link>
          <JoinClassButton />
        </div>
      </div>

      {enriched.length === 0 ? (
        <div style={{ background: "rgba(28,38,32,0.02)", border: `1px solid ${S.border}`, borderRadius: 16, padding: "48px", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: S.dim }}>You are not enrolled in any classes yet. Ask your teacher for a join code, or ask your school administrator.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
          {enriched.map((c: any) => <ClassCard key={c.id} c={c} />)}
        </div>
      )}
    </div>
  );
}
