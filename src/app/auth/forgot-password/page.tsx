"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import AuthCard, { AuthButton, AuthError } from "@/components/auth/AuthCard";
import { FormInput } from "@/components/auth/FormInput";
import { createClient } from "@/lib/supabase/client";
import { forgotPasswordSchema } from "@/types/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery&next=/auth/reset-password`,
    });
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <AuthCard
        title="Check your inbox"
        subtitle={`We sent a password reset link to ${email}`}
        backHref="/auth/login"
        backLabel="Back to sign in"
      >
        <div className="flex flex-col items-center text-center gap-6 py-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(0,229,163,0.12)", border: "1px solid rgba(0,229,163,0.25)" }}
          >
            <svg className="w-8 h-8" fill="none" stroke="#00E5A3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </motion.div>

          <div>
            <p className="text-sm leading-relaxed" style={{ color: "#6B7290" }}>
              Click the link in the email to set a new password. Check your spam folder if you don&apos;t see it within a few minutes.
            </p>
          </div>

          <div
            className="w-full p-4 rounded-xl text-sm"
            style={{ background: "rgba(77,127,255,0.06)", border: "1px solid rgba(77,127,255,0.12)", color: "#6B7290" }}
          >
            Didn&apos;t get the email?{" "}
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              className="font-semibold transition-colors"
              style={{ color: "#4D7FFF" }}
            >
              Try again
            </button>
          </div>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot password?"
      subtitle="No worries — we'll send you a reset link"
      backHref="/auth/login"
      backLabel="Back to sign in"
    >
      <AuthError message={error} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <FormInput
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />
        <AuthButton loading={loading} type="submit">
          Send Reset Link
        </AuthButton>
      </form>
    </AuthCard>
  );
}
