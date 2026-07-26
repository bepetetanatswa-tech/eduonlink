/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AnnouncementFeed } from "@/components/communication/AnnouncementFeed";

export default async function ParentAnnouncementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id,role,school_members(school_id)").eq("user_id", user.id).single();
  if (!profile || (profile.role !== "parent" && profile.role !== "super_admin")) redirect("/dashboard");

  const schoolId = profile.school_members?.[0]?.school_id ?? null;

  return (
    <div style={{ maxWidth: 800, display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1C2620", fontFamily: "inherit", margin: 0 }}>School News</h2>
        <p style={{ fontSize: 12, color: "#6E7A6C", marginTop: 4 }}>Announcements from the school and your child&apos;s teachers</p>
      </div>
      <AnnouncementFeed
        profileId={profile.id}
        userRole="parent"
        schoolId={schoolId ?? undefined}
      />
    </div>
  );
}
