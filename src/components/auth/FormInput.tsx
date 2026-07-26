"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { IconChevronDown, IconCheck } from "@/components/icons";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, hint, icon, type, className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-edu-slate-600">{label}</label>

        <div className="relative">
          {icon && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none text-edu-slate-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            className={`field ${className ?? ""}`}
            data-error={!!error}
            style={{
              paddingLeft: icon ? "26px" : "2px",
              paddingRight: isPassword ? "30px" : "2px",
            }}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-edu-slate-400 hover:text-edu-slate-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          )}
        </div>

        {error && <p className="text-xs text-edu-clay">{error}</p>}
        {hint && !error && <p className="text-xs text-edu-slate-500">{hint}</p>}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";

// ── Select ────────────────────────────────────────────────────────

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  children: React.ReactNode;
}

export function FormSelect({ label, error, children, ...props }: FormSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-edu-slate-600">{label}</label>
      <div className="relative">
        <select className="field appearance-none pr-6 cursor-pointer" data-error={!!error} {...props}>
          {children}
        </select>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-edu-slate-400">
          <IconChevronDown size={14} />
        </div>
      </div>
      {error && <p className="text-xs text-edu-clay">{error}</p>}
    </div>
  );
}

// ── Checkbox ──────────────────────────────────────────────────────

interface FormCheckboxProps {
  label: React.ReactNode;
  error?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

export function FormCheckbox({ label, error, checked, onChange }: FormCheckboxProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="flex items-start gap-3 cursor-pointer">
        <div className="relative mt-0.5 flex-shrink-0">
          <input
            type="checkbox"
            className="sr-only"
            checked={checked}
            onChange={(e) => onChange?.(e.target.checked)}
          />
          <div
            className={`w-4 h-4 rounded-sm flex items-center justify-center border ${checked ? "bg-edu-copper border-edu-copper text-edu-paper" : "border-edu-slate-400 text-transparent"}`}
          >
            <IconCheck size={11} strokeWidth={3} />
          </div>
        </div>
        <span className="text-sm leading-relaxed text-edu-slate-600">{label}</span>
      </label>
      {error && <p className="text-xs text-edu-clay ml-7">{error}</p>}
    </div>
  );
}

// ── Password strength ─────────────────────────────────────────────

export function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters",    pass: password.length >= 8 },
    { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "Number",           pass: /[0-9]/.test(password) },
    { label: "Special character", pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const strength = checks.filter((c) => c.pass).length;
  const strengthColor = ["#8D9689", "#A3311E", "#A9873F", "#A9873F", "#1F4738"][strength];
  const labels = ["", "Weak", "Fair", "Good", "Strong"];

  if (!password) return null;

  return (
    <div className="flex flex-col gap-2 mt-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-1 h-[3px] transition-colors duration-200"
            style={{ background: i < strength ? strengthColor : "#CCD0C0" }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          {checks.map((c) => (
            <span key={c.label} className="flex items-center gap-1 text-[11px]" style={{ color: c.pass ? "#1F4738" : "#8D9689" }}>
              {c.pass && <IconCheck size={9} strokeWidth={3} />}
              {c.label}
            </span>
          ))}
        </div>
        <span className="text-[11px] font-semibold" style={{ color: strengthColor }}>
          {labels[strength]}
        </span>
      </div>
    </div>
  );
}
