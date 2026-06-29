import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

const ROLE_REDIRECTS: Record<string, string> = {
  student:      "/student/dashboard",
  teacher:      "/teacher/dashboard",
  parent:       "/parent/dashboard",
  school_admin: "/school/dashboard",
  super_admin:  "/admin/dashboard",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const result = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const profile = result.data as Pick<Profile, "role"> | null;

  const dest = profile?.role ? (ROLE_REDIRECTS[profile.role] ?? "/student/dashboard") : "/student/dashboard";
  redirect(dest);
}
