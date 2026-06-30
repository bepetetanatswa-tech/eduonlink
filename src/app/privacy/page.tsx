import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — VOA",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-16 px-6" style={{ background: "#07080C" }}>
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm mb-10 inline-block transition-colors" style={{ color: "#4D7FFF" }}>
          ← Back to VOA
        </Link>

        <h1 className="font-display font-bold text-white text-3xl mb-2">Privacy Policy</h1>
        <p className="text-sm mb-1" style={{ color: "#4A5170" }}>Last updated: June 2026</p>
        <p className="text-xs mb-10" style={{ color: "#2A2D3E" }}>
          Vavhimi Online Academy (VOA) is a product of <strong style={{ color: "#4A5170" }}>Vavhimi Threads (Pvt) Ltd</strong>, a registered company in Zimbabwe.
        </p>

        <div className="flex flex-col gap-8" style={{ color: "#8892B0" }}>
          <section>
            <h2 className="font-display font-semibold text-white text-lg mb-3">1. Information We Collect</h2>
            <p className="text-sm leading-relaxed">
              We collect information you provide directly, including your name, email address, role (student, teacher, parent, or school admin), grade level, school name, and other profile information needed to personalise your learning experience.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-white text-lg mb-3">2. How We Use Your Information</h2>
            <p className="text-sm leading-relaxed">
              We use your information to provide and improve the VOA platform, personalise your learning experience, send you account and service notifications, and comply with legal obligations.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-white text-lg mb-3">3. Data Storage</h2>
            <p className="text-sm leading-relaxed">
              Your data is stored securely using Supabase, a GDPR-compliant database platform. We implement industry-standard security measures to protect your personal information.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-white text-lg mb-3">4. Children&apos;s Privacy</h2>
            <p className="text-sm leading-relaxed">
              VOA serves students of all ages. For users under 13, we require parental consent. Parents and guardians can request deletion of their child&apos;s data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-white text-lg mb-3">5. Sharing of Information</h2>
            <p className="text-sm leading-relaxed">
              We do not sell your personal information. We may share information with your school administrator if you are a student at a VOA-enrolled institution, or with third-party service providers who assist in operating the platform.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-white text-lg mb-3">6. Your Rights</h2>
            <p className="text-sm leading-relaxed">
              You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at{" "}
              <a href="mailto:support@voa.co.zw" style={{ color: "#4D7FFF" }}>support@voa.co.zw</a>.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-white text-lg mb-3">7. Changes to This Policy</h2>
            <p className="text-sm leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a notice on the platform.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
