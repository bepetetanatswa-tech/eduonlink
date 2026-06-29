"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import AuthCard from "@/components/auth/AuthCard";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "your email";

  return (
    <AuthCard title="Verify your email" subtitle="One last step before you start learning">
      <div className="flex flex-col items-center text-center gap-6">
        {/* Animated envelope */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{ background: "rgba(77,127,255,0.1)", border: "1px solid rgba(77,127,255,0.2)" }}
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg className="w-10 h-10" fill="none" stroke="#4D7FFF" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </motion.div>
        </motion.div>

        <div>
          <p className="text-sm leading-relaxed mb-2" style={{ color: "#6B7290" }}>
            We sent a verification link to
          </p>
          <p className="font-semibold text-white text-sm">{email}</p>
        </div>

        <p className="text-sm leading-relaxed" style={{ color: "#4A5170" }}>
          Click the link in your email to verify your account and complete registration. The link expires in 24 hours.
        </p>

        {/* Steps */}
        <div className="w-full flex flex-col gap-2">
          {[
            { n: "1", text: "Open the email from VOA" },
            { n: "2", text: "Click \"Verify my account\"" },
            { n: "3", text: "Start your learning journey 🎓" },
          ].map((s) => (
            <div
              key={s.n}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 font-mono"
                style={{ background: "rgba(77,127,255,0.15)", color: "#4D7FFF" }}
              >
                {s.n}
              </div>
              <p className="text-sm" style={{ color: "#8892B0" }}>{s.text}</p>
            </div>
          ))}
        </div>

        {/* Spam note */}
        <p className="text-xs" style={{ color: "#4A5170" }}>
          Can&apos;t find the email? Check your spam folder, or{" "}
          <Link
            href="/auth/login"
            className="transition-colors"
            style={{ color: "#4D7FFF" }}
          >
            try signing in with a magic link
          </Link>
          .
        </p>
      </div>
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
