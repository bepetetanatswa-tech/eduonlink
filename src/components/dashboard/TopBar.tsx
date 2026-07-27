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
  "/admin/dashboard/hbc":            "SBP Generator",
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
  "/school/dashboard/messages":      "EduChat",
  "/school/dashboard/attendance":    "Attendance Reports",
  "/school/dashboard/financials":    "Financials",
  "/admin/dashboard/messages":       "EduChat",
  "/teacher/dashboard":                  "My Dashboard",
  "/teacher/dashboard/classes":          "My Classes",
  "/teacher/dashboard/lessons":          "Lesson Creator",
  "/teacher/dashboard/assignments":      "Assignments",
  "/teacher/dashboard/attendance":       "Attendance",
  "/teacher/dashboard/grades":           "Grade Book",
  "/teacher/dashboard/timetable":        "My Timetable",
  "/teacher/dashboard/hbc":             "SBP Generator",
  "/teacher/dashboard/messages":         "EduChat",
  "/teacher/dashboard/announcements":    "Announcements",
  "/student/dashboard":                  "My Dashboard",
  "/student/dashboard/lessons":          "Lessons & Courses",
  "/student/dashboard/assignments":      "Assignments",
  "/student/dashboard/grades":           "My Grades",
  "/student/dashboard/exam-prep":        "Exam Preparation",
  "/student/dashboard/timetable":        "My Timetable",
  "/student/dashboard/ai-tutor":         "Sir Taks AI",
  "/student/dashboard/hbc":             "SBP Generator",
  "/student/dashboard/classes":          "My Classes",
  "/student/dashboard/messages":         "EduChat",
  "/parent/dashboard":                   "Family Overview",
  "/parent/dashboard/messages":          "EduChat",
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
    <header className="h-14 flex-shrink-0 bg-edu-paper border-b border-edu-slate-200 flex items-center justify-between px-5 gap-4 sticky top-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 rounded flex items-center justify-center border border-edu-slate-300 text-edu-slate-600"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <h1 className="font-display font-semibold text-[15px] text-edu-ink">
          {title}
        </h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <NotificationBell profileId={profile.id} role={profile.role} />

        {/* Profile dropdown */}
        <div ref={ref} className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`flex items-center gap-2 pl-1 pr-2 py-1 rounded border border-edu-slate-300 transition-colors duration-150 ${dropdownOpen ? "bg-edu-slate-100" : "hover:bg-edu-slate-100"}`}
          >
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt={profile.full_name} className="w-7 h-7 rounded object-cover" />
            ) : (
              <div className="w-7 h-7 rounded flex items-center justify-center text-[11px] font-bold text-edu-paper bg-edu-copper">
                {initials}
              </div>
            )}
            <span className="text-xs font-medium text-edu-slate-600 max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap">
              {profile.full_name.split(" ")[0]}
            </span>
            <svg width="12" height="12" fill="none" stroke="currentColor" className="text-edu-slate-400" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="absolute top-[calc(100%+8px)] right-0 w-56 bg-edu-paper border border-edu-slate-300 rounded shadow-elevated overflow-hidden z-[100]">
              <div className="px-3.5 pt-3.5 pb-2.5 border-b border-edu-slate-200">
                <p className="text-sm font-semibold text-edu-ink mb-0.5">{profile.full_name}</p>
                <p className="text-xs text-edu-slate-500 mb-2 overflow-hidden text-ellipsis">{profile.email}</p>
                <RoleBadge role={profile.role} size="xs" />
              </div>

              <div className="p-1.5">
                {[{ label: "Profile settings", href: PROFILE_PATH[profile.role], icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" }].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => { setDropdownOpen(false); router.push(item.href); }}
                    className="flex items-center gap-2 w-full px-2.5 py-2 rounded text-[13px] text-edu-slate-600 hover:bg-edu-slate-100 hover:text-edu-ink transition-colors duration-150 text-left"
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
                    </svg>
                    {item.label}
                  </button>
                ))}

                <div className="h-px bg-edu-slate-200 my-1" />

                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 w-full px-2.5 py-2 rounded text-[13px] text-edu-clay hover:bg-edu-clay-100 transition-colors duration-150 text-left"
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
