import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase.from("profiles") as any)
    .select("role")
    .eq("user_id", user.id)
    .single();

  const role = (profile as { role?: string } | null)?.role;
  const dest = role ? (ROLE_REDIRECTS[role] ?? "/student/dashboard") : "/student/dashboard";
  redirect(dest);
}
