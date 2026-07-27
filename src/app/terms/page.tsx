import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — EduOnLink",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen py-16 px-6" style={{ background: "#1F4738" }}>
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-sm mb-10 inline-block transition-colors" style={{ color: "#D9A15C" }}>
          ← Back to EduOnLink
        </Link>

        <h1 className="font-display font-bold text-3xl mb-2" style={{ color: "#F2EEE3" }}>Terms of Service</h1>
        <p className="text-sm mb-1" style={{ color: "#AEB5A6" }}>Last updated: July 2026</p>
        <p className="text-xs mb-10" style={{ color: "#8D9689" }}>
          EduOnLink is operated by <strong style={{ color: "#AEB5A6" }}>Vavhimi Threads (Pvt) Ltd</strong>, a registered company in Zimbabwe.
        </p>

        <div className="flex flex-col gap-8" style={{ color: "#C7CDC0" }}>
          <section>
            <h2 className="font-display font-semibold text-lg mb-3" style={{ color: "#F2EEE3" }}>1. Acceptance of Terms</h2>
            <p className="text-sm leading-relaxed">
              By accessing or using EduOnLink, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg mb-3" style={{ color: "#F2EEE3" }}>2. Use of the Platform</h2>
            <p className="text-sm leading-relaxed">
              EduOnLink is an educational platform designed for students, teachers, parents, and school administrators in Zimbabwe. You agree to use the platform only for lawful educational purposes and in accordance with these terms.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg mb-3" style={{ color: "#F2EEE3" }}>3. Accounts</h2>
            <p className="text-sm leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. You must provide accurate information when registering.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg mb-3" style={{ color: "#F2EEE3" }}>4. Content</h2>
            <p className="text-sm leading-relaxed">
              EduOnLink provides AI-generated educational content aligned with the ZIMSEC curriculum. Content is provided for educational purposes only and does not constitute official ZIMSEC materials.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg mb-3" style={{ color: "#F2EEE3" }}>5. Privacy</h2>
            <p className="text-sm leading-relaxed">
              Your use of EduOnLink is also governed by our{" "}
              <Link href="/privacy" style={{ color: "#D9A15C" }}>Privacy Policy</Link>
              , which is incorporated into these Terms by reference.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg mb-3" style={{ color: "#F2EEE3" }}>6. Paid Lessons, Courses & Platform Commission</h2>
            <p className="text-sm leading-relaxed mb-3">
              Teachers and schools may offer paid lessons and courses through EduOnLink. On every paid sale, EduOnLink retains a platform commission of <strong style={{ color: "#F2EEE3" }}>20% of the sale amount</strong>, and the teacher or school keeps the remaining 80%.
            </p>
            <p className="text-sm leading-relaxed mb-3">
              This 20% commission is a flat rate applied to your total income from paid sales on the platform — it is not a separate or additional charge per lesson, and it does not increase or stack based on how many lessons or classes you sell. Whether you sell one lesson or one hundred, the same 20% rate applies to each sale and therefore to your total earnings. The commission rate applies uniformly to all teachers and schools unless a different rate is agreed with you in writing.
            </p>
            <p className="text-sm leading-relaxed">
              Earnings are recorded per sale in your dashboard, showing the amount paid by the student, the platform commission deducted, and your net earning. Withdrawals of your accumulated net earnings are subject to our standard payout process.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg mb-3" style={{ color: "#F2EEE3" }}>7. Changes to Terms</h2>
            <p className="text-sm leading-relaxed">
              We reserve the right to update these Terms at any time. Continued use of the platform after changes constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg mb-3" style={{ color: "#F2EEE3" }}>8. Contact</h2>
            <p className="text-sm leading-relaxed">
              For questions about these Terms, contact us at{" "}
              <a href="mailto:bepetetanatswa@gmail.com" style={{ color: "#D9A15C" }}>bepetetanatswa@gmail.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
