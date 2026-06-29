"use client";

import { motion } from "framer-motion";

const ROLES = [
  { icon: "🎓", title: "Students",      sub: "Learn smarter. Ace ZIMSEC. Get AI help 24/7.",           accent: "#4D7FFF", cta: "Start Free" },
  { icon: "👨‍🏫", title: "Teachers",     sub: "Teach, earn, grow. Your expertise, amplified.",           accent: "#F5A623", cta: "Join as Educator" },
  { icon: "🏫", title: "Schools",       sub: "Deploy VOA to your entire institution in one click.",      accent: "#4D7FFF", cta: "Partner With Us" },
  { icon: "👨‍👩‍👧", title: "Parents",    sub: "Track your child's progress. Stay in the loop.",           accent: "#00E5A3", cta: "Monitor Progress" },
];

export default function CTASection() {
  return (
    <section className="section" id="cta">
      <div className="container-voa">
        {/* Role grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-4"
        >
          <p className="font-mono text-xs font-medium tracking-[0.15em] uppercase mb-4" style={{ color: "#4A5170" }}>
            Join VOA
          </p>
          <h2 className="font-display font-bold text-white mb-12" style={{ fontSize: "clamp(30px, 5vw, 52px)", lineHeight: 1.1 }}>
            Who are you?
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-16">
          {ROLES.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.08 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bento p-6 flex flex-col gap-4 cursor-pointer"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ background: `${r.accent}10`, border: `1px solid ${r.accent}20` }}
              >
                {r.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-white text-lg mb-1">{r.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6B7290" }}>{r.sub}</p>
              </div>
              <button
                className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
                style={{
                  background: `${r.accent}12`,
                  color: r.accent,
                  border: `1px solid ${r.accent}25`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = `${r.accent}20`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = `${r.accent}12`;
                }}
              >
                {r.cta}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Main CTA block */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-3xl overflow-hidden p-1"
          style={{
            background: "linear-gradient(135deg, rgba(77,127,255,0.4), rgba(0,229,163,0.2), rgba(245,166,35,0.3))",
          }}
        >
          <div
            className="relative rounded-[20px] p-10 lg:p-16 text-center overflow-hidden"
            style={{ background: "#0B0C13" }}
          >
            {/* Background glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at 50% 0%, rgba(77,127,255,0.12) 0%, transparent 60%)",
              }}
            />

            {/* Grid overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{
                backgroundImage: `linear-gradient(rgba(77,127,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(77,127,255,0.06) 1px, transparent 1px)`,
                backgroundSize: "60px 60px",
              }}
            />

            <div className="relative z-10">
              <p className="font-mono text-xs font-medium tracking-[0.15em] uppercase mb-6" style={{ color: "#4D7FFF" }}>
                Zimbabwe&apos;s Future Starts Here
              </p>
              <h3 className="font-display font-bold text-white mb-4" style={{ fontSize: "clamp(28px, 5vw, 56px)", lineHeight: 1.05 }}>
                The intelligence behind<br />
                <span className="text-shimmer-cobalt">Zimbabwe&apos;s education.</span>
              </h3>
              <p className="text-base mb-10 max-w-xl mx-auto" style={{ color: "#6B7290" }}>
                10,000+ students. 500+ schools. Free to start — no credit card, no commitment.
                Join the platform that&apos;s redefining what education looks like in Zimbabwe.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: "0 0 60px rgba(77,127,255,0.5)" }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-primary text-base px-10 py-4"
                >
                  Start Learning Free →
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-ghost text-base px-10 py-4"
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
