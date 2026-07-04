import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { HBCWorkflow } from "@/components/ai/HBCWorkflow";

export default async function HBCProjectPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id, full_name, role").eq("user_id", user.id).single();
  if (!profile || (profile.role !== "student" && profile.role !== "super_admin")) redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: project } = await (supabase.from("hbc_projects") as any)
    .select("id, title, subject, stage, status, description")
    .eq("id", params.id)
    .eq("student_id", profile.id)
    .single();

  if (!project) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: stages } = await (supabase.from("hbc_stages") as any)
    .select("id, stage_number, title, content, ai_feedback, teacher_comment, is_approved, submitted_at, completed_at")
    .eq("project_id", params.id)
    .order("stage_number");

  return (
    <div style={{ maxWidth: 1100, display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Link href="/student/dashboard/hbc" style={{ fontSize: 12, color: "#4A5170", textDecoration: "none" }}>HBC Projects</Link>
        <span style={{ color: "#2A2D3E" }}>→</span>
        <span style={{ fontSize: 12, color: "#6B7290", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{project.title}</span>
      </div>

      {/* Project Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, padding: "16px 20px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif", margin: "0 0 4px" }}>{project.title}</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#6B7290" }}>{project.subject}</span>
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "rgba(189,147,249,0.1)", border: "1px solid rgba(189,147,249,0.2)", color: "#BD93F9", fontWeight: 600 }}>HBC Project</span>
          </div>
          {project.description && <p style={{ fontSize: 12, color: "#4A5170", marginTop: 6 }}>{project.description}</p>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/student/dashboard/ai-tutor" style={{ padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, background: "rgba(77,127,255,0.1)", border: "1px solid rgba(77,127,255,0.2)", color: "#4D7FFF", textDecoration: "none" }}>
            🎓 Ask Sir Taks
          </Link>
        </div>
      </div>

      {/* Workflow */}
      <HBCWorkflow
        project={project}
        stages={stages ?? []}
        profileId={profile.id}
      />
    </div>
  );
}
