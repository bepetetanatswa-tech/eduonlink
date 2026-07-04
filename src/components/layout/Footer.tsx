"use client";

import Link from "next/link";
import { VoaLogoMark } from "@/components/logo/VoaLogoMark";

const COL: Record<string, { label: string; href: string }[]> = {
  Platform: [
    { label: "ZIMSEC Curriculum",  href: "/#curriculum" },
    { label: "Sir Taks AI",        href: "/#features" },
    { label: "HBC Projects",       href: "/#hbc" },
    { label: "For Schools",        href: "/#cta" },
  ],
  Students: [
    { label: "O-Level Courses",    href: "/auth/register" },
    { label: "A-Level Courses",    href: "/auth/register" },
    { label: "Primary School",     href: "/auth/register" },
    { label: "ZIMSEC Prep",        href: "/auth/register" },
  ],
  Schools: [
    { label: "Partner Schools",    href: "mailto:vavhimiacademy@gmail.com" },
    { label: "Teacher Portal",     href: "/auth/register" },
    { label: "Parent Portal",      href: "/auth/register" },
    { label: "Book a Demo",        href: "mailto:vavhimiacademy@gmail.com" },
  ],
  Company: [
    { label: "About EduOnLink",          href: "/about" },
    { label: "Our Mission",        href: "/about#mission" },
    { label: "Contact",            href: "/contact" },
    { label: "Privacy Policy",     href: "/privacy" },
    { label: "Terms of Service",   href: "/terms" },
  ],
};

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      {/* Top gradient rule */}
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(77,127,255,0.3), rgba(0,229,163,0.2), transparent)" }} />

      <div className="container-voa py-16">
        {/* Brand + links */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <VoaLogoMark size={36} />
              <span className="font-display font-bold text-white">EduOnLink</span>
            </Link>
            <p className="text-xs leading-relaxed mb-5" style={{ color: "#4A5170" }}>
              The intelligence behind Zimbabwe&apos;s education. AI-powered. ZIMSEC-aligned. Built for every student.
            </p>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono" style={{ color: "#4A5170" }}>All systems operational</span>
            </div>
            {/* Contact details */}
            <div className="flex flex-col gap-2">
              {["0713 150 852", "0785 910 379", "0789 770 941"].map((num) => (
                <a
                  key={num}
                  href={`tel:+263${num.replace(/\s/g, "").slice(1)}`}
                  className="flex items-center gap-2 text-xs transition-colors duration-150"
                  style={{ color: "#4A5170" }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#8892B0")}
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#4A5170")}
                >
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {num}
                </a>
              ))}
              <a
                href="mailto:vavhimiacademy@gmail.com"
                className="flex items-center gap-2 text-xs transition-colors duration-150"
                style={{ color: "#4A5170" }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#8892B0")}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#4A5170")}
              >
                <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                vavhimiacademy@gmail.com
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(COL).map(([cat, links]) => (
            <div key={cat}>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] mb-4" style={{ color: "#4A5170" }}>
                {cat}
              </p>
              <ul className="space-y-2.5">
                {links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm transition-colors duration-150"
                      style={{ color: "#4A5170" }}
                      onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#8892B0")}
                      onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#4A5170")}
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div
          className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          <p className="text-xs" style={{ color: "#4A5170" }}>
            © 2026 Vavhimi Threads (Pvt) Ltd. All rights reserved.
            <span className="mx-2 opacity-40">·</span>
            EduOnLink is a product of Vavhimi Threads · Built in Zimbabwe, for Zimbabwe.
          </p>
          <div className="flex items-center gap-4">
            <span className="badge badge-cobalt text-[11px]">🇿🇼 ZIMSEC Aligned</span>
            <span className="badge badge-mint text-[11px]">✦ Gemini AI</span>
            <span className="font-mono text-[10px]" style={{ color: "#2A2D3E" }}>v2.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
