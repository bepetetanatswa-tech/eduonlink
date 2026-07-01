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

  const [mode, setMode] = useState<Mode>("password");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const supabase = createClient();

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setGoogleLoading(false);
    }
    // On success the browser redirects — no need to stop loading
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

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

      {/* Google OAuth divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
        <span className="text-xs font-mono" style={{ color: "#2A2D3E" }}>OR</span>
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
      </div>

      {/* Google Sign-In */}
      <button
        onClick={handleGoogleLogin}
        disabled={googleLoading || loading}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#CDD6F4",
          opacity: googleLoading || loading ? 0.6 : 1,
          cursor: googleLoading || loading ? "not-allowed" : "pointer",
        }}
        onMouseEnter={(e) => {
          if (!googleLoading && !loading)
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
        }}
      >
        {googleLoading ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
        {googleLoading ? "Redirecting to Google…" : "Continue with Google"}
      </button>

      {/* Footer */}
      <p className="text-sm text-center mt-5" style={{ color: "#4A5170" }}>
        New to VOA?{" "}
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
