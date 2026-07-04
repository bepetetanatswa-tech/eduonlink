/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChildAttendanceView } from "@/components/academic/ChildAttendanceView";

export default async function ParentAttendancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const { data: profile } = await (supabase.from("profiles") as any).select("id,role").eq("user_id", user.id).single();
  if (!profile || (profile.role !== "parent" && profile.role !== "super_admin")) redirect("/dashboard");

  const { data: links } = await (supabase.from("parent_children") as any)
    .select("child:child_id(id,full_name)").eq("parent_id", profile.id).eq("status", "confirmed");
  const children = (links ?? []).map((l: any) => l.child).filter(Boolean);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>Attendance</h2>
        <p style={{ fontSize: 12, color: "#4A5170", marginTop: 4 }}>Your child&apos;s attendance record, updated as teachers mark it</p>
      </div>

      {children.length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "40px", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "#4A5170" }}>No children linked to your account. Contact your school admin.</p>
        </div>
      ) : (
        children.map((child: { id: string; full_name: string }) => (
          <ChildAttendanceView key={child.id} childId={child.id} childName={child.full_name} />
        ))
      )}
    </div>
  );
}
