"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { VoaLogoMark } from "@/components/logo/VoaLogoMark";
import { IconChevronRight, IconMenu } from "@/components/icons";

const NAV = [
  { label: "Curriculum",  href: "/#curriculum" },
  { label: "Features",    href: "/#features" },
  { label: "HBC Projects",href: "/#hbc" },
  { label: "For Schools", href: "/#cta" },
  { label: "About",       href: "/about" },
  { label: "Contact",     href: "/contact" },
];

interface NavbarProps {
  theme?: "light" | "dark";
}

export default function Navbar({ theme = "light" }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const dark = theme === "dark";

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-shadow duration-200 ${dark ? "bg-edu-bottle" : "bg-edu-paper"} ${
        scrolled ? (dark ? "border-b border-edu-slate-700" : "border-b border-edu-slate-200") : "border-b border-transparent"
      }`}
    >
      <nav className="container-edu h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <VoaLogoMark size={32} />
          <div className="flex flex-col leading-none">
            <span className={`font-display font-bold text-[15px] tracking-tight ${dark ? "text-edu-paper" : "text-edu-ink"}`}>EduOnLink</span>
            <span className={`text-[9px] uppercase tracking-[0.15em] ${dark ? "text-edu-slate-400" : "text-edu-slate-500"}`}>Vavhimi</span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors duration-150 ${
                dark
                  ? "text-edu-slate-300 hover:text-edu-paper hover:bg-edu-slate-700"
                  : "text-edu-slate-600 hover:text-edu-ink hover:bg-edu-slate-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/auth/login" className={`${dark ? "btn-ghost-dark" : "btn-ghost"} text-sm px-5 py-2.5`}>Sign in</Link>
          <button onClick={() => router.push("/auth/register")} className="btn-primary text-sm px-5 py-2.5">
            Get started
            <IconChevronRight size={14} />
          </button>
        </div>

        <button
          className={`md:hidden w-9 h-9 flex items-center justify-center rounded border ${
            dark ? "border-edu-slate-600 text-edu-paper" : "border-edu-slate-300 text-edu-ink"
          }`}
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          <IconMenu size={18} />
        </button>
      </nav>

      {open && (
        <div className={`md:hidden ${dark ? "bg-edu-bottle border-b border-edu-slate-700" : "bg-edu-paper border-b border-edu-slate-200"}`}>
          <div className="container-edu py-6 flex flex-col gap-2">
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`px-4 py-3 text-sm font-medium ${dark ? "text-edu-slate-300" : "text-edu-slate-600"}`}
              >
                {item.label}
              </Link>
            ))}
            <div className={`pt-4 flex flex-col gap-2 ${dark ? "border-t border-edu-slate-700" : "border-t border-edu-slate-200"}`}>
              <Link href="/auth/login" className={`${dark ? "btn-ghost-dark" : "btn-ghost"} w-full text-center`} onClick={() => setOpen(false)}>Sign in</Link>
              <button className="btn-primary w-full" onClick={() => { setOpen(false); router.push("/auth/register"); }}>Get started free</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
