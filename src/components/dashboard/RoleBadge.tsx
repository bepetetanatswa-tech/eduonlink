import type { UserRole } from "@/types/database";

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; bg: string; border: string }> = {
  super_admin:  { label: "Super Admin",  color: "#A9873F", bg: "rgba(169,135,63,0.12)",  border: "rgba(169,135,63,0.3)"  },
  school_admin: { label: "School Admin", color: "#B1502B", bg: "rgba(177,80,43,0.12)",   border: "rgba(177,80,43,0.3)"   },
  teacher:      { label: "Teacher",      color: "#1F4738", bg: "rgba(31,71,56,0.1)",     border: "rgba(31,71,56,0.3)"    },
  student:      { label: "Student",      color: "#566257", bg: "rgba(86,98,87,0.1)",     border: "rgba(86,98,87,0.3)"    },
  parent:       { label: "Parent",       color: "#3E4A41", bg: "rgba(62,74,65,0.1)",     border: "rgba(62,74,65,0.3)"    },
};

export function RoleBadge({ role, size = "sm" }: { role: UserRole; size?: "xs" | "sm" | "md" }) {
  const cfg = ROLE_CONFIG[role];
  const px = size === "xs" ? "5px 8px" : size === "md" ? "6px 14px" : "4px 10px";
  const fs = size === "xs" ? "10px" : size === "md" ? "13px" : "11px";
  return (
    <span
      className="font-display"
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: px,
        fontSize: fs,
        fontWeight: 600,
        letterSpacing: "0.02em",
        borderRadius: "3px",
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
