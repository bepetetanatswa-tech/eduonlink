"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { NotificationBell } from "./NotificationBell";
import { RoleBadge } from "./RoleBadge";
import type { UserRole } from "@/types/database";

const PAGE_TITLES: Record<string, string> = {
  "/admin/dashboard":                "Platform Overview",
  "/admin/dashboard/users":          "User Management",
  "/admin/dashboard/schools":        "School Management",
  "/admin/dashboard/ai":             "AI Monitoring",
  "/admin/dashboard/hbc":            "HBC Projects",
  "/admin/dashboard/analytics":      "Analytics",
  "/admin/dashboard/payments":       "Payments",
  "/admin/dashboard/subscriptions":  "Subscriptions",
  "/admin/dashboard/broadcast":      "Broadcast",
  "/admin/dashboard/settings":       "Platform Settings",
  "/school/dashboard":               "School Overview",
  "/school/dashboard/teachers":      "Teachers",
  "/school/dashboard/students":      "Students",
  "/school/dashboard/classes":       "Classes",
  "/school/dashboard/announcements": "Announcements",
  "/school/dashboard/messages":      "Messages",
  "/school/dashboard/attendance":    "Attendance Reports",
  "/school/dashboard/financials":    "Financials",
  "/admin/dashboard/messages":       "Messages",
  "/teacher/dashboard":                  "My Dashboard",
  "/teacher/dashboard/classes":          "My Classes",
  "/teacher/dashboard/lessons":          "Lesson Creator",
  "/teacher/dashboard/assignments":      "Assignments",
  "/teacher/dashboard/attendance":       "Attendance",
  "/teacher/dashboard/grades":           "Grade Book",
  "/teacher/dashboard/timetable":        "My Timetable",
  "/teacher/dashboard/hbc":             "HBC Projects",
  "/teacher/dashboard/messages":         "Messages",
  "/teacher/dashboard/announcements":    "Announcements",
  "/student/dashboard":                  "My Dashboard",
  "/student/dashboard/lessons":          "My Lessons",
  "/student/dashboard/assignments":      "Assignments",
  "/student/dashboard/grades":           "My Grades",
  "/student/dashboard/exam-prep":        "Exam Preparation",
  "/student/dashboard/timetable":        "My Timetable",
  "/student/dashboard/ai-tutor":         "Sir Taks AI",
  "/student/dashboard/hbc":             "HBC Projects",
  "/student/dashboard/classes":          "My Classes",
  "/student/dashboard/messages":         "Messages",
  "/parent/dashboard":                   "Family Overview",
  "/parent/dashboard/messages":          "Messages",
  "/parent/dashboard/announcements":     "School News",
  "/parent/dashboard/grades":            "Report Cards",
  "/parent/dashboard/payments":          "Payments",
  "/school/dashboard/timetable":         "Timetable",
  "/school/dashboard/subscription":      "Subscription",
  "/teacher/dashboard/subscription":     "Subscription",
  "/student/dashboard/subscription":     "Subscription",
  "/parent/dashboard/subscription":      "Subscription",
  "/student/dashboard/profile":          "My Profile",
  "/parent/dashboard/profile":           "My Profile",
  "/teacher/dashboard/profile":          "My Profile",
  "/school/dashboard/profile":           "My Profile",
  "/admin/dashboard/profile":            "My Profile",
  "/student/dashboard/notifications":    "Notifications",
  "/teacher/dashboard/notifications":    "Notifications",
  "/parent/dashboard/notifications":     "Notifications",
  "/school/dashboard/notifications":     "Notifications",
  "/admin/dashboard/notifications":      "Notifications",
};

const PROFILE_PATH: Record<UserRole, string> = {
  student:      "/student/dashboard/profile",
  teacher:      "/teacher/dashboard/profile",
  parent:       "/parent/dashboard/profile",
  school_admin: "/school/dashboard/profile",
  super_admin:  "/admin/dashboard/profile",
};

interface TopBarProps {
  profile: { id: string; full_name: string; email: string; role: UserRole; avatar_url: string | null };
  onMenuClick: () => void;
}

export function TopBar({ profile, onMenuClick }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const supabase = createClient();
  const ref = useRef<HTMLDivElement>(null);

  const title = PAGE_TITLES[pathname] ?? "Dashboard";
  const initials = profile.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setDropdownOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <header style={{
      height: 56, flexShrink: 0,
      background: "#07080C", borderBottom: "1px solid rgba(255,255,255,0.05)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 20px", gap: "16px", position: "sticky", top: 0, zIndex: 30,
    }}>
      {/* Left */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Hamburger — mobile */}
        <button
          onClick={onMenuClick}
          className="lg:hidden"
          style={{
            width: 36, height: 36, borderRadius: "10px", background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center",
            justifyContent: "center", cursor: "pointer", color: "#8892B0",
          }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <h1 style={{ fontSize: "15px", fontWeight: 600, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif" }}>
          {title}
        </h1>
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <NotificationBell profileId={profile.id} role={profile.role} />

        {/* Profile dropdown */}
        <div ref={ref} style={{ position: "relative" }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "4px 8px 4px 4px", borderRadius: "10px",
              background: dropdownOpen ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)")}
            onMouseLeave={(e) => { if (!dropdownOpen) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)"; }}
          >
            {/* Avatar */}
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt={profile.full_name} style={{ width: 28, height: 28, borderRadius: "8px", objectFit: "cover" }} />
            ) : (
              <div style={{
                width: 28, height: 28, borderRadius: "8px",
                background: "linear-gradient(135deg, #4D7FFF, #2D5BDF)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "11px", fontWeight: 700, color: "#fff",
              }}>
                {initials}
              </div>
            )}
            <span style={{ fontSize: "12px", fontWeight: 500, color: "#8892B0", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {profile.full_name.split(" ")[0]}
            </span>
            <svg width="12" height="12" fill="none" stroke="#4A5170" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {dropdownOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0,
              width: 220, background: "#0E1117", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "14px", boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
              overflow: "hidden", zIndex: 100,
            }}>
              {/* User info */}
              <div style={{ padding: "14px 14px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#CDD6F4", marginBottom: 2 }}>{profile.full_name}</p>
                <p style={{ fontSize: "11px", color: "#4A5170", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis" }}>{profile.email}</p>
                <RoleBadge role={profile.role} size="xs" />
              </div>

              {/* Links */}
              <div style={{ padding: "6px" }}>
                {[{ label: "Profile settings", href: PROFILE_PATH[profile.role], icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" }].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => { setDropdownOpen(false); router.push(item.href); }}
                    style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      width: "100%", padding: "8px 10px", borderRadius: "8px",
                      fontSize: "13px", color: "#8892B0", cursor: "pointer",
                      background: "none", border: "none", textAlign: "left",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLButtonElement).style.color = "#CDD6F4"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "#8892B0"; }}
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
                    </svg>
                    {item.label}
                  </button>
                ))}

                <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "4px 0" }} />

                <button
                  onClick={handleSignOut}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    width: "100%", padding: "8px 10px", borderRadius: "8px",
                    fontSize: "13px", color: "#FF6B6B", cursor: "pointer",
                    background: "none", border: "none", textAlign: "left",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,107,107,0.08)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
