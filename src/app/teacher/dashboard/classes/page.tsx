/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TeacherClassCard } from "./TeacherClassCard";
import { CreateIndependentClassButton } from "@/components/academic/CreateIndependentClassButton";

export default async function TeacherClassesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id,role,is_approved").eq("user_id", user.id).single();
  if (!profile || (profile.role !== "teacher" && profile.role !== "super_admin")) redirect("/dashboard");

  const { data: classesRaw } = await (supabase.from("classes") as any)
    .select("id,name,subject,grade_level,price")
    .eq("teacher_id", profile.id)
    .order("name");
  const classes = classesRaw ?? [];
  const classIds = classes.map((c: { id: string }) => c.id);

  const today = new Date().toISOString().slice(0, 10);
  const [enrollments, nextSessions, lastActivity, unreadNotifs, attendanceToday] = classIds.length ? await Promise.all([
    (supabase.from("class_enrollments") as any).select("class_id").in("class_id", classIds).eq("status", "active"),
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
      .select("class_id")
      .eq("date", today)
      .in("class_id", classIds),
  ]) : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const countByClass = new Map<string, number>();
  (enrollments.data ?? []).forEach((e: { class_id: string }) => {
    countByClass.set(e.class_id, (countByClass.get(e.class_id) ?? 0) + 1);
  });

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

  const attendanceMarkedToday = new Set<string>();
  (attendanceToday.data ?? []).forEach((a: { class_id: string }) => attendanceMarkedToday.add(a.class_id));

  return (
    <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>My Classes</h2>
          <p style={{ fontSize: 12, color: "#4A5170", marginTop: 4 }}>{classes.length} class{classes.length !== 1 ? "es" : ""} assigned to you</p>
        </div>
        {(profile.role === "super_admin" || profile.is_approved) && (
          <CreateIndependentClassButton teacherId={profile.id} />
        )}
      </div>

      {classes.length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "48px", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "#4A5170" }}>
            {profile.role === "super_admin" || profile.is_approved
              ? "No classes yet. Ask your school administrator to assign one, or create your own above."
              : "No classes assigned to you yet. Ask your school administrator."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
          {classes.map((c: { id: string; name: string; subject: string | null; grade_level: string | null; price: number }) => (
            <TeacherClassCard key={c.id} c={{
              ...c,
              studentCount: countByClass.get(c.id) ?? 0,
              nextSessionAt: nextSessionByClass.get(c.id) ?? null,
              lastActivityAt: lastActivityByClass.get(c.id) ?? null,
              unreadCount: unreadByClass.get(c.id) ?? 0,
              attendanceMarkedToday: attendanceMarkedToday.has(c.id),
            }} />
          ))}
        </div>
      )}
    </div>
  );
}
