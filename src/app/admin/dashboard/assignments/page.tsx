/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClassScopedTools } from "@/components/admin/ClassScopedTools";

export default async function AdminAssignmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const { data: profile } = await (supabase.from("profiles") as any).select("id,role").eq("user_id", user.id).single();
  if (!profile || profile.role !== "super_admin") redirect("/dashboard");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1C2620", fontFamily: "inherit", margin: 0 }}>Assignments</h2>
        <p style={{ fontSize: 12, color: "#6E7A6C", marginTop: 4 }}>Pick any class platform-wide to view its assignments and submissions</p>
      </div>
      <ClassScopedTools feature="assignments" />
    </div>
  );
}
