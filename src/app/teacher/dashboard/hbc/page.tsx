import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HBCTeacherView } from "@/components/ai/HBCTeacherView";

export default async function TeacherHBCPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id, full_name, role").eq("user_id", user.id).single();
  if (!profile || (profile.role !== "teacher" && profile.role !== "super_admin")) redirect("/dashboard");

  // Get school via school_members
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: membership } = await (supabase.from("school_members") as any)
    .select("school_id").eq("user_id", profile.id).eq("role", "teacher").maybeSingle();

  const schoolId = membership?.school_id ?? null;

  // Get all projects from this school that have been submitted (stage > 1)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: projects } = schoolId ? await (supabase.from("hbc_projects") as any)
    .select(`
      id, title, subject, stage, status, description, created_at, updated_at,
      profiles!student_id(full_name, email)
    `)
    .eq("school_id", schoolId)
    .order("updated_at", { ascending: false }) : { data: [] };

  return (
    <HBCTeacherView
      teacherId={profile.id}
      projects={projects ?? []}
      hasSchool={!!schoolId}
    />
  );
}
