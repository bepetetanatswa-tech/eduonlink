/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BrowseClassEnrollAction } from "@/components/academic/BrowseClassEnrollAction";

const S = { border: "rgba(28,38,32,0.07)", accent: "#B1502B", text: "#1C2620", muted: "#566257", dim: "#6E7A6C" };

function initials(name?: string) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export default async function BrowseClassesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await (supabase.from("profiles") as any).select("id").eq("user_id", user.id).single();
  if (!profile) redirect("/auth/login");

  const { data: enrolled } = await (supabase.from("class_enrollments") as any)
    .select("class_id").eq("student_id", profile.id).eq("status", "active");
  const enrolledIds: string[] = (enrolled ?? []).map((e: { class_id: string }) => e.class_id);

  let query = (supabase.from("classes") as any)
    .select("id,name,subject,grade_level,join_code,teacher_id,price,profiles!classes_teacher_id_fkey(full_name,avatar_url)")
    .is("school_id", null)
    .order("created_at", { ascending: false });
  if (enrolledIds.length) query = query.not("id", "in", `(${enrolledIds.join(",")})`);
  const { data: classesRaw } = await query;

  const classes = (classesRaw ?? []).map((c: any) => ({
    ...c,
    teacherName: c.profiles?.full_name,
    teacherAvatar: c.profiles?.avatar_url,
  }));

  return (
    <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: S.text, fontFamily: "inherit", margin: 0 }}>Browse Classes</h2>
          <p style={{ fontSize: 12, color: S.dim, marginTop: 4 }}>Classes run by independent teachers — join free classes instantly, or enroll and pay for premium ones</p>
        </div>
        <Link href="/student/dashboard/classes" style={{ fontSize: 12, color: S.muted, textDecoration: "none" }}>← My Classes</Link>
      </div>

      {classes.length === 0 ? (
        <div style={{ background: "rgba(28,38,32,0.02)", border: `1px solid ${S.border}`, borderRadius: 16, padding: "48px", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: S.dim }}>No independent classes available to join right now. Check back soon.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
          {classes.map((c: any) => (
            <div key={c.id} style={{ background: "rgba(28,38,32,0.02)", border: `1px solid ${S.border}`, borderRadius: 16, padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                {c.teacherAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.teacherAvatar} alt={c.teacherName ?? ""} style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#B1502B,#8F4022)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {initials(c.teacherName)}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: S.text, fontFamily: "inherit", margin: "0 0 3px" }}>{c.name}</h3>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, color: c.price > 0 ? "#A9873F" : "#1F4738", background: c.price > 0 ? "rgba(169,135,63,0.1)" : "rgba(31,71,56,0.1)" }}>
                      {c.price > 0 ? `$${c.price.toFixed(2)}` : "Free"}
                    </span>
                  </div>
                  {c.subject && <p style={{ fontSize: 12, color: S.muted, margin: 0 }}>{c.subject}{c.grade_level ? ` · ${c.grade_level}` : ""}</p>}
                  {c.teacherName && <p style={{ fontSize: 11, color: S.dim, marginTop: 3 }}>{c.teacherName}</p>}
                </div>
              </div>
              <BrowseClassEnrollAction classId={c.id} className={c.name} price={c.price} joinCode={c.join_code} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
