"use client";

import Link from "next/link";
import { VoaLogoMark } from "@/components/logo/VoaLogoMark";
import { IconPhone, IconMail } from "@/components/icons";

const COL: Record<string, { label: string; href: string }[]> = {
  Platform: [
    { label: "ZIMSEC curriculum",  href: "/#curriculum" },
    { label: "Sir Taks AI",        href: "/#features" },
    { label: "HBC projects",       href: "/#hbc" },
    { label: "For schools",        href: "/#cta" },
  ],
  Students: [
    { label: "O-Level courses",    href: "/auth/register" },
    { label: "A-Level courses",    href: "/auth/register" },
    { label: "Primary school",     href: "/auth/register" },
    { label: "ZIMSEC prep",        href: "/auth/register" },
  ],
  Schools: [
    { label: "Partner schools",    href: "mailto:bepetetanatswa@gmail.com" },
    { label: "Teacher portal",     href: "/auth/register" },
    { label: "Parent portal",      href: "/auth/register" },
    { label: "Book a demo",        href: "mailto:bepetetanatswa@gmail.com" },
  ],
  Company: [
    { label: "About EduOnLink",    href: "/about" },
    { label: "Our mission",        href: "/about#mission" },
    { label: "Contact",            href: "/contact" },
    { label: "Privacy policy",     href: "/privacy" },
    { label: "Terms of service",   href: "/terms" },
  ],
};

interface FooterProps {
  theme?: "light" | "dark";
}

export default function Footer({ theme = "light" }: FooterProps) {
  const dark = theme === "dark";
  const muted = dark ? "text-edu-slate-400" : "text-edu-slate-500";
  const body = dark ? "text-edu-slate-300" : "text-edu-slate-600";
  const heading = dark ? "text-edu-paper" : "text-edu-ink";
  const hoverHeading = dark ? "hover:text-edu-paper" : "hover:text-edu-ink";
  const border = dark ? "border-edu-slate-700" : "border-edu-slate-200";

  return (
    <footer className={`border-t ${border}`}>
      <div className="container-edu py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-12 mb-16">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <VoaLogoMark size={36} />
              <span className={`font-display font-bold ${heading}`}>EduOnLink</span>
            </Link>
            <p className={`text-xs leading-relaxed mb-5 ${muted}`}>
              ZIMSEC-aligned learning for every Zimbabwean student, built by Vavhimi Threads.
            </p>
            <div className="flex flex-col gap-2">
              {["0713 150 852", "0785 910 379", "0789 770 941"].map((num) => (
                <a
                  key={num}
                  href={`tel:+263${num.replace(/\s/g, "").slice(1)}`}
                  className={`flex items-center gap-2 text-xs ${muted} ${hoverHeading} transition-colors duration-150`}
                >
                  <IconPhone size={13} className="flex-shrink-0" />
                  {num}
                </a>
              ))}
              <a
                href="mailto:bepetetanatswa@gmail.com"
                className={`flex items-center gap-2 text-xs ${muted} ${hoverHeading} transition-colors duration-150`}
              >
                <IconMail size={13} className="flex-shrink-0" />
                bepetetanatswa@gmail.com
              </a>
            </div>
          </div>

          {Object.entries(COL).map(([cat, links]) => (
            <div key={cat}>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.08em] mb-4 ${muted}`}>
                {cat}
              </p>
              <ul className="space-y-2.5">
                {links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className={`text-sm ${body} ${hoverHeading} transition-colors duration-150`}>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={`flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t ${border}`}>
          <p className={`text-xs ${muted}`}>
            © 2026 Vavhimi Threads (Pvt) Ltd. All rights reserved.
            <span className="mx-2 opacity-40">·</span>
            EduOnLink is a product of Vavhimi Threads · built in Zimbabwe, for Zimbabwe.
          </p>
          <p className={`text-xs ${muted}`}>ZIMSEC aligned · AI marking powered by Gemini</p>
        </div>
      </div>
    </footer>
  );
}
