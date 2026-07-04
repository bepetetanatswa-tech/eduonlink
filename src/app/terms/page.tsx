import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — EduOnLink",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen py-16 px-6" style={{ background: "#07080C" }}>
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm mb-10 inline-block transition-colors" style={{ color: "#4D7FFF" }}>
          ← Back to EduOnLink
        </Link>

        <h1 className="font-display font-bold text-white text-3xl mb-2">Terms of Service</h1>
        <p className="text-sm mb-1" style={{ color: "#4A5170" }}>Last updated: June 2026</p>
        <p className="text-xs mb-10" style={{ color: "#2A2D3E" }}>
          EduOnLink is operated by <strong style={{ color: "#4A5170" }}>Vavhimi Threads (Pvt) Ltd</strong>, a registered company in Zimbabwe.
        </p>

        <div className="flex flex-col gap-8" style={{ color: "#8892B0" }}>
          <section>
            <h2 className="font-display font-semibold text-white text-lg mb-3">1. Acceptance of Terms</h2>
            <p className="text-sm leading-relaxed">
              By accessing or using EduOnLink, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-white text-lg mb-3">2. Use of the Platform</h2>
            <p className="text-sm leading-relaxed">
              EduOnLink is an educational platform designed for students, teachers, parents, and school administrators in Zimbabwe. You agree to use the platform only for lawful educational purposes and in accordance with these terms.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-white text-lg mb-3">3. Accounts</h2>
            <p className="text-sm leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. You must provide accurate information when registering.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-white text-lg mb-3">4. Content</h2>
            <p className="text-sm leading-relaxed">
              EduOnLink provides AI-generated educational content aligned with the ZIMSEC curriculum. Content is provided for educational purposes only and does not constitute official ZIMSEC materials.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-white text-lg mb-3">5. Privacy</h2>
            <p className="text-sm leading-relaxed">
              Your use of EduOnLink is also governed by our{" "}
              <Link href="/privacy" style={{ color: "#4D7FFF" }}>Privacy Policy</Link>
              , which is incorporated into these Terms by reference.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-white text-lg mb-3">6. Changes to Terms</h2>
            <p className="text-sm leading-relaxed">
              We reserve the right to update these Terms at any time. Continued use of the platform after changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-white text-lg mb-3">7. Contact</h2>
            <p className="text-sm leading-relaxed">
              For questions about these Terms, contact us at{" "}
              <a href="mailto:vavhimiacademy@gmail.com" style={{ color: "#4D7FFF" }}>vavhimiacademy@gmail.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
