import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserManagementClient } from "./UserManagementClient";

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: users } = await (supabase.from("profiles") as any)
    .select("id, full_name, email, role, phone, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return <UserManagementClient initialUsers={users ?? []} />;
}
