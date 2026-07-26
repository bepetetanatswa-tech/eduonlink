"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthCard, { AuthButton, AuthError } from "@/components/auth/AuthCard";
import { FormInput, PasswordStrength } from "@/components/auth/FormInput";
import { createClient } from "@/lib/supabase/client";
import { resetPasswordSchema } from "@/types/auth";
import { IconLock, IconCheck } from "@/components/icons";

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
          <div className="w-14 h-14 rounded flex items-center justify-center bg-edu-bottle-100 border border-edu-bottle-200">
            <IconCheck size={22} className="text-edu-bottle" strokeWidth={2} />
          </div>
          <p className="text-sm text-center text-edu-slate-600">
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
            icon={<IconLock />}
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
          Update password
        </AuthButton>
      </form>
    </AuthCard>
  );
}
