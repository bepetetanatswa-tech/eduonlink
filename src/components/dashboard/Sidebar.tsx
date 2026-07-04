"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { VoaLogoMark } from "@/components/logo/VoaLogoMark";
import { RoleBadge } from "./RoleBadge";
import type { UserRole } from "@/types/database";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  exact?: boolean;
}
interface NavGroup {
  group: string;
  items: NavItem[];
}

const ic = (d: string) => (
  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
  </svg>
);

const NAV: Record<UserRole, NavGroup[]> = {
  super_admin: [
    {
      group: "Platform",
      items: [
        { label: "Overview",     href: "/admin/dashboard",            icon: ic("M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"), exact: true },
        { label: "Users",        href: "/admin/dashboard/users",       icon: ic("M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z") },
        { label: "Schools",      href: "/admin/dashboard/schools",     icon: ic("M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4") },
        { label: "Teachers",     href: "/admin/dashboard/teachers",    icon: ic("M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422A12.083 12.083 0 0112 21a12.083 12.083 0 01-6.16-10.422L12 14z") },
        { label: "AI Monitor",   href: "/admin/dashboard/ai",          icon: ic("M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z") },
        { label: "HBC Projects", href: "/admin/dashboard/hbc",         icon: ic("M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z") },
        { label: "Sir Taks AI",  href: "/admin/dashboard/sir-taks",   icon: ic("M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z") },
        { label: "Courses",      href: "/admin/dashboard/courses",     icon: ic("M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253") },
        { label: "Analytics",    href: "/admin/dashboard/analytics",   icon: ic("M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z") },
        { label: "Audit Log",    href: "/admin/dashboard/audit-log",   icon: ic("M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z") },
      ],
    },
    {
      group: "Operations",
      items: [
        { label: "Payments",     href: "/admin/dashboard/payments",    icon: ic("M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z") },
        { label: "Withdrawals",  href: "/admin/dashboard/withdrawals", icon: ic("M17 9V7a5 5 0 00-10 0v2M5 9h14l1 11H4L5 9z") },
        { label: "Subscriptions",href: "/admin/dashboard/subscriptions", icon: ic("M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z") },
        { label: "Messages",     href: "/admin/dashboard/messages",    icon: ic("M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z") },
        { label: "Broadcast",    href: "/admin/dashboard/broadcast",   icon: ic("M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z") },
      ],
    },
    {
      group: "System",
      items: [
        { label: "Settings",     href: "/admin/dashboard/settings",    icon: ic("M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z") },
        { label: "My Profile",   href: "/admin/dashboard/profile",     icon: ic("M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z") },
      ],
    },
  ],
  school_admin: [
    {
      group: "School",
      items: [
        { label: "Overview",       href: "/school/dashboard",               icon: ic("M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"), exact: true },
        { label: "Teachers",       href: "/school/dashboard/teachers",      icon: ic("M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z") },
        { label: "Students",       href: "/school/dashboard/students",      icon: ic("M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z") },
        { label: "Classes",        href: "/school/dashboard/classes",       icon: ic("M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253") },
        { label: "Announcements",  href: "/school/dashboard/announcements", icon: ic("M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z") },
        { label: "Messages",       href: "/school/dashboard/messages",      icon: ic("M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z") },
        { label: "Timetable",      href: "/school/dashboard/timetable",     icon: ic("M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z") },
        { label: "My Profile",     href: "/school/dashboard/profile",       icon: ic("M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z") },
      ],
    },
    {
      group: "Reports",
      items: [
        { label: "Attendance",  href: "/school/dashboard/attendance",  icon: ic("M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4") },
        { label: "Financials",   href: "/school/dashboard/financials",   icon: ic("M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z") },
        { label: "Subscription", href: "/school/dashboard/subscription", icon: ic("M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z") },
      ],
    },
    {
      group: "AI Tools",
      items: [
        { label: "Sir Taks AI",  href: "/school/dashboard/ai",  icon: ic("M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z") },
      ],
    },
  ],
  teacher: [
    {
      group: "Teaching",
      items: [
        { label: "Dashboard",    href: "/teacher/dashboard",            icon: ic("M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"), exact: true },
        { label: "My Classes",   href: "/teacher/dashboard/classes",    icon: ic("M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253") },
        { label: "Lessons",      href: "/teacher/dashboard/lessons",    icon: ic("M15 10l4.553-2.069A1 1 0 0121 8.868V15.13a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z") },
        { label: "Assignments",  href: "/teacher/dashboard/assignments",icon: ic("M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01") },
        { label: "Attendance",   href: "/teacher/dashboard/attendance", icon: ic("M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4") },
        { label: "Grades",       href: "/teacher/dashboard/grades",     icon: ic("M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z") },
        { label: "Timetable",    href: "/teacher/dashboard/timetable",  icon: ic("M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z") },
        { label: "Digital Library", href: "/teacher/dashboard/library", icon: ic("M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253") },
        { label: "HBC Projects", href: "/teacher/dashboard/hbc",          icon: ic("M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z") },
        { label: "Earnings",     href: "/teacher/dashboard/earnings",     icon: ic("M17 9V7a5 5 0 00-10 0v2M5 9h14l1 11H4L5 9z") },
        { label: "Subscription", href: "/teacher/dashboard/subscription", icon: ic("M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z") },
      ],
    },
    {
      group: "Communication",
      items: [
        { label: "Messages",       href: "/teacher/dashboard/messages",       icon: ic("M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z") },
        { label: "Announcements",  href: "/teacher/dashboard/announcements",  icon: ic("M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z") },
        { label: "My Profile",     href: "/teacher/dashboard/profile",        icon: ic("M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z") },
      ],
    },
    {
      group: "AI Tools",
      items: [
        { label: "Sir Taks AI",  href: "/teacher/dashboard/ai",         icon: ic("M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z") },
        { label: "Student AI Activity", href: "/teacher/dashboard/ai-usage", icon: ic("M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z") },
      ],
    },
  ],
  student: [
    {
      group: "Learning",
      items: [
        { label: "Dashboard",    href: "/student/dashboard",            icon: ic("M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"), exact: true },
        { label: "My Lessons",   href: "/student/dashboard/lessons",    icon: ic("M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253") },
        { label: "Assignments",  href: "/student/dashboard/assignments",icon: ic("M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01") },
        { label: "Grades",       href: "/student/dashboard/grades",     icon: ic("M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z") },
        { label: "Exam Prep",    href: "/student/dashboard/exam-prep",  icon: ic("M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z") },
        { label: "Timetable",    href: "/student/dashboard/timetable",  icon: ic("M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z") },
        { label: "Digital Library", href: "/student/dashboard/library", icon: ic("M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253") },
        { label: "Sir Taks AI",  href: "/student/dashboard/ai-tutor",   icon: ic("M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z") },
        { label: "HBC Projects", href: "/student/dashboard/hbc",          icon: ic("M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z") },
        { label: "Subscription", href: "/student/dashboard/subscription", icon: ic("M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z") },
      ],
    },
    {
      group: "Classroom",
      items: [
        { label: "My Classes",   href: "/student/dashboard/classes",    icon: ic("M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z") },
        { label: "Messages",     href: "/student/dashboard/messages",   icon: ic("M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z") },
        { label: "My Profile",   href: "/student/dashboard/profile",    icon: ic("M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z") },
      ],
    },
  ],
  parent: [
    {
      group: "Family",
      items: [
        { label: "Overview",     href: "/parent/dashboard",               icon: ic("M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"), exact: true },
        { label: "Messages",     href: "/parent/dashboard/messages",      icon: ic("M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z") },
        { label: "School News",  href: "/parent/dashboard/announcements", icon: ic("M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z") },
        { label: "Report Cards", href: "/parent/dashboard/grades",        icon: ic("M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z") },
        { label: "Attendance",  href: "/parent/dashboard/attendance",     icon: ic("M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z") },
        { label: "Timetable",   href: "/parent/dashboard/timetable",      icon: ic("M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z") },
        { label: "Subscription", href: "/parent/dashboard/subscription",   icon: ic("M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z") },
        { label: "My Profile",   href: "/parent/dashboard/profile",       icon: ic("M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z") },
      ],
    },
    {
      group: "AI Tools",
      items: [
        { label: "Sir Taks AI",  href: "/parent/dashboard/ai",  icon: ic("M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z") },
      ],
    },
  ],
};

// The middleware already lets super_admin reach any route, and RLS bypasses
// via is_super_admin() cover the data layer — so an admin visiting e.g.
// /teacher/dashboard is using their own real account the whole time, never
// borrowing another person's identity or data. This just derives which
// role's nav/branding to *display* from the current URL, purely a QA/testing
// convenience (see admin sidebar "Preview Dashboards"), so the sidebar
// genuinely looks like the dashboard being tested rather than staying on
// the admin's own nav the whole time.
function deriveDisplayRole(realRole: UserRole, pathname: string): UserRole {
  if (realRole !== "super_admin") return realRole;
  if (pathname.startsWith("/teacher")) return "teacher";
  if (pathname.startsWith("/student")) return "student";
  if (pathname.startsWith("/parent")) return "parent";
  if (pathname.startsWith("/school")) return "school_admin";
  return "super_admin";
}

const PREVIEW_LINKS: { label: string; href: string; role: UserRole }[] = [
  { label: "Student Dashboard", href: "/student/dashboard", role: "student" },
  { label: "Teacher Dashboard", href: "/teacher/dashboard", role: "teacher" },
  { label: "Parent Dashboard",  href: "/parent/dashboard",  role: "parent" },
  { label: "School Dashboard",  href: "/school/dashboard",  role: "school_admin" },
];

interface SidebarProps {
  role: UserRole;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ role, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const displayRole = deriveDisplayRole(role, pathname);
  const isPreviewing = role === "super_admin" && displayRole !== "super_admin";
  const groups = NAV[displayRole] ?? [];

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  const sidebarContent = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Logo */}
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
          <VoaLogoMark size={28} />
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: "#fff", fontSize: "16px", letterSpacing: "-0.01em" }}>
            EduOnLink
          </span>
        </div>
        <RoleBadge role={displayRole} size="xs" />
        {isPreviewing && (
          <Link
            href="/admin/dashboard"
            onClick={onClose}
            style={{
              display: "flex", alignItems: "center", gap: 6, marginTop: 10,
              padding: "6px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600,
              color: "#F5A623", background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)",
              textDecoration: "none",
            }}
          >
            ← Return to Admin
          </Link>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "12px 12px", scrollbarWidth: "none" }}>
        {groups.map((group) => (
          <div key={group.group} style={{ marginBottom: "20px" }}>
            <p style={{
              fontSize: "9px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
              color: "#2A2D3E", fontFamily: "monospace", padding: "0 8px", marginBottom: "6px",
            }}>
              {group.group}
            </p>
            {group.items.map((item) => {
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "9px 10px", borderRadius: "10px", marginBottom: "2px",
                    fontSize: "13px", fontWeight: active ? 600 : 400,
                    color: active ? "#CDD6F4" : "#6B7290",
                    background: active ? "rgba(77,127,255,0.12)" : "transparent",
                    border: active ? "1px solid rgba(77,127,255,0.2)" : "1px solid transparent",
                    textDecoration: "none", transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                      (e.currentTarget as HTMLElement).style.color = "#8892B0";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "#6B7290";
                    }
                  }}
                >
                  <span style={{ opacity: active ? 1 : 0.6, color: active ? "#4D7FFF" : "currentColor", flexShrink: 0 }}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}

        {role === "super_admin" && (
          <div style={{ marginBottom: "20px" }}>
            <p style={{
              fontSize: "9px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase",
              color: "#2A2D3E", fontFamily: "monospace", padding: "0 8px", marginBottom: "6px",
            }}>
              Preview Dashboards
            </p>
            {PREVIEW_LINKS.map((item) => {
              const active = displayRole === item.role;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "9px 10px", borderRadius: "10px", marginBottom: "2px",
                    fontSize: "13px", fontWeight: active ? 600 : 400,
                    color: active ? "#CDD6F4" : "#6B7290",
                    background: active ? "rgba(77,127,255,0.12)" : "transparent",
                    border: active ? "1px solid rgba(77,127,255,0.2)" : "1px solid transparent",
                    textDecoration: "none", transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                      (e.currentTarget as HTMLElement).style.color = "#8892B0";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "#6B7290";
                    }
                  }}
                >
                  <span style={{ opacity: active ? 1 : 0.6, color: active ? "#4D7FFF" : "currentColor", flexShrink: 0 }}>
                    {ic("M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422A12.083 12.083 0 0112 21a12.083 12.083 0 01-6.16-10.422L12 14z")}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 40,
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/*
        Desktop sidebar — position:fixed, never in layout flow.
        Tailwind classes control display (hidden on mobile, flex on lg+).
        No inline display property — prevents inline styles overriding Tailwind.
      */}
      <aside
        className="hidden lg:flex"
        style={{
          position: "fixed",
          left: 0, top: 0, bottom: 0,
          width: 220,
          flexDirection: "column",
          background: "#090B12",
          borderRight: "1px solid rgba(255,255,255,0.05)",
          zIndex: 30,
        }}
      >
        {sidebarContent}
      </aside>

      {/*
        Mobile drawer — fixed overlay, slides in/out with transform.
        Tailwind classes control display (flex on mobile, hidden on lg+).
        Never takes up layout space — content stays 100vw on mobile.
      */}
      <aside
        className="flex lg:hidden"
        style={{
          position: "fixed",
          left: 0, top: 0, bottom: 0,
          width: 240,
          flexDirection: "column",
          background: "#090B12",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          zIndex: 50,
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.22s ease",
        }}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
