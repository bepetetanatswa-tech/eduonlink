"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const S = { border: "rgba(28,38,32,0.07)", accent: "#B1502B", muted: "#566257" };

const TABS = [
  { key: "chat", label: "Chat" },
  { key: "live", label: "Live" },
  { key: "lessons", label: "Lessons" },
  { key: "assignments", label: "Assignments" },
  { key: "attendance", label: "Attendance" },
  { key: "students", label: "Students" },
  { key: "resources", label: "Resources" },
];

export function ClassTabNav({ classId, basePath }: { classId: string; basePath: string }) {
  const pathname = usePathname();

  return (
    <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${S.border}`, overflowX: "auto" }}>
      {TABS.map((tab) => {
        const href = `${basePath}/${classId}/${tab.key}`;
        const active = pathname.startsWith(href);
        return (
          <Link
            key={tab.key}
            href={href}
            style={{
              padding: "10px 16px",
              fontSize: 13,
              fontWeight: 600,
              color: active ? S.accent : S.muted,
              textDecoration: "none",
              borderBottom: active ? `2px solid ${S.accent}` : "2px solid transparent",
              whiteSpace: "nowrap",
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
