/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClassTabNav } from "./ClassTabNav";

interface Props { children: React.ReactNode; params: Promise<{ id: string }> }

const S = { border: "rgba(255,255,255,0.07)", text: "#CDD6F4", muted: "#8892B0", dim: "#4A5170" };

export default async function StudentClassDetailLayout({ children, params }: Props) {
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

  const { data: cls } = await (supabase.from("classes") as any)
    .select("name,subject,grade_level").eq("id", classId).single();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 900 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: S.text, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>{cls?.name ?? "Class"}</h2>
        {cls?.subject && <p style={{ fontSize: 12, color: S.dim, marginTop: 4 }}>{cls.subject}{cls.grade_level ? ` · Grade ${cls.grade_level}` : ""}</p>}
      </div>
      <ClassTabNav classId={classId} basePath="/student/dashboard/classes" />
      {children}
    </div>
  );
}
