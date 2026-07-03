/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminHBCClient } from "./AdminHBCClient";

export default async function AdminHBCPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: rawProjects } = await (supabase.from("hbc_projects") as any)
    .select(`
      id, title, subject, stage, status, school_id, created_at,
      profiles!student_id(full_name, email)
    `)
    .order("created_at", { ascending: false })
    .limit(200);

  // hbc_projects.school_id has no FK constraint to schools, so PostgREST
  // can't embed it — resolve school names separately, same pattern as
  // the AI Monitor page.
  const schoolIds = Array.from(new Set((rawProjects ?? []).map((p: any) => p.school_id).filter(Boolean)));
  const { data: schoolRows } = schoolIds.length
    ? await (supabase.from("schools") as any).select("id, name").in("id", schoolIds)
    : { data: [] };
  const schoolNameById = new Map((schoolRows ?? []).map((s: { id: string; name: string }) => [s.id, s.name]));

  const projects = (rawProjects ?? []).map((p: any) => ({
    ...p,
    school_name: p.school_id ? (schoolNameById.get(p.school_id) ?? null) : null,
  }));

  const totalProjects = projects.length;
  const statusCounts = new Map<string, number>();
  for (const p of projects) statusCounts.set(p.status, (statusCounts.get(p.status) ?? 0) + 1);

  const schoolCounts = new Map<string, number>();
  for (const p of projects) {
    const name = p.school_name ?? "No school linked";
    schoolCounts.set(name, (schoolCounts.get(name) ?? 0) + 1);
  }
  const bySchool = Array.from(schoolCounts.entries()).sort((a, b) => b[1] - a[1]);

  const avgStage = totalProjects
    ? projects.reduce((sum: number, p: any) => sum + (p.stage ?? 1), 0) / totalProjects
    : 0;

  return (
    <AdminHBCClient
      projects={projects}
      totalProjects={totalProjects}
      inProgress={statusCounts.get("in_progress") ?? 0}
      submitted={statusCounts.get("submitted") ?? 0}
      approved={statusCounts.get("approved") ?? 0}
      avgStage={avgStage}
      bySchool={bySchool}
    />
  );
}
