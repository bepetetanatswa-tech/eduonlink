"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import dynamic from "next/dynamic";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false, loading: () => null });

const WORDS = ["LEARN.", "EXCEL.", "LEAD."];
const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "Geography", "History", "Shona", "Accounts", "Commerce", "English", "Economics"];

function KineticWord({ word, delay }: { word: string; delay: number }) {
  return (
    <div className="overflow-hidden leading-none">
      <motion.div
        initial={{ y: "110%", skewY: 4 }}
        animate={{ y: "0%", skewY: 0 }}
        transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
        className="font-display font-bold tracking-tighter"
        style={{ fontSize: "clamp(64px, 12vw, 140px)", lineHeight: 0.92 }}
      >
        {word}
      </motion.div>
    </div>
  );
}

function RotatingSubject() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % SUBJECTS.length);
        setVisible(true);
      }, 250);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      className="font-mono text-sm font-medium px-2 py-0.5 rounded"
      style={{
        color: "#00E5A3",
        background: "rgba(0,229,163,0.1)",
        border: "1px solid rgba(0,229,163,0.2)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.2s ease",
        display: "inline-block",
        minWidth: "110px",
        textAlign: "center",
      }}
    >
      {SUBJECTS[idx]}
    </span>
  );
}

export default function HeroSection() {
  const router = useRouter();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const [show3D, setShow3D] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowEnd =
      typeof navigator !== "undefined" &&
      navigator.hardwareConcurrency !== undefined &&
      navigator.hardwareConcurrency < 4;

    if (!reduced && !lowEnd) {
      setShow3D(true);
    }
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-20"
      style={{ background: "transparent", isolation: "isolate" }}
    >
      {/* 3D canvas — behind everything, pointer events disabled */}
      {show3D && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 1 }}
          aria-hidden="true"
        >
          <HeroScene />
        </div>
      )}

      {/* Geometric grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 2,
          backgroundImage: `
            linear-gradient(rgba(77,127,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(77,127,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
          maskImage: "radial-gradient(ellipse at 50% 40%, black 20%, transparent 75%)",
        }}
      />

      {/* Cobalt orb — top center */}
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute pointer-events-none"
        style={{
          zIndex: 2,
          top: "-10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(77,127,255,0.14) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      {/* Amber orb — bottom right */}
      <motion.div
        animate={{ scale: [1, 1.08, 1], opacity: [0.15, 0.28, 0.15] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        className="absolute bottom-0 right-[15%] pointer-events-none"
        style={{
          zIndex: 2,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245,166,35,0.12) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Text content — above canvas and orbs */}
      <motion.div style={{ y, opacity, position: "relative", zIndex: 10 }} className="container-voa">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-wrap items-center gap-3 mb-10"
        >
          <span className="badge badge-cobalt">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4D7FFF] animate-pulse" />
            Launching 2026 — ZIMSEC Aligned
          </span>
          <span className="badge badge-mint">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
            Sir Taks AI — Coming Soon
          </span>
        </motion.div>

        {/* Kinetic headline */}
        <div className="mb-6">
          {WORDS.map((w, i) => (
            <KineticWord key={w} word={w} delay={0.2 + i * 0.12} />
          ))}
        </div>

        {/* Subline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.65 }}
          className="flex flex-wrap items-center gap-3 mb-12"
          style={{ color: "#8892B0", fontSize: "clamp(15px, 2.2vw, 20px)" }}
        >
          <span>Master</span>
          <RotatingSubject />
          <span>with Zimbabwe&apos;s most advanced AI tutor — Sir Taks.</span>
        </motion.div>

        {/* CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.8 }}
          className="flex flex-wrap items-center gap-4 mb-20"
        >
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: "0 0 50px rgba(77,127,255,0.45)" }}
            whileTap={{ scale: 0.96 }}
            onClick={() => router.push("/auth/register")}
            className="btn-primary text-base px-7 py-3.5"
          >
            Start Learning Free
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            className="btn-ghost text-base px-7 py-3.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            See Demo
          </motion.button>
          <div className="hidden sm:flex items-center gap-2" style={{ color: "#4A5170" }}>
            <svg className="w-4 h-4 text-[#F5A623]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="text-sm">Free forever for students</span>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="flex flex-wrap gap-8 pt-8"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          {[
            { n: "28+",  l: "ZIMSEC Subjects" },
            { n: "10",   l: "Provinces Covered" },
            { n: "6",    l: "HBC Stages" },
            { n: "Free", l: "For Every Student" },
          ].map((s) => (
            <div key={s.l} className="flex flex-col">
              <span className="font-display font-bold text-2xl text-white">{s.n}</span>
              <span className="text-xs font-medium" style={{ color: "#4A5170" }}>{s.l}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll nudge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{ zIndex: 10 }}
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          style={{ width: 1, height: 40, background: "linear-gradient(to bottom, rgba(77,127,255,0.6), transparent)" }}
        />
      </motion.div>
    </section>
  );
}
