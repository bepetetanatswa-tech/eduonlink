import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HBCNewProjectForm } from "@/components/ai/HBCNewProjectForm";
import { SbpBottomNav } from "@/components/ai/SbpBottomNav";
import { ProjectCard } from "./ProjectCard";

export default async function StudentHBCPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
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

  const { new: openNew } = await searchParams;
  const activeProject = (projects ?? []).find((p: { status: string }) => p.status === "in_progress") ?? (projects ?? [])[0] ?? null;

  return (
    <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: 24, paddingBottom: 76 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>SBP Generator</h2>
        <p style={{ fontSize: 12, color: "#4A5170", marginTop: 4 }}>School-Based Projects — 6-stage ZIMSEC workflow with AI guidance, for any subject</p>
      </div>

      <HBCNewProjectForm profileId={profile.id} defaultOpen={openNew === "1"} />

      {(projects ?? []).length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏺</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#6B7290", fontFamily: "'Space Grotesk', sans-serif", marginBottom: 6 }}>No projects yet</p>
          <p style={{ fontSize: 13, color: "#4A5170" }}>Start your first School-Based Project above.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(projects ?? []).map((p: { id: string; title: string; subject: string; stage: number; status: string; description: string | null }) => (
            <ProjectCard key={p.id} p={p} />
          ))}
        </div>
      )}

      <SbpBottomNav
        basePath="/student/dashboard/hbc"
        activeProjectId={activeProject?.id ?? null}
        profilePath="/student/dashboard/profile"
      />
    </div>
  );
}
