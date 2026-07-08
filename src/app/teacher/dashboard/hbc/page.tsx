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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ownClass } = await (supabase.from("classes") as any)
    .select("id").eq("teacher_id", profile.id).limit(1).maybeSingle();
  const hasAccess = !!membership?.school_id || !!ownClass;

  // hbc_projects RLS (is_my_class_teacher OR is_my_school_admin) already scopes
  // this to projects this teacher can see whether they reach students via a
  // school or via their own class directly — don't additionally filter by
  // school_id, that excludes every independent (schoolless) teacher's projects.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: projects } = hasAccess ? await (supabase.from("hbc_projects") as any)
    .select(`
      id, title, subject, stage, status, description, created_at, updated_at,
      profiles!student_id(full_name, email)
    `)
    .order("updated_at", { ascending: false }) : { data: [] };

  return (
    <HBCTeacherView
      teacherId={profile.id}
      projects={projects ?? []}
      hasSchool={hasAccess}
    />
  );
}
