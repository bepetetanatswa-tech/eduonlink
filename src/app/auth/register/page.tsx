"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthCard, { AuthButton, AuthError } from "@/components/auth/AuthCard";
import { FormInput, FormSelect, FormCheckbox, PasswordStrength } from "@/components/auth/FormInput";
import RoleSelector, { ROLE_ICONS } from "@/components/auth/RoleSelector";
import { createClient } from "@/lib/supabase/client";
import { IconMail, IconLock, IconChevronRight, IconFamily } from "@/components/icons";
import {
  FORM_LEVELS,
  ZIMSEC_SUBJECTS,
  PROVINCES,
  ROLE_META,
  isDisposableEmail,
  type RegisterRole,
} from "@/types/auth";
import { gibberishReason, invalidCodeReason } from "@/lib/textQuality";

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
  ztcNumber: string;
  // Step 3 — school admin
  province: string;
  schoolType: string;
  district: string;
  // Step 3 — parent
  childEmail: string;
}

const INITIAL: FormState = {
  role: null,
  email: "", password: "", confirmPassword: "", firstName: "", lastName: "",
  agreeToTerms: false,
  formLevel: "", schoolName: "",
  yearsExperience: "", qualifications: "", teachingSubjects: [], ztcNumber: "",
  province: "", schoolType: "government", district: "",
  childEmail: "",
};

const STEP_TITLES: Record<Step, string> = {
  1: "Choose your role",
  2: "Create your account",
  3: "Complete your profile",
};

const STEP_SUBS: Record<Step, string> = {
  1: "How will you use EduOnLink?",
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
      const firstNameIssue = gibberishReason(form.firstName);
      if (firstNameIssue) { setError(`First name: ${firstNameIssue}`); return; }
      const lastNameIssue = gibberishReason(form.lastName);
      if (lastNameIssue) { setError(`Last name: ${lastNameIssue}`); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError("Enter a valid email address."); return; }
      if (isDisposableEmail(form.email)) { setError("Temporary/disposable email addresses aren't allowed. Please use a permanent email address."); return; }
      if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
      if (!/[A-Z]/.test(form.password)) { setError("Password must contain at least one uppercase letter."); return; }
      if (!/[0-9]/.test(form.password)) { setError("Password must contain at least one number."); return; }
      if (!/[^A-Za-z0-9]/.test(form.password)) { setError("Password must contain at least one special character."); return; }
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
      if (!form.ztcNumber.trim()) { setError("Please enter your Zimbabwe Teachers Council (ZTC) registration number."); return; }
      const qualificationsIssue = gibberishReason(form.qualifications, { minLength: 3 });
      if (qualificationsIssue) { setError(`Qualifications: ${qualificationsIssue}`); return; }
      const ztcIssue = invalidCodeReason(form.ztcNumber);
      if (ztcIssue) { setError(`ZTC number: ${ztcIssue}`); return; }
    }
    if (form.role === "school_admin") {
      if (!form.schoolName.trim()) { setError("Please enter your school name."); return; }
      if (!form.province) { setError("Please select your province."); return; }
      const schoolNameIssue = gibberishReason(form.schoolName, { minLength: 3 });
      if (schoolNameIssue) { setError(`School name: ${schoolNameIssue}`); return; }
    }

    setLoading(true);

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: `${form.firstName} ${form.lastName}`.trim(),
            first_name: form.firstName,
            last_name: form.lastName,
            role: form.role,
            form_level: form.formLevel || null,
            school_name: form.schoolName || null,
            province: form.province || null,
            school_type: form.schoolType || null,
            district: form.district || null,
            qualifications: form.qualifications || null,
            years_experience: form.yearsExperience ? parseInt(form.yearsExperience) : null,
            teaching_subjects: form.teachingSubjects.length > 0 ? form.teachingSubjects : null,
            ztc_number: form.ztcNumber || null,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        },
      });

      if (signUpError) {
        const raw = String(signUpError.message ?? "");
        const lower = raw.toLowerCase();

        let displayError: string;
        if (lower.includes("already registered") || lower.includes("already exists") || lower.includes("email address is already")) {
          displayError = "An account with this email already exists. Try signing in instead.";
        } else if (signUpError.status === 500 || raw === "{}" || raw === "unexpected_failure" || raw === "" || !raw) {
          displayError = "Registration is currently unavailable — the platform email service is not configured. Please contact the administrator.";
        } else if (lower.includes("email") && lower.includes("send")) {
          displayError = "Could not send the verification email. Please contact support.";
        } else {
          displayError = raw || `Registration failed (code ${signUpError.status ?? "unknown"}). Please try again.`;
        }

        setError(displayError);
        return;
      }

      // If email confirmation is disabled, Supabase returns a session immediately.
      // This path never hits /auth/callback, so profile creation/backfill has
      // to be triggered explicitly here before we send them to onboarding.
      if (signUpData?.session) {
        await fetch("/api/auth/ensure-profile", { method: "POST" }).catch(() => {});
        router.push("/onboarding");
      } else {
        router.push(`/auth/verify-email?email=${encodeURIComponent(form.email)}`);
      }
    } catch (err: unknown) {
      console.error("Unexpected signUp exception:", err);
      if (err instanceof Error) {
        setError(err.message || "An unexpected error occurred. Please try again.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
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
    <div className="flex flex-col gap-2 mb-8">
      <div className="flex gap-1.5">
        {([1, 2, 3] as Step[]).map((s) => (
          <div key={s} className="flex-1 h-[3px]" style={{ background: s <= step ? "#B1502B" : "#CCD0C0" }} />
        ))}
      </div>
      <span className="text-xs text-edu-slate-500">Step {step} of 3</span>
    </div>
  );

  const RoleIcon = form.role ? ROLE_ICONS[form.role] : null;

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

      {/* ── Step 1: Role ── */}
      {step === 1 && (
        <div className="flex flex-col gap-6">
          <RoleSelector value={form.role} onChange={(r) => set("role", r)} />
          <AuthButton type="button" onClick={nextStep}>
            Continue
            <IconChevronRight size={16} />
          </AuthButton>

          <p className="text-sm text-center text-edu-slate-500">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-semibold text-edu-copper">Sign in</Link>
          </p>
        </div>
      )}

      {/* ── Step 2: Account details ── */}
      {step === 2 && (
        <form onSubmit={(e) => { e.preventDefault(); nextStep(); }} className="flex flex-col gap-4">
          {form.role && RoleIcon && (
            <div className="flex items-center gap-2 px-3 py-2 rounded w-fit bg-edu-copper-50 border border-edu-copper-200">
              <RoleIcon size={16} className="text-edu-copper" />
              <span className="text-sm font-semibold text-edu-copper">
                {ROLE_META[form.role].label}
              </span>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="ml-1 text-xs text-edu-copper opacity-70 hover:opacity-100 transition-opacity"
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
            icon={<IconMail />}
          />

          <div>
            <FormInput
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="Create a strong password"
              autoComplete="new-password"
              icon={<IconLock />}
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
                <a href="/terms" className="underline text-edu-copper">Terms of Service</a>
                {" "}and{" "}
                <a href="/privacy" className="underline text-edu-copper">Privacy Policy</a>
              </span>
            }
            checked={form.agreeToTerms}
            onChange={(v) => set("agreeToTerms", v)}
          />

          <AuthButton type="submit">
            Continue
            <IconChevronRight size={16} />
          </AuthButton>

          <button
            type="button"
            onClick={() => setStep(1)}
            className="text-sm text-center text-edu-slate-500 hover:text-edu-ink transition-colors"
          >
            Back to role selection
          </button>
        </form>
      )}

      {/* ── Step 3: Role-specific profile ── */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              <div className="p-4 rounded text-sm bg-edu-gold-50 border border-edu-gold-200 text-edu-slate-600">
                Teacher accounts are reviewed before you can access teaching features. After registering, you&apos;ll be asked to upload proof of your qualifications and ID — approval usually takes 1-2 business days.
              </div>
              <FormInput
                label="Zimbabwe Teachers Council (ZTC) number"
                type="text"
                value={form.ztcNumber}
                onChange={(e) => set("ztcNumber", e.target.value)}
                placeholder="e.g. ZTC-2019-04521"
              />
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
                <label className="text-sm font-medium text-edu-slate-600">
                  Teaching subjects <span className="text-xs font-normal ml-1 text-edu-slate-500">({form.teachingSubjects.length} selected)</span>
                </label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {ZIMSEC_SUBJECTS.map((subject) => {
                    const active = form.teachingSubjects.includes(subject);
                    return (
                      <button
                        key={subject}
                        type="button"
                        onClick={() => toggleSubject(subject)}
                        className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors duration-150 ${
                          active ? "bg-edu-copper-100 border-edu-copper-300 text-edu-copper-dark" : "border-edu-slate-300 text-edu-slate-500"
                        }`}
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
              <div className="p-4 rounded text-sm bg-edu-copper-50 border border-edu-copper-200 text-edu-slate-600">
                You can link your child&apos;s account now or do it later from your parent dashboard.
              </div>
              <FormInput
                label="Child's email address (optional)"
                type="email"
                value={form.childEmail}
                onChange={(e) => set("childEmail", e.target.value)}
                placeholder="child@example.com"
                hint="Your child must already have a EduOnLink student account"
                icon={<IconFamily size={16} />}
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
              <FormInput
                label="District"
                type="text"
                value={form.district}
                onChange={(e) => set("district", e.target.value)}
                placeholder="e.g. Goromonzi"
              />
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
            className="text-sm text-center text-edu-slate-500 hover:text-edu-ink transition-colors"
          >
            Back
          </button>
        </form>
      )}
    </AuthCard>
  );
}
