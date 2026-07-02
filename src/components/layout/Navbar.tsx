"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { VoaLogoMark } from "@/components/logo/VoaLogoMark";

const NAV = [
  { label: "Curriculum",  href: "/#curriculum" },
  { label: "Features",    href: "/#features" },
  { label: "HBC Projects",href: "/#hbc" },
  { label: "For Schools", href: "/#cta" },
  { label: "About",       href: "/about" },
  { label: "Contact",     href: "/contact" },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Close mobile drawer on navigation
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 inset-x-0 z-50"
      style={{ willChange: "transform" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-all duration-500"
        style={{
          background: scrolled ? "rgba(7,8,12,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
        }}
      />

      <nav className="relative container-voa h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <VoaLogoMark size={32} />
          <div className="flex flex-col leading-none">
            <span className="font-display font-bold text-white text-[15px] tracking-tight">VOA</span>
            <span className="text-[9px] font-mono uppercase tracking-[0.15em]" style={{ color: "#4A5170" }}>Vavhimi</span>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200"
              style={{ color: "#8892B0" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#fff";
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "#8892B0";
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/auth/login" className="btn-ghost text-sm px-5 py-2.5">Sign in</Link>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/auth/register")}
            className="btn-primary text-sm px-5 py-2.5"
          >
            Get Started
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg"
          style={{ background: "rgba(255,255,255,0.05)" }}
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          <motion.span animate={open ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }} className="block w-4 h-0.5 bg-white origin-center" />
          <motion.span animate={open ? { opacity: 0 } : { opacity: 1 }} className="block w-4 h-0.5 bg-white" />
          <motion.span animate={open ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }} className="block w-4 h-0.5 bg-white origin-center" />
        </button>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden"
            style={{ background: "rgba(7,8,12,0.96)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="container-voa py-6 flex flex-col gap-2">
              {NAV.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="px-4 py-3 text-sm font-medium rounded-lg transition-colors"
                  style={{ color: "#8892B0" }}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-4 border-t flex flex-col gap-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <Link href="/auth/login" className="btn-ghost w-full text-center" onClick={() => setOpen(false)}>Sign in</Link>
                <button className="btn-primary w-full" onClick={() => { setOpen(false); router.push("/auth/register"); }}>Get Started Free</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
