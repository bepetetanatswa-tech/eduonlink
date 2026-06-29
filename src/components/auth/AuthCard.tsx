"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
}

export default function AuthCard({ children, title, subtitle, backHref, backLabel }: AuthCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-[440px] mx-auto"
    >
      {/* Back link */}
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm mb-8 transition-colors"
          style={{ color: "#4A5170" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#8892B0")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#4A5170")}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {backLabel ?? "Back"}
        </Link>
      )}

      {/* Card */}
      <div
        className="rounded-2xl p-8"
        style={{
          background: "rgba(11,12,19,0.8)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.03), 0 40px 80px rgba(0,0,0,0.5)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-white text-2xl mb-1.5">{title}</h1>
          {subtitle && <p className="text-sm leading-relaxed" style={{ color: "#6B7290" }}>{subtitle}</p>}
        </div>

        {children}
      </div>
    </motion.div>
  );
}

// ── Divider ────────────────────────────────────────────────────────

export function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
      <span className="text-xs font-medium" style={{ color: "#4A5170" }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
    </div>
  );
}

// ── Submit button ──────────────────────────────────────────────────

interface AuthButtonProps {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "ghost" | "amber" | "mint";
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  className?: string;
}

const VARIANT_STYLES = {
  primary: {
    background: "linear-gradient(135deg, #4D7FFF 0%, #6090FF 100%)",
    boxShadow: "0 0 0 1px rgba(77,127,255,0.4), 0 4px 20px rgba(77,127,255,0.25)",
    color: "#07080C",
  },
  ghost: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.75)",
  },
  amber: {
    background: "linear-gradient(135deg, #F5A623 0%, #F5C042 100%)",
    boxShadow: "0 0 0 1px rgba(245,166,35,0.4), 0 4px 20px rgba(245,166,35,0.25)",
    color: "#07080C",
  },
  mint: {
    background: "linear-gradient(135deg, #00E5A3 0%, #00D496 100%)",
    boxShadow: "0 0 0 1px rgba(0,229,163,0.4), 0 4px 20px rgba(0,229,163,0.2)",
    color: "#07080C",
  },
};

export function AuthButton({
  children, loading, disabled, variant = "primary", type = "submit", onClick, className
}: AuthButtonProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <motion.button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.97 } : {}}
      className={`w-full h-12 rounded-xl font-display font-semibold text-sm flex items-center justify-center gap-2 transition-opacity ${className ?? ""}`}
      style={{
        ...styles,
        opacity: disabled || loading ? 0.5 : 1,
        cursor: disabled || loading ? "not-allowed" : "pointer",
      }}
    >
      {loading ? (
        <>
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Processing…
        </>
      ) : children}
    </motion.button>
  );
}

// ── Error banner ───────────────────────────────────────────────────

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 p-4 rounded-xl mb-4"
      style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
    >
      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="#F87171" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <p className="text-sm" style={{ color: "#F87171" }}>{message}</p>
    </motion.div>
  );
}

// ── Success banner ─────────────────────────────────────────────────

export function AuthSuccess({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 p-4 rounded-xl mb-4"
      style={{ background: "rgba(0,229,163,0.08)", border: "1px solid rgba(0,229,163,0.2)" }}
    >
      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="#00E5A3" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-sm" style={{ color: "#00E5A3" }}>{message}</p>
    </motion.div>
  );
}
