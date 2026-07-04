/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClassTabNav } from "./ClassTabNav";
import { JoinCodeBadge } from "@/components/academic/JoinCodeBadge";

interface Props { children: React.ReactNode; params: Promise<{ id: string }> }

const S = { border: "rgba(255,255,255,0.07)", text: "#CDD6F4", muted: "#8892B0", dim: "#4A5170" };

export default async function TeacherClassDetailLayout({ children, params }: Props) {
  const { id: classId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id,role").eq("user_id", user.id).single();
  if (!profile || (profile.role !== "teacher" && profile.role !== "super_admin")) redirect("/dashboard");

  const { data: cls } = await (supabase.from("classes") as any)
    .select("id,name,subject,grade_level,teacher_id,join_code")
    .eq("id", classId).single();
  if (!cls || cls.teacher_id !== profile.id) redirect("/teacher/dashboard/classes");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 900 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: S.text, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>{cls.name}</h2>
          {cls.subject && <p style={{ fontSize: 12, color: S.dim, marginTop: 4 }}>{cls.subject}{cls.grade_level ? ` · Grade ${cls.grade_level}` : ""}</p>}
        </div>
        {cls.join_code && <JoinCodeBadge code={cls.join_code} />}
      </div>
      <ClassTabNav classId={classId} basePath="/teacher/dashboard/classes" />
      {children}
    </div>
  );
}
