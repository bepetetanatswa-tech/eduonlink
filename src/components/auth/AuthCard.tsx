"use client";

import Link from "next/link";
import { IconChevronRight } from "@/components/icons";

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
}

export default function AuthCard({ children, title, subtitle, backHref, backLabel }: AuthCardProps) {
  return (
    <div className="w-full max-w-[440px] mx-auto">
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm mb-8 text-edu-slate-600 hover:text-edu-ink transition-colors"
        >
          <IconChevronRight size={14} className="rotate-180" />
          {backLabel ?? "Back"}
        </Link>
      )}

      <div className="border border-edu-slate-300 rounded p-8">
        <div className="mb-8">
          <h1 className="font-display font-semibold text-edu-ink text-2xl mb-1.5">{title}</h1>
          {subtitle && <p className="text-sm leading-relaxed text-edu-slate-600">{subtitle}</p>}
        </div>

        {children}
      </div>
    </div>
  );
}

export function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 ruled-divider" />
      <span className="text-xs font-medium text-edu-slate-500">{label}</span>
      <div className="flex-1 ruled-divider" />
    </div>
  );
}

interface AuthButtonProps {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "ghost";
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  className?: string;
}

export function AuthButton({
  children, loading, disabled, variant = "primary", type = "submit", onClick, className
}: AuthButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`w-full h-12 flex items-center justify-center gap-2 ${variant === "primary" ? "btn-primary" : "btn-ghost"} ${className ?? ""}`}
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
    </button>
  );
}

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-3 p-4 rounded mb-4 bg-edu-clay-100 border border-edu-clay-200">
      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="#A3311E" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <p className="text-sm text-edu-clay-dark">{message}</p>
    </div>
  );
}

export function AuthSuccess({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-3 p-4 rounded mb-4 bg-edu-bottle-100 border border-edu-bottle-200">
      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="#1F4738" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-sm text-edu-bottle-dark">{message}</p>
    </div>
  );
}
