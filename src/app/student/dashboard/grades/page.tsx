/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentGrades } from "@/components/academic/StudentGrades";

export default async function StudentGradesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const { data: profile } = await (supabase.from("profiles") as any).select("id,role").eq("user_id", user.id).single();
  if (!profile || (profile.role !== "student" && profile.role !== "super_admin")) redirect("/dashboard");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>My Grades</h2>
        <p style={{ fontSize: 12, color: "#4A5170", marginTop: 4 }}>View your academic performance and teacher feedback</p>
      </div>
      <StudentGrades profileId={profile.id} />
    </div>
  );
}
