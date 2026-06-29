import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export default async function ParentDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const result = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const profile = result.data as Profile | null;

  return (
    <div className="min-h-screen p-8" style={{ background: "#07080C" }}>
      <div className="max-w-5xl mx-auto">
        <h1 className="font-display font-bold text-white text-3xl mb-2">
          Parent Dashboard — {profile?.first_name ?? "Parent"} 👨‍👩‍👧
        </h1>
        <p className="text-sm mb-8" style={{ color: "#6B7290" }}>
          Monitor your child&apos;s progress and learning activity
        </p>
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-4xl mb-4">👨‍👩‍👧</p>
          <h2 className="font-display font-semibold text-white text-xl mb-2">Parent dashboard coming soon</h2>
          <p className="text-sm" style={{ color: "#6B7290" }}>
            Real-time progress reports, activity logs, and child account linking will be here.
          </p>
        </div>
      </div>
    </div>
  );
}
