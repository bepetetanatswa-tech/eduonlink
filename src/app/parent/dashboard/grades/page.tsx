/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentGrades } from "@/components/academic/StudentGrades";

export default async function ParentGradesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const { data: profile } = await (supabase.from("profiles") as any).select("id,role").eq("user_id", user.id).single();
  if (!profile || (profile.role !== "parent" && profile.role !== "super_admin")) redirect("/dashboard");

  // Find linked children (confirmed parent_children links only)
  const { data: links } = await (supabase.from("parent_children") as any)
    .select("child:child_id(id,full_name)").eq("parent_id", profile.id).eq("status", "confirmed");
  const children = (links ?? []).map((l: any) => l.child).filter(Boolean);

  if (children.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>Report Cards</h2>
        </div>
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "40px", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "#4A5170" }}>No children linked to your account. Contact your school admin.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>Report Cards</h2>
        <p style={{ fontSize: 12, color: "#4A5170", marginTop: 4 }}>View your child&apos;s grades and teacher comments</p>
      </div>
      {children.map((child: { id: string; full_name: string }) => (
        <div key={child.id}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#CDD6F4", fontFamily: "'Space Grotesk',sans-serif", margin: "0 0 12px" }}>{child.full_name}</h3>
          <StudentGrades profileId={child.id} parentView />
        </div>
      ))}
    </div>
  );
}
