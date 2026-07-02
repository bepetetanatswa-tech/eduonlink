"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";

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
        <label className="text-sm font-medium" style={{ color: "#8892B0" }}>
          {label}
        </label>

        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#4A5170" }}>
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            className={`w-full h-12 rounded-xl text-sm text-white outline-none transition-all duration-200 ${className ?? ""}`}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.08)"}`,
              paddingLeft: icon ? "44px" : "16px",
              paddingRight: isPassword ? "44px" : "16px",
              fontFamily: "DM Sans, sans-serif",
              WebkitTextFillColor: "white",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = error ? "rgba(239,68,68,0.8)" : "rgba(77,127,255,0.6)";
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              e.currentTarget.style.boxShadow = error
                ? "0 0 0 3px rgba(239,68,68,0.12)"
                : "0 0 0 3px rgba(77,127,255,0.12)";
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.08)";
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              e.currentTarget.style.boxShadow = "none";
              props.onBlur?.(e);
            }}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: "#4A5170" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#8892B0")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#4A5170")}
              tabIndex={-1}
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          )}
        </div>

        {error && <p className="text-xs" style={{ color: "#F87171" }}>{error}</p>}
        {hint && !error && <p className="text-xs" style={{ color: "#4A5170" }}>{hint}</p>}
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
      <label className="text-sm font-medium" style={{ color: "#8892B0" }}>{label}</label>
      <select
        className="w-full h-12 rounded-xl text-sm text-white outline-none transition-all duration-200 px-4 cursor-pointer"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.08)"}`,
          fontFamily: "DM Sans, sans-serif",
          WebkitAppearance: "none",
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234A5170'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center",
          backgroundSize: "16px",
          paddingRight: "40px",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "rgba(77,127,255,0.6)";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(77,127,255,0.12)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.08)";
          e.currentTarget.style.boxShadow = "none";
        }}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs" style={{ color: "#F87171" }}>{error}</p>}
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
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative mt-0.5 flex-shrink-0">
          <input
            type="checkbox"
            className="sr-only"
            checked={checked}
            onChange={(e) => onChange?.(e.target.checked)}
          />
          <div
            className="w-4 h-4 rounded flex items-center justify-center transition-all duration-200"
            style={{
              background: checked ? "#4D7FFF" : "rgba(255,255,255,0.04)",
              border: `1px solid ${checked ? "#4D7FFF" : "rgba(255,255,255,0.15)"}`,
            }}
          >
            {checked && (
              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
        <span className="text-sm leading-relaxed" style={{ color: "#6B7290" }}>{label}</span>
      </label>
      {error && <p className="text-xs ml-7" style={{ color: "#F87171" }}>{error}</p>}
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
  const colors = ["#4A5170", "#EF4444", "#F5A623", "#F5A623", "#00E5A3"];
  const labels = ["", "Weak", "Fair", "Good", "Strong"];

  if (!password) return null;

  return (
    <div className="flex flex-col gap-2 mt-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ background: i < strength ? colors[strength] : "rgba(255,255,255,0.06)" }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          {checks.map((c) => (
            <span key={c.label} className="flex items-center gap-1 text-[11px]"
              style={{ color: c.pass ? "#00E5A3" : "#4A5170" }}
            >
              <span>{c.pass ? "✓" : "○"}</span>
              {c.label}
            </span>
          ))}
        </div>
        <span className="text-[11px] font-semibold" style={{ color: colors[strength] }}>
          {labels[strength]}
        </span>
      </div>
    </div>
  );
}
