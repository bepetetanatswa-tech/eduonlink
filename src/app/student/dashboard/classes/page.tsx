/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function StudentClassesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await (supabase.from("profiles") as any).select("id").eq("user_id", user.id).single();
  if (!profile) redirect("/auth/login");

  const { data: enrollments } = await (supabase.from("class_enrollments") as any)
    .select("class_id, status, classes(id,name,subject,grade_level,teacher_id,profiles!classes_teacher_id_fkey(full_name))")
    .eq("student_id", profile.id)
    .eq("status", "active");

  const classes = (enrollments ?? []).map((e: any) => ({ ...e.classes, teacherName: e.classes?.profiles?.full_name }));

  const S = { border: "rgba(255,255,255,0.07)", accent: "#4D7FFF", text: "#CDD6F4", muted: "#8892B0", dim: "#4A5170" };

  return (
    <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: S.text, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>My Classes</h2>
        <p style={{ fontSize: 12, color: S.dim, marginTop: 4 }}>{classes.length} class{classes.length !== 1 ? "es" : ""} enrolled</p>
      </div>

      {classes.length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 16, padding: "48px", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: S.dim }}>You are not enrolled in any classes yet. Ask your school administrator.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
          {classes.map((c: any) => (
            <div key={c.id} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 16, padding: "20px", display: "flex", flexDirection: "column", gap: 16, transition: "border-color 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${S.accent}40`)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = S.border)}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: S.text, fontFamily: "'Space Grotesk',sans-serif", margin: "0 0 4px" }}>{c.name}</h3>
                {c.subject && <p style={{ fontSize: 12, color: S.muted, margin: 0 }}>{c.subject}{c.grade_level ? ` · Grade ${c.grade_level}` : ""}</p>}
                {c.teacherName && <p style={{ fontSize: 11, color: S.dim, marginTop: 4 }}>Teacher: {c.teacherName}</p>}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Link href={`/student/dashboard/classes/${c.id}/chat`} style={{ flex: 1, padding: "8px", borderRadius: 8, background: `${S.accent}15`, border: `1px solid ${S.accent}30`, color: S.accent, fontSize: 12, fontWeight: 600, textAlign: "center", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                  Chat
                </Link>
                <Link href={`/student/dashboard/classes/${c.id}/live`} style={{ flex: 1, padding: "8px", borderRadius: 8, background: "rgba(0,229,163,0.1)", border: "1px solid rgba(0,229,163,0.25)", color: "#00E5A3", fontSize: 12, fontWeight: 600, textAlign: "center", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  Live
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
