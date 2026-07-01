import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminRevenueDashboard } from "@/components/subscription/AdminRevenueDashboard";

export default async function AdminPaymentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase.from("profiles") as any).select("role").eq("user_id", user.id).single();
  if (profile?.role !== "super_admin") redirect("/admin/dashboard");

  return <AdminRevenueDashboard />;
}
