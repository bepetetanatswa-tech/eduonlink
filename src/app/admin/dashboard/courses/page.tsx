import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CourseManager } from "@/components/admin/CourseManager";

export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id, role").eq("user_id", user.id).single();
  if (!profile || profile.role !== "super_admin") redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: courses } = await (supabase.from("courses") as any)
    .select("id, title, description, subject, grade_level, is_published, order_index, thumbnail_emoji, created_at")
    .order("created_at", { ascending: false });

  return <CourseManager initialCourses={courses ?? []} adminId={profile.id} />;
}
