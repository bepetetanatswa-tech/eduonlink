import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SchoolsClient } from "./SchoolsClient";

export default async function SchoolsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id, role").eq("user_id", user.id).single();
  if (!profile || profile.role !== "super_admin") redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: schools } = await (supabase.from("schools") as any)
    .select("id, name, province, city, subscription_plan, is_verified, email, phone, created_at")
    .order("created_at", { ascending: false });

  return <SchoolsClient initialSchools={schools ?? []} />;
}
