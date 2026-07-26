/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AssignmentManager } from "@/components/academic/AssignmentManager";

export default async function TeacherAssignmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const { data: profile } = await (supabase.from("profiles") as any).select("id,role").eq("user_id", user.id).single();
  if (!profile || (profile.role !== "teacher" && profile.role !== "super_admin")) redirect("/dashboard");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1C2620", fontFamily: "inherit", margin: 0 }}>Assignments</h2>
        <p style={{ fontSize: 12, color: "#6E7A6C", marginTop: 4 }}>Create assignments, view submissions, and return grades</p>
      </div>
      <AssignmentManager profileId={profile.id} />
    </div>
  );
}
