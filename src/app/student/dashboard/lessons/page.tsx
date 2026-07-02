import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CourseAccessGate } from "@/components/academic/CourseAccessGate";

export default async function StudentLessonsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id, full_name, role").eq("user_id", user.id).single();
  if (!profile || profile.role !== "student") redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: courses } = await (supabase.from("courses") as any)
    .select(`
      id, title, description, subject, grade_level, thumbnail_emoji, price,
      course_materials(id, title, type, file_url, order_index)
    `)
    .eq("is_published", true)
    .order("order_index");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: progressRows } = await (supabase.from("course_progress") as any)
    .select("material_id").eq("student_id", profile.id);

  const completedIds = new Set((progressRows ?? []).map((r: { material_id: string }) => r.material_id));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: purchaseRows } = await (supabase.from("course_purchases") as any)
    .select("course_id").eq("student_id", profile.id).eq("status", "completed");
  const purchasedCourseIds = new Set((purchaseRows ?? []).map((r: { course_id: string }) => r.course_id));

  const SUBJECT_COLORS: Record<string, string> = {
    Mathematics: "#4D7FFF", "English Language": "#00E5A3", Chemistry: "#FF6B6B", Physics: "#4D7FFF",
    Biology: "#00E5A3", History: "#F5A623", Geography: "#00B4D8", default: "#BD93F9",
  };

  return (
    <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>My Lessons</h2>
        <p style={{ fontSize: 12, color: "#4A5170", marginTop: 4 }}>ZIMSEC-aligned courses and study materials</p>
      </div>

      {(courses ?? []).length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "52px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>📚</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#6B7290", marginBottom: 8 }}>No courses published yet</p>
          <p style={{ fontSize: 12, color: "#4A5170" }}>Your teacher or school admin will publish courses here.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {(courses ?? []).map((c: {
            id: string; title: string; description: string | null; subject: string;
            grade_level: string | null; thumbnail_emoji: string; price: number;
            course_materials: { id: string; title: string; type: string; file_url: string | null; order_index: number }[];
          }) => {
            const mats = c.course_materials ?? [];
            const done = mats.filter((m) => completedIds.has(m.id)).length;
            const pct = mats.length > 0 ? Math.round((done / mats.length) * 100) : 0;
            const accentColor = SUBJECT_COLORS[c.subject] ?? SUBJECT_COLORS.default;
            return (
              <div key={c.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                {/* Header */}
                <div style={{ padding: "18px 18px 14px", background: `${accentColor}08`, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 13, background: `${accentColor}15`, border: `1px solid ${accentColor}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
                      {c.thumbnail_emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif", margin: 0, lineHeight: 1.3 }}>{c.title}</p>
                        {c.price > 0 && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#F5A623", background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)", padding: "1px 7px", borderRadius: 20 }}>${c.price.toFixed(2)}</span>
                        )}
                      </div>
                      <p style={{ fontSize: 11, color: "#6B7290", margin: "3px 0 0" }}>{c.subject} · {c.grade_level}</p>
                    </div>
                  </div>
                  {c.description && <p style={{ fontSize: 12, color: "#4A5170", marginTop: 10, lineHeight: 1.5 }}>{c.description}</p>}
                </div>

                {/* Progress */}
                {mats.length > 0 && (
                  <div style={{ padding: "10px 18px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                      <span style={{ fontSize: 10, color: "#4A5170" }}>Progress</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: pct === 100 ? "#00E5A3" : "#CDD6F4" }}>{done}/{mats.length} · {pct}%</span>
                    </div>
                    <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? "#00E5A3" : accentColor, borderRadius: 2, transition: "width 0.4s" }} />
                    </div>
                  </div>
                )}

                {/* Materials */}
                <div style={{ flex: 1, padding: "10px 14px 14px" }}>
                  {mats.length === 0 ? (
                    <p style={{ fontSize: 12, color: "#4A5170", textAlign: "center", padding: "12px 0" }}>No materials added yet</p>
                  ) : (
                    <CourseAccessGate
                      courseId={c.id}
                      courseTitle={c.title}
                      price={c.price}
                      hasPurchased={purchasedCourseIds.has(c.id)}
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
      )}

      <div style={{ background: "rgba(77,127,255,0.05)", border: "1px solid rgba(77,127,255,0.1)", borderRadius: 12, padding: "12px 16px", display: "flex", gap: 10, alignItems: "center" }}>
        <span style={{ fontSize: 16 }}>🎓</span>
        <p style={{ fontSize: 12, color: "#4A5170", margin: 0, lineHeight: 1.5 }}>
          Need help with any of these topics? <Link href="/student/dashboard/ai-tutor" style={{ color: "#4D7FFF", textDecoration: "none", fontWeight: 600 }}>Ask Sir Taks AI</Link> for step-by-step explanations.
        </p>
      </div>
    </div>
  );
}
