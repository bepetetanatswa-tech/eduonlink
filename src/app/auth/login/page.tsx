"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import AuthCard, { AuthButton, AuthError, AuthSuccess } from "@/components/auth/AuthCard";
import { FormInput } from "@/components/auth/FormInput";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, magicLinkSchema } from "@/types/auth";

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
      subtitle="Sign in to continue your ZIMSEC journey"
    >
      {/* Mode toggle */}
      <div
        className="flex p-1 rounded-xl mb-6"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {(["password", "magic"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(null); setSuccess(null); }}
            className="flex-1 py-2 rounded-lg text-sm font-semibold font-display transition-all duration-200"
            style={{
              color: mode === m ? "#fff" : "#4A5170",
              background: mode === m ? "rgba(77,127,255,0.15)" : "transparent",
              border: mode === m ? "1px solid rgba(77,127,255,0.25)" : "1px solid transparent",
            }}
          >
            {m === "password" ? "Password" : "✨ Magic Link"}
          </button>
        ))}
      </div>

      <AuthError message={error} />
      <AuthSuccess message={success} />

      <AnimatePresence mode="wait">
        {mode === "password" ? (
          <motion.form
            key="password"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            onSubmit={handlePasswordLogin}
            className="flex flex-col gap-4"
          >
            <FormInput
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              }
            />
            <div>
              <FormInput
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
              />
              <div className="flex justify-end mt-2">
                <Link href="/auth/forgot-password" className="text-xs transition-colors" style={{ color: "#4D7FFF" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#90ABFF")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#4D7FFF")}
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <AuthButton loading={loading} type="submit">
              Sign In
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </AuthButton>
          </motion.form>
        ) : (
          <motion.form
            key="magic"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleMagicLink}
            className="flex flex-col gap-4"
          >
            <p className="text-sm leading-relaxed" style={{ color: "#6B7290" }}>
              We&apos;ll email you a secure link — no password needed. Click it to sign straight in.
            </p>
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
            <AuthButton loading={loading} variant="mint" type="submit">
              Send Magic Link ✨
            </AuthButton>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Footer */}
      <p className="text-sm text-center mt-5" style={{ color: "#4A5170" }}>
        New to Educonnect?{" "}
        <Link href="/auth/register" className="font-semibold transition-colors" style={{ color: "#4D7FFF" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#90ABFF")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#4D7FFF")}
        >
          Create your account →
        </Link>
      </p>
    </AuthCard>
  );
}
