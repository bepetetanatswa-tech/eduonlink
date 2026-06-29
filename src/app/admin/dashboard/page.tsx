import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SUPER_ADMIN_EMAIL } from "@/types/auth";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== SUPER_ADMIN_EMAIL) redirect("/dashboard");

  return (
    <div className="min-h-screen p-8" style={{ background: "#07080C" }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="font-display font-bold text-white text-3xl">Super Admin</h1>
          <span
            className="px-2 py-0.5 rounded-full text-xs font-bold font-mono"
            style={{ background: "rgba(245,166,35,0.15)", color: "#F5A623", border: "1px solid rgba(245,166,35,0.3)" }}
          >
            TAKS
          </span>
        </div>
        <p className="text-sm mb-8" style={{ color: "#6B7290" }}>
          VOA Platform Control Center · {user.email}
        </p>
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[
            { label: "Total Users", value: "—", accent: "#4D7FFF" },
            { label: "Active Schools", value: "—", accent: "#F5A623" },
            { label: "Daily Active", value: "—", accent: "#00E5A3" },
            { label: "AI Queries", value: "—", accent: "#A78BFA" },
          ].map((s) => (
            <div
              key={s.label}
              className="p-5 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p className="text-2xl font-display font-bold mb-1" style={{ color: s.accent }}>{s.value}</p>
              <p className="text-sm" style={{ color: "#6B7290" }}>{s.label}</p>
            </div>
          ))}
        </div>
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-4xl mb-4">⚡</p>
          <h2 className="font-display font-semibold text-white text-xl mb-2">Super Admin panel coming soon</h2>
          <p className="text-sm" style={{ color: "#6B7290" }}>
            User management, school approval, platform analytics, content moderation, and AI tuning will be here.
          </p>
        </div>
      </div>
    </div>
  );
}
