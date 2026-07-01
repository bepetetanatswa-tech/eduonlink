import type { UserRole } from "@/types/database";

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; bg: string; border: string }> = {
  super_admin:  { label: "Super Admin",  color: "#F5A623", bg: "rgba(245,166,35,0.12)",  border: "rgba(245,166,35,0.25)"  },
  school_admin: { label: "School Admin", color: "#4D7FFF", bg: "rgba(77,127,255,0.12)", border: "rgba(77,127,255,0.25)"  },
  teacher:      { label: "Teacher",      color: "#00E5A3", bg: "rgba(0,229,163,0.12)",  border: "rgba(0,229,163,0.25)"   },
  student:      { label: "Student",      color: "#BD93F9", bg: "rgba(189,147,249,0.12)", border: "rgba(189,147,249,0.25)" },
  parent:       { label: "Parent",       color: "#FF9A3C", bg: "rgba(255,154,60,0.12)", border: "rgba(255,154,60,0.25)"  },
};

export function RoleBadge({ role, size = "sm" }: { role: UserRole; size?: "xs" | "sm" | "md" }) {
  const cfg = ROLE_CONFIG[role];
  const px = size === "xs" ? "6px 8px" : size === "md" ? "6px 14px" : "4px 10px";
  const fs = size === "xs" ? "10px" : size === "md" ? "13px" : "11px";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: px,
        fontSize: fs,
        fontWeight: 600,
        fontFamily: "'Space Grotesk', sans-serif",
        letterSpacing: "0.04em",
        borderRadius: "6px",
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
}
