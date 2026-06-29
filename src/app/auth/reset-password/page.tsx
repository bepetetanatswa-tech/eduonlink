"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import AuthCard, { AuthButton, AuthError } from "@/components/auth/AuthCard";
import { FormInput, PasswordStrength } from "@/components/auth/FormInput";
import { createClient } from "@/lib/supabase/client";
import { resetPasswordSchema } from "@/types/auth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = resetPasswordSchema.safeParse({ password, confirmPassword: confirm });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) { setError(updateError.message); return; }
    setDone(true);
    setTimeout(() => router.push("/auth/login"), 2500);
  };

  if (done) {
    return (
      <AuthCard title="Password updated" subtitle="Your new password is set — signing you in">
        <div className="flex flex-col items-center gap-4 py-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(0,229,163,0.12)", border: "1px solid rgba(0,229,163,0.25)" }}
          >
            <svg className="w-8 h-8" fill="none" stroke="#00E5A3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </motion.div>
          <p className="text-sm text-center" style={{ color: "#6B7290" }}>
            Redirecting you to sign in…
          </p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Set new password" subtitle="Choose a strong password for your account">
      <AuthError message={error} />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <FormInput
            label="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a strong password"
            autoComplete="new-password"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            }
          />
          <PasswordStrength password={password} />
        </div>
        <FormInput
          label="Confirm new password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repeat your password"
          autoComplete="new-password"
          error={confirm && password !== confirm ? "Passwords don't match" : undefined}
        />
        <AuthButton loading={loading} type="submit">
          Update Password
        </AuthButton>
      </form>
    </AuthCard>
  );
}
