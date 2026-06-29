"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const navLinks = [
  { label: "Curriculum", href: "#curriculum" },
  { label: "Features", href: "#features" },
  { label: "For Schools", href: "#schools" },
  { label: "Pricing", href: "#pricing" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "glass border-b border-white/10 shadow-card"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-9 h-9">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-voa-blue to-voa-gold opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="absolute inset-0 rounded-lg border border-voa-blue/40 group-hover:border-voa-blue/80 transition-colors" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-voa-blue font-display font-bold text-base leading-none">V</span>
            </div>
          </div>
          <span className="font-display font-bold text-white text-lg tracking-tight">
            VOA
            <span className="text-voa-blue">.</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-white/60 hover:text-white text-sm font-medium transition-colors duration-200 hover:text-voa-blue"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <button className="text-white/70 hover:text-white text-sm font-medium px-4 py-2 transition-colors">
            Sign In
          </button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="relative px-5 py-2 text-sm font-semibold text-voa-navy rounded-lg overflow-hidden group"
            style={{ background: "linear-gradient(135deg, #00D4FF, #0099CC)" }}
          >
            <span className="relative z-10">Get Started Free</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
          </motion.button>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden flex flex-col gap-1.5 p-2"
          aria-label="Toggle menu"
        >
          <motion.span
            animate={menuOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
            className="block w-5 h-0.5 bg-white origin-center transition-colors"
          />
          <motion.span
            animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
            className="block w-5 h-0.5 bg-white"
          />
          <motion.span
            animate={menuOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
            className="block w-5 h-0.5 bg-white origin-center"
          />
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden glass border-t border-white/10"
          >
            <div className="px-4 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-white/70 hover:text-voa-blue text-base font-medium transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
                <button className="text-white/70 text-sm font-medium py-2 text-left">Sign In</button>
                <button
                  className="py-3 text-sm font-semibold text-voa-navy rounded-lg"
                  style={{ background: "linear-gradient(135deg, #00D4FF, #0099CC)" }}
                >
                  Get Started Free
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
