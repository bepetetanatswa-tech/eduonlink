"use client";

import Link from "next/link";

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
    { label: "Partner Schools",    href: "mailto:schools@voa.co.zw" },
    { label: "Teacher Portal",     href: "/auth/register" },
    { label: "Parent Portal",      href: "/auth/register" },
    { label: "Book a Demo",        href: "mailto:demo@voa.co.zw" },
  ],
  Company: [
    { label: "About VOA",          href: "/about" },
    { label: "Our Mission",        href: "/about#mission" },
    { label: "Contact",            href: "mailto:hello@voa.co.zw" },
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
            <Link href="/" className="flex items-center gap-2.5 mb-4 group">
              <div className="relative w-9 h-9">
                <div className="absolute inset-0 rounded-xl opacity-50" style={{ background: "linear-gradient(135deg, #4D7FFF, #00E5A3)" }} />
                <div className="absolute inset-[1px] rounded-[11px] flex items-center justify-center" style={{ background: "#07080C" }}>
                  <span className="font-display font-bold text-sm" style={{ background: "linear-gradient(135deg, #4D7FFF, #00E5A3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>V</span>
                </div>
              </div>
              <span className="font-display font-bold text-white">VOA</span>
            </Link>
            <p className="text-xs leading-relaxed mb-5" style={{ color: "#4A5170" }}>
              The intelligence behind Zimbabwe&apos;s education. AI-powered. ZIMSEC-aligned. Built for every student.
            </p>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono" style={{ color: "#4A5170" }}>All systems operational</span>
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
            VOA is a product of Vavhimi Threads · Built in Zimbabwe, for Zimbabwe.
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
