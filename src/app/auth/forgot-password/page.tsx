"use client";

import { useState } from "react";
import AuthCard, { AuthButton, AuthError } from "@/components/auth/AuthCard";
import { FormInput } from "@/components/auth/FormInput";
import { createClient } from "@/lib/supabase/client";
import { forgotPasswordSchema } from "@/types/auth";
import { IconMail } from "@/components/icons";

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
          <div className="w-14 h-14 rounded flex items-center justify-center bg-edu-bottle-100 border border-edu-bottle-200">
            <IconMail size={24} className="text-edu-bottle" />
          </div>

          <p className="text-sm leading-relaxed text-edu-slate-600">
            Click the link in the email to set a new password. Check your spam folder if you don&apos;t see it within a few minutes.
          </p>

          <div className="w-full p-4 rounded text-sm bg-edu-copper-50 border border-edu-copper-200 text-edu-slate-600">
            Didn&apos;t get the email?{" "}
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              className="font-semibold text-edu-copper"
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
      subtitle="Tell us your email and we'll send you a reset link"
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
          icon={<IconMail />}
        />
        <AuthButton loading={loading} type="submit">
          Send reset link
        </AuthButton>
      </form>
    </AuthCard>
  );
}
