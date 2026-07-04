/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NotificationsPage } from "@/components/dashboard/NotificationsPage";

export default async function SchoolNotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const { data: profile } = await (supabase.from("profiles") as any).select("id,role").eq("user_id", user.id).single();
  if (!profile || profile.role !== "school_admin") redirect("/dashboard");
  return <NotificationsPage profileId={profile.id} />;
}
