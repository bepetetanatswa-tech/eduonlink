"use client";

import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { useRef } from "react";
import dynamic from "next/dynamic";

const FloatingElements = dynamic(() => import("@/components/3d/FloatingElements"), { ssr: false });

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

export default function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
    >
      {/* Background gradients */}
      <div className="absolute inset-0 bg-voa-navy" />
      <div className="absolute inset-0 bg-hero-radial" />
      <div
        className="absolute inset-0 pattern-dots opacity-30"
        style={{ maskImage: "radial-gradient(ellipse at 50% 30%, black 20%, transparent 70%)" }}
      />

      {/* Glow orbs */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(0,212,255,0.18) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.15, 0.08] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Floating 3D elements */}
      <motion.div style={{ y, opacity }} className="absolute inset-0">
        <FloatingElements />
      </motion.div>

      {/* Geometric ring decorations */}
      <div className="absolute top-20 right-[10%] w-48 h-48 pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="w-full h-full rounded-full"
          style={{
            border: "1px solid rgba(0,212,255,0.15)",
            boxShadow: "0 0 40px rgba(0,212,255,0.05)",
          }}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-4 rounded-full"
          style={{ border: "1px dashed rgba(255,215,0,0.15)" }}
        />
      </div>

      <div className="absolute bottom-32 left-[8%] w-32 h-32 pointer-events-none">
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="w-full h-full rounded-full"
          style={{ border: "1px solid rgba(255,215,0,0.12)" }}
        />
      </div>

      {/* Main content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{ y: contentY }}
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
      >
        {/* Badge */}
        <motion.div variants={itemVariants} className="flex justify-center mb-8">
          <div className="glass-blue inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-voa-blue animate-pulse-glow" />
            <span className="text-voa-blue">Zimbabwe&apos;s First Modern Education Platform</span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={itemVariants}
          className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-none tracking-tight mb-6"
        >
          <span className="block text-white">Zimbabwe&apos;s</span>
          <span className="block mt-1">
            <span className="text-shimmer">Future Learns</span>
          </span>
          <span className="block text-white mt-1">Here.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          variants={itemVariants}
          className="text-white/60 text-lg sm:text-xl lg:text-2xl max-w-3xl mx-auto leading-relaxed mb-10"
        >
          The{" "}
          <span className="text-voa-blue font-medium">ZIMSEC Heritage-Based Curriculum</span>,
          reimagined for the digital age. AI tutoring, live classes, and exam prep — built
          specifically for Zimbabwean students from ECD to A-Level.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(0,212,255,0.5)" }}
            whileTap={{ scale: 0.97 }}
            className="relative px-8 py-4 text-base font-semibold text-voa-navy rounded-xl overflow-hidden group w-full sm:w-auto"
            style={{
              background: "linear-gradient(135deg, #00D4FF 0%, #0099CC 100%)",
              boxShadow: "0 0 20px rgba(0,212,255,0.3)",
            }}
          >
            <span className="relative z-10">Start Learning Free</span>
            <motion.div
              className="absolute inset-0 bg-white"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 0.1 }}
            />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="glass px-8 py-4 text-base font-semibold text-white rounded-xl group w-full sm:w-auto flex items-center justify-center gap-3 hover:border-white/20 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/15 transition-colors">
              <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span>Watch Demo</span>
          </motion.button>
        </motion.div>

        {/* Social proof */}
        <motion.div
          variants={itemVariants}
          className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-8"
        >
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {["#00D4FF", "#FFD700", "#00D4FF", "#FFD700"].map((color, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-voa-navy"
                  style={{ background: `radial-gradient(circle at 35% 35%, white, ${color})` }}
                />
              ))}
            </div>
            <div className="text-left">
              <p className="text-white font-semibold text-sm">10,000+ Students</p>
              <p className="text-white/50 text-xs">Already learning on VOA</p>
            </div>
          </div>

          <div className="hidden sm:block w-px h-8 bg-white/10" />

          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <svg key={i} className="w-4 h-4 text-voa-gold" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
            <span className="text-white/60 text-sm ml-1">4.9/5 rating</span>
          </div>

          <div className="hidden sm:block w-px h-8 bg-white/10" />

          <div className="flex items-center gap-2 text-white/60 text-sm">
            <svg className="w-4 h-4 text-voa-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>ZIMSEC Aligned</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-white/30 text-xs font-medium tracking-widest uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-8 bg-gradient-to-b from-voa-blue/50 to-transparent"
        />
      </motion.div>
    </section>
  );
}
