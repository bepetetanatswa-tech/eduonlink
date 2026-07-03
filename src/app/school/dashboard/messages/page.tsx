/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DirectMessages } from "@/components/communication/DirectMessages";

export default async function SchoolMessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id,full_name,role,avatar_url").eq("user_id", user.id).single();
  if (!profile || profile.role !== "school_admin") redirect("/dashboard");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>Messages</h2>
        <p style={{ fontSize: 12, color: "#4A5170", marginTop: 4 }}>Direct messages with teachers, parents, and students</p>
      </div>
      <DirectMessages
        profileId={profile.id}
        userRole={profile.role}
        allowedRoles={["teacher", "parent", "student", "school_admin", "super_admin"]}
      />
    </div>
  );
}
