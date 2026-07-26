/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LibraryBrowser } from "@/components/academic/LibraryBrowser";

export default async function AdminLibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const { data: profile } = await (supabase.from("profiles") as any).select("id,role").eq("user_id", user.id).single();
  if (!profile || profile.role !== "super_admin") redirect("/dashboard");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1C2620", fontFamily: "inherit", margin: 0 }}>Digital Library</h2>
        <p style={{ fontSize: 12, color: "#6E7A6C", marginTop: 4 }}>Textbooks, notes, videos and reference material — searchable by subject and level</p>
      </div>
      <LibraryBrowser profileId={profile.id} canUpload />
    </div>
  );
}
