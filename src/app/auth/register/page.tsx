"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import AuthCard, { AuthButton, AuthError } from "@/components/auth/AuthCard";
import { FormInput, FormSelect, FormCheckbox, PasswordStrength } from "@/components/auth/FormInput";
import RoleSelector from "@/components/auth/RoleSelector";
import { createClient } from "@/lib/supabase/client";
import {
  FORM_LEVELS,
  ZIMSEC_SUBJECTS,
  PROVINCES,
  ROLE_META,
  type RegisterRole,
} from "@/types/auth";

type Step = 1 | 2 | 3;

interface FormState {
  // Step 1
  role: RegisterRole | null;
  // Step 2
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  agreeToTerms: boolean;
  // Step 3 — student
  formLevel: string;
  schoolName: string;
  // Step 3 — teacher
  yearsExperience: string;
  qualifications: string;
  teachingSubjects: string[];
  // Step 3 — school admin
  province: string;
  schoolType: string;
  // Step 3 — parent
  childEmail: string;
}

const INITIAL: FormState = {
  role: null,
  email: "", password: "", confirmPassword: "", firstName: "", lastName: "",
  agreeToTerms: false,
  formLevel: "", schoolName: "",
  yearsExperience: "", qualifications: "", teachingSubjects: [],
  province: "", schoolType: "government",
  childEmail: "",
};

const STEP_TITLES: Record<Step, string> = {
  1: "Choose your role",
  2: "Create your account",
  3: "Complete your profile",
};

const STEP_SUBS: Record<Step, string> = {
  1: "How will you use VOA?",
  2: "Set up your sign-in details",
  3: "A few more details to personalise your experience",
};

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const set = (field: keyof FormState, val: unknown) =>
    setForm((prev) => ({ ...prev, [field]: val }));

  // ── Step navigation ────────────────────────────────────────────

  const nextStep = () => {
    setError(null);
    if (step === 1) {
      if (!form.role) { setError("Please select your role to continue."); return; }
    }
    if (step === 2) {
      if (!form.firstName.trim()) { setError("First name is required."); return; }
      if (!form.lastName.trim()) { setError("Last name is required."); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError("Enter a valid email address."); return; }
      if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
      if (!/[A-Z]/.test(form.password)) { setError("Password must contain at least one uppercase letter."); return; }
      if (!/[0-9]/.test(form.password)) { setError("Password must contain at least one number."); return; }
      if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
      if (!form.agreeToTerms) { setError("You must agree to the terms of service."); return; }
    }
    setStep((s) => Math.min(s + 1, 3) as Step);
  };

  // ── Submit ─────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.role === "student" && !form.formLevel) { setError("Please select your form/grade level."); return; }
    if (form.role === "teacher") {
      if (!form.qualifications.trim()) { setError("Please enter your qualifications."); return; }
      if (form.teachingSubjects.length === 0) { setError("Select at least one teaching subject."); return; }
    }
    if (form.role === "school_admin") {
      if (!form.schoolName.trim()) { setError("Please enter your school name."); return; }
      if (!form.province) { setError("Please select your province."); return; }
    }

    setLoading(true);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            first_name: form.firstName,
            last_name: form.lastName,
            role: form.role,
            form_level: form.formLevel || null,
            school_name: form.schoolName || null,
            province: form.province || null,
            school_type: form.schoolType || null,
            qualifications: form.qualifications || null,
            years_experience: form.yearsExperience ? parseInt(form.yearsExperience) : null,
            teaching_subjects: form.teachingSubjects.length > 0 ? form.teachingSubjects : null,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        },
      });

      if (signUpError) {
        console.error("Supabase signUp error:", {
          message: signUpError.message,
          status: signUpError.status,
          name: signUpError.name,
          raw: signUpError,
        });
        const msg = typeof signUpError.message === "string" ? signUpError.message : "";
        setError(
          msg.toLowerCase().includes("already registered") || msg.toLowerCase().includes("already exists")
            ? "An account with this email already exists. Try signing in instead."
            : msg || `Registration failed (code ${signUpError.status ?? "unknown"}). Please try again.`
        );
        return;
      }

      router.push(`/auth/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (err: unknown) {
      console.error("Unexpected signUp error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSubject = (subject: string) => {
    set("teachingSubjects", form.teachingSubjects.includes(subject)
      ? form.teachingSubjects.filter((s) => s !== subject)
      : [...form.teachingSubjects, subject]
    );
  };

  // ── Progress indicator ─────────────────────────────────────────

  const StepProgress = () => (
    <div className="flex items-center gap-2 mb-8">
      {([1, 2, 3] as Step[]).map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all duration-300"
            style={{
              background: s < step ? "#00E5A3" : s === step ? "rgba(77,127,255,0.2)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${s < step ? "#00E5A3" : s === step ? "rgba(77,127,255,0.6)" : "rgba(255,255,255,0.08)"}`,
              color: s < step ? "#07080C" : s === step ? "#4D7FFF" : "#4A5170",
            }}
          >
            {s < step ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : s}
          </div>
          {s < 3 && (
            <div className="w-8 h-px transition-all duration-300" style={{ background: s < step ? "#00E5A3" : "rgba(255,255,255,0.08)" }} />
          )}
        </div>
      ))}
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────

  return (
    <AuthCard
      title={STEP_TITLES[step]}
      subtitle={STEP_SUBS[step]}
      backHref={step === 1 ? "/auth/login" : undefined}
      backLabel="Sign in instead"
    >
      <StepProgress />

      <AuthError message={error} />

      <AnimatePresence mode="wait">
        {/* ── Step 1: Role ── */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            <RoleSelector value={form.role} onChange={(r) => set("role", r)} />
            <AuthButton type="button" onClick={nextStep}>
              Continue
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </AuthButton>

            <p className="text-sm text-center" style={{ color: "#4A5170" }}>
              Already have an account?{" "}
              <Link href="/auth/login" className="font-semibold" style={{ color: "#4D7FFF" }}>Sign in</Link>
            </p>
          </motion.div>
        )}

        {/* ── Step 2: Account details ── */}
        {step === 2 && (
          <motion.form
            key="step2"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            onSubmit={(e) => { e.preventDefault(); nextStep(); }}
            className="flex flex-col gap-4"
          >
            {/* Role badge */}
            {form.role && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg w-fit"
                style={{ background: `${ROLE_META[form.role].accent}12`, border: `1px solid ${ROLE_META[form.role].accent}25` }}
              >
                <span className="text-base">{ROLE_META[form.role].icon}</span>
                <span className="text-sm font-semibold" style={{ color: ROLE_META[form.role].accent }}>
                  {ROLE_META[form.role].label}
                </span>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="ml-1 text-xs opacity-60 hover:opacity-100 transition-opacity"
                  style={{ color: ROLE_META[form.role].accent }}
                >
                  Change
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <FormInput
                label="First name"
                type="text"
                value={form.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                placeholder="Taks"
                autoComplete="given-name"
              />
              <FormInput
                label="Last name"
                type="text"
                value={form.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                placeholder="Bepete"
                autoComplete="family-name"
              />
            </div>

            <FormInput
              label="Email address"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              }
            />

            <div>
              <FormInput
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Create a strong password"
                autoComplete="new-password"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
              />
              <PasswordStrength password={form.password} />
            </div>

            <FormInput
              label="Confirm password"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => set("confirmPassword", e.target.value)}
              placeholder="Repeat your password"
              autoComplete="new-password"
              error={form.confirmPassword && form.password !== form.confirmPassword ? "Passwords don't match" : undefined}
            />

            <FormCheckbox
              label={
                <span>
                  I agree to the{" "}
                  <a href="/terms" className="underline" style={{ color: "#4D7FFF" }}>Terms of Service</a>
                  {" "}and{" "}
                  <a href="/privacy" className="underline" style={{ color: "#4D7FFF" }}>Privacy Policy</a>
                </span>
              }
              checked={form.agreeToTerms}
              onChange={(v) => set("agreeToTerms", v)}
            />

            <AuthButton type="submit">
              Continue
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </AuthButton>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm text-center transition-colors"
              style={{ color: "#4A5170" }}
            >
              ← Back to role selection
            </button>
          </motion.form>
        )}

        {/* ── Step 3: Role-specific profile ── */}
        {step === 3 && (
          <motion.form
            key="step3"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            {/* Student */}
            {form.role === "student" && (
              <>
                <FormSelect
                  label="Your form / grade level"
                  value={form.formLevel}
                  onChange={(e) => set("formLevel", e.target.value)}
                >
                  <option value="" disabled>Select your level</option>
                  {["Primary", "O-Level", "A-Level"].map((group) => (
                    <optgroup key={group} label={group}>
                      {FORM_LEVELS.filter((f) => f.group === group).map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </FormSelect>
                <FormInput
                  label="School name (optional)"
                  type="text"
                  value={form.schoolName}
                  onChange={(e) => set("schoolName", e.target.value)}
                  placeholder="e.g. Harare High School"
                />
              </>
            )}

            {/* Teacher */}
            {form.role === "teacher" && (
              <>
                <FormInput
                  label="Qualifications"
                  type="text"
                  value={form.qualifications}
                  onChange={(e) => set("qualifications", e.target.value)}
                  placeholder="e.g. BSc Education, PGDE"
                />
                <FormInput
                  label="Years of teaching experience"
                  type="number"
                  value={form.yearsExperience}
                  onChange={(e) => set("yearsExperience", e.target.value)}
                  placeholder="5"
                  min="0"
                  max="50"
                />
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium" style={{ color: "#8892B0" }}>
                    Teaching subjects <span className="text-xs font-normal ml-1" style={{ color: "#4A5170" }}>({form.teachingSubjects.length} selected)</span>
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                    {ZIMSEC_SUBJECTS.map((subject) => {
                      const active = form.teachingSubjects.includes(subject);
                      return (
                        <button
                          key={subject}
                          type="button"
                          onClick={() => toggleSubject(subject)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150"
                          style={{
                            background: active ? "rgba(77,127,255,0.15)" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${active ? "rgba(77,127,255,0.4)" : "rgba(255,255,255,0.08)"}`,
                            color: active ? "#7AA5FF" : "#4A5170",
                          }}
                        >
                          {subject}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Parent */}
            {form.role === "parent" && (
              <>
                <div
                  className="p-4 rounded-xl text-sm"
                  style={{ background: "rgba(77,127,255,0.06)", border: "1px solid rgba(77,127,255,0.12)", color: "#6B7290" }}
                >
                  You can link your child&apos;s account now or do it later from your parent dashboard.
                </div>
                <FormInput
                  label="Child's email address (optional)"
                  type="email"
                  value={form.childEmail}
                  onChange={(e) => set("childEmail", e.target.value)}
                  placeholder="child@example.com"
                  hint="Your child must already have a VOA student account"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                />
              </>
            )}

            {/* School admin */}
            {form.role === "school_admin" && (
              <>
                <FormInput
                  label="School name"
                  type="text"
                  value={form.schoolName}
                  onChange={(e) => set("schoolName", e.target.value)}
                  placeholder="e.g. St George's College"
                />
                <FormSelect
                  label="Province"
                  value={form.province}
                  onChange={(e) => set("province", e.target.value)}
                >
                  <option value="" disabled>Select a province</option>
                  {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                </FormSelect>
                <FormSelect
                  label="School type"
                  value={form.schoolType}
                  onChange={(e) => set("schoolType", e.target.value)}
                >
                  <option value="government">Government</option>
                  <option value="private">Private</option>
                  <option value="mission">Mission</option>
                  <option value="international">International</option>
                </FormSelect>
              </>
            )}

            <AuthButton loading={loading} type="submit">
              Create Account
            </AuthButton>

            <button
              type="button"
              onClick={() => { setStep(2); setError(null); }}
              className="text-sm text-center transition-colors"
              style={{ color: "#4A5170" }}
            >
              ← Back
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthCard>
  );
}
