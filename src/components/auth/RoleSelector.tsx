"use client";

import { ROLE_META, type RegisterRole } from "@/types/auth";
import { IconGraduate, IconChalkboard, IconFamily, IconSchool, IconCheck } from "@/components/icons";

export const ROLE_ICONS: Record<RegisterRole, React.ComponentType<{ size?: number; className?: string }>> = {
  student: IconGraduate,
  teacher: IconChalkboard,
  parent: IconFamily,
  school_admin: IconSchool,
};

interface RoleSelectorProps {
  value: RegisterRole | null;
  onChange: (role: RegisterRole) => void;
}

export default function RoleSelector({ value, onChange }: RoleSelectorProps) {
  const roles = Object.entries(ROLE_META) as [RegisterRole, (typeof ROLE_META)[RegisterRole]][];

  return (
    <div className="grid grid-cols-2 gap-3">
      {roles.map(([role, meta]) => {
        const selected = value === role;
        const RoleIcon = ROLE_ICONS[role];
        return (
          <button
            key={role}
            type="button"
            onClick={() => onChange(role)}
            className={`relative p-4 rounded text-left border transition-colors duration-150 focus:outline-none ${
              selected ? "border-edu-copper bg-edu-copper-50" : "border-edu-slate-300 hover:border-edu-slate-400"
            }`}
          >
            {selected && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-edu-copper text-edu-paper flex items-center justify-center">
                <IconCheck size={11} strokeWidth={3} />
              </div>
            )}

            <div className={`mb-3 ${selected ? "text-edu-copper" : "text-edu-slate-500"}`}>
              <RoleIcon size={24} />
            </div>

            <p className={`font-display font-semibold text-sm mb-1 ${selected ? "text-edu-copper" : "text-edu-ink"}`}>
              {meta.label}
            </p>
            <p className="text-xs leading-snug text-edu-slate-500">{meta.description}</p>
          </button>
        );
      })}
    </div>
  );
}
