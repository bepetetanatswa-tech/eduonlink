"use client";

import { motion } from "framer-motion";
import { ROLE_META, type RegisterRole } from "@/types/auth";

interface RoleSelectorProps {
  value: RegisterRole | null;
  onChange: (role: RegisterRole) => void;
}

export default function RoleSelector({ value, onChange }: RoleSelectorProps) {
  const roles = Object.entries(ROLE_META) as [RegisterRole, (typeof ROLE_META)[RegisterRole]][];

  return (
    <div className="grid grid-cols-2 gap-3">
      {roles.map(([role, meta], i) => {
        const selected = value === role;
        return (
          <motion.button
            key={role}
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            onClick={() => onChange(role)}
            className="relative p-4 rounded-xl text-left transition-all duration-200 focus:outline-none"
            style={{
              background: selected ? `${meta.accent}12` : "rgba(255,255,255,0.03)",
              border: `1px solid ${selected ? `${meta.accent}40` : "rgba(255,255,255,0.07)"}`,
              boxShadow: selected ? `0 0 0 1px ${meta.accent}20, 0 4px 20px ${meta.accent}10` : "none",
            }}
          >
            {/* Selected check */}
            {selected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: meta.accent }}
              >
                <svg className="w-3 h-3" fill="none" stroke="#07080C" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            )}

            {/* Icon */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3"
              style={{
                background: `${meta.accent}15`,
                border: `1px solid ${meta.accent}20`,
              }}
            >
              {meta.icon}
            </div>

            {/* Label */}
            <p
              className="font-display font-semibold text-sm mb-1 transition-colors"
              style={{ color: selected ? meta.accent : "#C0C8E0" }}
            >
              {meta.label}
            </p>

            {/* Description */}
            <p className="text-xs leading-snug" style={{ color: "#4A5170" }}>
              {meta.description}
            </p>
          </motion.button>
        );
      })}
    </div>
  );
}
