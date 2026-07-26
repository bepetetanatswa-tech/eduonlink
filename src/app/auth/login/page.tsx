"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthCard, { AuthButton, AuthError, AuthSuccess } from "@/components/auth/AuthCard";
import { FormInput } from "@/components/auth/FormInput";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, magicLinkSchema } from "@/types/auth";
import { IconMail, IconLock, IconChevronRight } from "@/components/icons";

type Mode = "password" | "magic";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
  const reason = searchParams.get("reason");

  const [mode, setMode] = useState<Mode>("password");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    reason === "inactivity" ? "You were signed out after a period of inactivity. Please sign in again." : null
  );
  const [success, setSuccess] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const supabase = createClient();

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);

    const lockoutRes = await fetch("/api/auth/check-lockout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).then((r) => r.json()).catch(() => ({ locked: false }));

    if (lockoutRes.locked) {
      const minutes = Math.ceil(lockoutRes.retryAfterSeconds / 60);
      setError(`Too many failed attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`);
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    fetch("/api/auth/record-attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, success: !authError }),
    }).catch(() => {});

    if (authError) {
      setError(
        authError.message === "Invalid login credentials"
          ? "Incorrect email or password. Check your details and try again."
          : authError.message
      );
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = magicLinkSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}` },
    });

    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    setSuccess(`Magic link sent to ${email}. Check your inbox and click the link to sign in.`);
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to continue your ZIMSEC studies"
    >
      <div className="flex p-1 rounded border border-edu-slate-200 mb-6">
        {(["password", "magic"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(null); setSuccess(null); }}
            className={`flex-1 py-2 rounded-sm text-sm font-semibold font-display transition-colors duration-150 ${
              mode === m ? "bg-edu-copper-100 text-edu-copper-dark" : "text-edu-slate-500"
            }`}
          >
            {m === "password" ? "Password" : "Magic link"}
          </button>
        ))}
      </div>

      <AuthError message={error} />
      <AuthSuccess message={success} />

      {mode === "password" ? (
        <form onSubmit={handlePasswordLogin} className="flex flex-col gap-4">
          <FormInput
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            icon={<IconMail />}
          />
          <div>
            <FormInput
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              icon={<IconLock />}
            />
            <div className="flex justify-end mt-2">
              <Link href="/auth/forgot-password" className="text-xs text-edu-copper hover:text-edu-copper-dark transition-colors">
                Forgot password?
              </Link>
            </div>
          </div>

          <AuthButton loading={loading} type="submit">
            Sign in
            <IconChevronRight size={16} />
          </AuthButton>
        </form>
      ) : (
        <form onSubmit={handleMagicLink} className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-edu-slate-600">
            We&apos;ll email you a link — no password needed. Click it to sign straight in.
          </p>
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
            Send magic link
          </AuthButton>
        </form>
      )}

      <p className="text-sm text-center mt-5 text-edu-slate-500">
        New to EduOnLink?{" "}
        <Link href="/auth/register" className="font-semibold text-edu-copper hover:text-edu-copper-dark transition-colors">
          Create your account
        </Link>
      </p>
    </AuthCard>
  );
}
