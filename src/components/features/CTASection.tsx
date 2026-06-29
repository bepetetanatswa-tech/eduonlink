"use client";

import { motion } from "framer-motion";

const roles = [
  {
    icon: "🎓",
    title: "For Students",
    description: "Learn at your own pace. Get AI help 24/7. Ace your ZIMSEC exams.",
    cta: "Start Learning Free",
    color: "blue",
  },
  {
    icon: "👨‍🏫",
    title: "For Teachers",
    description: "Create lessons, assign work, track progress, and get paid for your expertise.",
    cta: "Join as Teacher",
    color: "gold",
  },
  {
    icon: "🏫",
    title: "For Schools",
    description: "Bring VOA to your entire school. Manage teachers, students, and content in one dashboard.",
    cta: "Partner with Us",
    color: "blue",
  },
  {
    icon: "👨‍👩‍👧",
    title: "For Parents",
    description: "Monitor your child's progress, attendance, and assignments. Stay involved, stay informed.",
    cta: "Track Your Child",
    color: "gold",
  },
];

export default function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden" id="get-started">
      {/* Background */}
      <div className="absolute inset-0 bg-voa-navy-mid" />
      <div
        className="absolute inset-0 pattern-grid opacity-10"
        style={{ maskImage: "radial-gradient(ellipse at 50% 50%, black 20%, transparent 80%)" }}
      />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(0,212,255,0.12) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display font-bold text-4xl lg:text-6xl text-white mb-6 leading-tight">
            Ready to transform{" "}
            <span className="text-gradient-blue">Zimbabwe&apos;s education</span>?
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
            VOA is built for every role in Zimbabwe&apos;s education system. Choose yours and start today.
          </p>
        </motion.div>

        {/* Role cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {roles.map((role, i) => (
            <motion.div
              key={role.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className={`glass rounded-2xl p-6 flex flex-col items-center text-center border ${
                role.color === "blue" ? "border-voa-blue/15" : "border-voa-gold/15"
              } group cursor-pointer`}
            >
              <div className="text-5xl mb-4">{role.icon}</div>
              <h3 className="font-display font-bold text-lg text-white mb-2">{role.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed mb-5">{role.description}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  role.color === "blue"
                    ? "bg-voa-blue/15 text-voa-blue hover:bg-voa-blue/25"
                    : "bg-voa-gold/15 text-voa-gold hover:bg-voa-gold/25"
                }`}
              >
                {role.cta}
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* Main CTA Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="border-animated"
        >
          <div className="rounded-[15px] p-px">
            <div
              className="rounded-[15px] p-10 lg:p-16 text-center"
              style={{
                background: "linear-gradient(135deg, #0D1526 0%, #1A2744 100%)",
              }}
            >
              <h3 className="font-display font-bold text-3xl lg:text-4xl text-white mb-4">
                Zimbabwe&apos;s future{" "}
                <span className="text-shimmer">starts with you.</span>
              </h3>
              <p className="text-white/50 text-lg mb-8 max-w-xl mx-auto">
                Join 10,000+ students, 2,000+ teachers, and 500+ schools already using VOA.
                Free to start. No credit card required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  whileHover={{
                    scale: 1.04,
                    boxShadow: "0 0 50px rgba(0,212,255,0.5)",
                  }}
                  whileTap={{ scale: 0.97 }}
                  className="px-10 py-4 font-bold text-voa-navy rounded-xl text-base"
                  style={{ background: "linear-gradient(135deg, #00D4FF 0%, #0099CC 100%)" }}
                >
                  Start For Free →
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="glass px-10 py-4 font-semibold text-white rounded-xl text-base"
                >
                  Book a School Demo
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
