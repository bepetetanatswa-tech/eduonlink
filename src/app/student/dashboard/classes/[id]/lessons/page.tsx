/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CourseAccessGate } from "@/components/academic/CourseAccessGate";

interface Props { params: Promise<{ id: string }> }

const S = { border: "rgba(255,255,255,0.07)", text: "#CDD6F4", muted: "#8892B0", dim: "#4A5170" };
const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "#4D7FFF", "English Language": "#00E5A3", Chemistry: "#FF6B6B", Physics: "#4D7FFF",
  Biology: "#00E5A3", History: "#F5A623", Geography: "#00B4D8", default: "#BD93F9",
};

export default async function StudentClassLessonsPage({ params }: Props) {
  const { id: classId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id,role").eq("user_id", user.id).single();
  if (!profile || (profile.role !== "student" && profile.role !== "super_admin")) redirect("/dashboard");

  const { data: enrollment } = await (supabase.from("class_enrollments") as any)
    .select("id").eq("class_id", classId).eq("student_id", profile.id).eq("status", "active").maybeSingle();
  if (!enrollment) redirect("/student/dashboard/classes");

  const { data: links } = await (supabase.from("class_courses") as any)
    .select(`course:courses(
      id, title, description, subject, grade_level, thumbnail_emoji, price,
      course_materials(id, title, type, file_url, order_index)
    )`)
    .eq("class_id", classId);

  const courses = (links ?? []).map((l: any) => l.course).filter(Boolean);

  const { data: progressRows } = await (supabase.from("course_progress") as any)
    .select("material_id").eq("student_id", profile.id);
  const completedIds = new Set((progressRows ?? []).map((r: { material_id: string }) => r.material_id));

  const { data: purchaseRows } = await (supabase.from("course_purchases") as any)
    .select("course_id").eq("student_id", profile.id).eq("status", "completed");
  const purchasedCourseIds = new Set((purchaseRows ?? []).map((r: { course_id: string }) => r.course_id));

  if (courses.length === 0) {
    return (
      <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 16, padding: "48px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 14, color: S.dim }}>No lessons attached to this class yet. Your teacher will add them here.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {courses.map((c: any) => {
        const mats = c.course_materials ?? [];
        const done = mats.filter((m: any) => completedIds.has(m.id)).length;
        const pct = mats.length > 0 ? Math.round((done / mats.length) * 100) : 0;
        const accentColor = SUBJECT_COLORS[c.subject] ?? SUBJECT_COLORS.default;
        return (
          <div key={c.id} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 18, overflow: "hidden" }}>
            <div style={{ padding: "16px 18px 12px", background: `${accentColor}08`, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22 }}>{c.thumbnail_emoji}</span>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: S.text, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>{c.title}</p>
                  <p style={{ fontSize: 11, color: S.dim, margin: "2px 0 0" }}>{c.subject}{c.grade_level ? ` · Grade ${c.grade_level}` : ""}</p>
                </div>
              </div>
              {mats.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: S.dim }}>Progress</span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: pct === 100 ? "#00E5A3" : S.text }}>{done}/{mats.length} · {pct}%</span>
                  </div>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? "#00E5A3" : accentColor, borderRadius: 2 }} />
                  </div>
                </div>
              )}
            </div>
            <div style={{ padding: "12px 16px 16px" }}>
              {mats.length === 0 ? (
                <p style={{ fontSize: 12, color: S.dim, textAlign: "center", padding: "12px 0" }}>No materials added yet</p>
              ) : (
                <CourseAccessGate
                  courseId={c.id}
                  courseTitle={c.title}
                  price={c.price}
                  hasPurchased={profile.role === "super_admin" || purchasedCourseIds.has(c.id)}
                  materials={mats}
                  completedIds={Array.from(completedIds) as string[]}
                  accentColor={accentColor}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
