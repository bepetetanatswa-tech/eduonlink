import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TeachersClient } from "./TeachersClient";

export default async function TeachersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id, role").eq("user_id", user.id).single();
  if (!profile || profile.role !== "super_admin") redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: teachers } = await (supabase.from("profiles") as any)
    .select("id, full_name, email, phone, ztc_number, qualifications, years_experience, teaching_subjects, is_approved, teacher_rejection_reason, qualification_doc_key, id_doc_key, created_at")
    .eq("role", "teacher")
    .order("created_at", { ascending: false });

  return <TeachersClient initialTeachers={teachers ?? []} />;
}
