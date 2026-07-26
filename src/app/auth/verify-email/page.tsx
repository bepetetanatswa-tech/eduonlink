"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AuthCard from "@/components/auth/AuthCard";
import Link from "next/link";
import { IconMail } from "@/components/icons";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "your email";

  return (
    <AuthCard title="Verify your email" subtitle="One last step before you start learning">
      <div className="flex flex-col items-center text-center gap-6">
        <div className="w-16 h-16 rounded flex items-center justify-center bg-edu-copper-50 border border-edu-copper-200">
          <IconMail size={28} className="text-edu-copper" strokeWidth={1.4} />
        </div>

        <div>
          <p className="text-sm leading-relaxed mb-2 text-edu-slate-600">
            We sent a verification link to
          </p>
          <p className="font-semibold text-edu-ink text-sm">{email}</p>
        </div>

        <p className="text-sm leading-relaxed text-edu-slate-500">
          Open the email and click the link to verify your account and start learning. The link expires in 24 hours.
        </p>

        <p className="text-xs text-edu-slate-500">
          Can&apos;t find the email? Check your spam folder, or{" "}
          <Link href="/auth/login" className="text-edu-copper">
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
