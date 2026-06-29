"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const footerLinks = {
  Platform: [
    { label: "Curriculum", href: "#curriculum" },
    { label: "AI Tutor", href: "#features" },
    { label: "Live Classes", href: "#features" },
    { label: "HBC Projects", href: "#hbc" },
    { label: "Exam Prep", href: "#features" },
  ],
  "For Students": [
    { label: "Start Learning", href: "#" },
    { label: "O-Level Courses", href: "#curriculum" },
    { label: "A-Level Courses", href: "#curriculum" },
    { label: "Primary School", href: "#curriculum" },
    { label: "ZIMSEC Past Papers", href: "#" },
  ],
  "For Schools": [
    { label: "School Partners", href: "#" },
    { label: "Teacher Portal", href: "#" },
    { label: "Parent Dashboard", href: "#" },
    { label: "Admin Panel", href: "#" },
    { label: "Book a Demo", href: "#" },
  ],
  Company: [
    { label: "About VOA", href: "#" },
    { label: "Our Mission", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="relative border-t border-white/5">
      {/* Top gradient */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(0,212,255,0.3), rgba(255,215,0,0.3), transparent)",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Top row */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-4 group">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-voa-blue to-voa-gold opacity-20" />
                <div className="absolute inset-0 rounded-xl border border-voa-blue/40" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-voa-blue font-display font-bold text-lg">V</span>
                </div>
              </div>
              <div>
                <span className="font-display font-bold text-white text-lg">VOA</span>
                <p className="text-white/30 text-xs leading-none mt-0.5">Vavhimi Online Academy</p>
              </div>
            </Link>
            <p className="text-white/40 text-sm leading-relaxed mb-6">
              Zimbabwe&apos;s first modern educational platform, built for the ZIMSEC
              Heritage-Based Curriculum.
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white/30 text-xs">Platform Status: Operational</span>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-white/70 text-sm mb-4 uppercase tracking-wide">
                {category}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-white/40 hover:text-voa-blue text-sm transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-white/25 text-sm">
            © 2024 Vavhimi Online Academy. Built in Zimbabwe, for Zimbabwe.
          </p>
          <div className="flex items-center gap-6">
            <span className="glass-blue text-voa-blue text-xs font-medium px-3 py-1 rounded-full">
              🇿🇼 ZIMSEC Aligned
            </span>
            <span className="text-white/25 text-xs">v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
