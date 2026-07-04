import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HBCNewProjectForm } from "@/components/ai/HBCNewProjectForm";
import { ProjectCard } from "./ProjectCard";

export default async function StudentHBCPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id, full_name, role").eq("user_id", user.id).single();
  if (!profile || (profile.role !== "student" && profile.role !== "super_admin")) redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: projects } = await (supabase.from("hbc_projects") as any)
    .select("id, title, subject, stage, status, description, created_at, updated_at")
    .eq("student_id", profile.id)
    .order("updated_at", { ascending: false });

  return (
    <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>HBC Projects</h2>
        <p style={{ fontSize: 12, color: "#4A5170", marginTop: 4 }}>Heritage-Based Curriculum projects — 6-stage ZIMSEC workflow with AI guidance</p>
      </div>

      <HBCNewProjectForm profileId={profile.id} />

      {(projects ?? []).length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏺</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#6B7290", fontFamily: "'Space Grotesk', sans-serif", marginBottom: 6 }}>No projects yet</p>
          <p style={{ fontSize: 13, color: "#4A5170" }}>Start your first Heritage-Based Curriculum project above.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(projects ?? []).map((p: { id: string; title: string; subject: string; stage: number; status: string; description: string | null }) => (
            <ProjectCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
