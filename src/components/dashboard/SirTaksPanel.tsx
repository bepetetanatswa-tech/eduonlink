"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DEMO_PAIRS = [
 {
 q: "Explain photosynthesis for Form 2 Biology",
 a: "Photosynthesis is the process by which green plants convert sunlight into food. In Zimbabwe's high-altitude regions like the Eastern Highlands, you can observe this in the lush vegetation that thrives there. The equation is: CO₂ + H₂O + Light Energy → Glucose + O₂. The chlorophyll in leaves absorbs sunlight, splitting water molecules and using the energy to convert carbon dioxide into glucose.",
 },
 {
 q: "Generate an HBC blueprint for a water harvesting project",
 a: " SBP Blueprint Generated\n\nProject: Community Rainwater Harvesting System\nHBC Stage: Topic Selection & Rationale → Research & Data Collection\n\nObjectives:\n• Document traditional water conservation practices\n• Map water scarcity hotspots in the community\n• Design a sustainable collection system\n\nHeritage Connection: Building on ancient Zimbabwe stone-channel irrigation techniques used at Great Zimbabwe.",
 },
 {
 q: "ZIMSEC O-Level Maths tips for quadratic equations",
 a: "Key tips for quadratic equations in ZIMSEC O-Level:\n\n1. Always check if the equation can be factorised first — examiners love this method\n2. Use the formula x = (−b ± √(b²−4ac)) / 2a when factorisation fails\n3. Show the discriminant (b²−4ac) explicitly — it earns marks\n4. ZIMSEC marking schemes award method marks even for wrong final answers\n5. Express roots to 2 decimal places unless instructed otherwise",
 },
];

function TypedText({ text, speed = 18 }: { text: string; speed?: number }) {
 const [displayed, setDisplayed] = useState("");
 const [done, setDone] = useState(false);

 useEffect(() => {
 setDisplayed("");
 setDone(false);
 let i = 0;
 const id = setInterval(() => {
 if (i < text.length) {
 setDisplayed(text.slice(0, i + 1));
 i++;
 } else {
 setDone(true);
 clearInterval(id);
 }
 }, speed);
 return () => clearInterval(id);
 }, [text, speed]);

 return (
 <span>
 {displayed}
 {!done && <span className="inline-block w-0.5 h-4 align-middle ml-0.5 animate-pulse" style={{ background: "#1F4738" }} />}
 </span>
 );
}

export default function AiSection() {
 const [active, setActive] = useState(0);
 const [typing, setTyping] = useState(false);
 const [showAnswer, setShowAnswer] = useState(false);

 const handleSelect = (i: number) => {
 if (i === active) return;
 setTyping(false);
 setShowAnswer(false);
 setActive(i);
 setTimeout(() => {
 setTyping(true);
 setTimeout(() => {
 setShowAnswer(true);
 setTyping(false);
 }, 800);
 }, 200);
 };

 useEffect(() => {
 setTyping(true);
 setTimeout(() => {
 setShowAnswer(true);
 setTyping(false);
 }, 900);
 }, []);

 return (
 <section className="section" id="ai">
 <div className="container-voa">
 <div className="grid lg:grid-cols-2 gap-16 items-start">
 {/* Left: copy */}
 <div>
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.6 }}
 >
 <p className="font-mono text-xs font-medium tracking-[0.15em] uppercase mb-4" style={{ color: "#1F4738" }}>
 Powered by Google Gemini
 </p>
 <h2 className="font-display font-bold text-white mb-6" style={{ fontSize: "clamp(30px, 4.5vw, 48px)", lineHeight: 1.1 }}>
 Meet
 <span className="text-gradient-mint">Sir Taks</span>
 <br />
 — your AI tutor
 </h2>
 <p className="text-base leading-relaxed mb-8" style={{ color: "#566257" }}>
 Sir Taks knows the ZIMSEC syllabus inside-out. Ask any question, get a step-by-step
 explanation with Zimbabwean context, generate HBC project blueprints, or request
 exam strategies — all instantly, at any time of day.
 </p>

 {/* Capabilities */}
 <div className="space-y-3">
 {[
 { icon: "", label: "Subject-specific tutoring", sub: "Every ZIMSEC subject, every form level" },
 { icon: "", label: "SBP Blueprint Generator", sub: "Full HBC project blueprints in seconds" },
 { icon: "", label: "Past Exam Questions", sub: "Step-by-step walkthroughs after you attempt them first" },
 { icon: "", label: "Explains in Shona & Ndebele", sub: "If you ask — Sir Taks adapts" },
 ].map((c) => (
 <div
 key={c.label}
 className="flex items-start gap-4 p-4 rounded-xl"
 style={{ background: "rgba(28,38,32,0.02)", border: "1px solid rgba(28,38,32,0.04)" }}
 >
 <span className="text-xl flex-shrink-0">{c.icon}</span>
 <div>
 <p className="text-sm font-semibold text-white">{c.label}</p>
 <p className="text-xs mt-0.5" style={{ color: "#6E7A6C" }}>{c.sub}</p>
 </div>
 </div>
 ))}
 </div>

 <motion.button
 whileHover={{ scale: 1.02 }}
 whileTap={{ scale: 0.97 }}
 className="btn-primary mt-8 text-sm"
 style={{ background: "linear-gradient(135deg, #153328, #1F4738)" }}
 >
 Try Sir Taks Free →
 </motion.button>
 </motion.div>
 </div>

 {/* Right: interactive demo */}
 <motion.div
 initial={{ opacity: 0, x: 30 }}
 whileInView={{ opacity: 1, x: 0 }}
 viewport={{ once: true }}
 transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
 >
 <div
 className="rounded-2xl overflow-hidden"
 style={{
 background: "#F2EEE3",
 border: "1px solid rgba(28,38,32,0.07)",
 boxShadow: "0 0 0 1px rgba(28,38,32,0.04), 0 40px 80px rgba(0,0,0,0.5)",
 }}
 >
 {/* Terminal bar */}
 <div
 className="flex items-center gap-2 px-4 py-3"
 style={{ borderBottom: "1px solid rgba(28,38,32,0.06)", background: "rgba(28,38,32,0.02)" }}
 >
 <div className="flex gap-1.5">
 {["#FF5F57","#FFBD2E","#28C941"].map((c) => (
 <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />
 ))}
 </div>
 <span className="mx-auto font-mono text-xs" style={{ color: "#6E7A6C" }}>
 sir-taks · voa
 </span>
 <span className="badge badge-mint text-[10px] px-2 py-0.5">Live</span>
 </div>

 {/* Query buttons */}
 <div
 className="p-3 flex flex-col gap-1.5"
 style={{ borderBottom: "1px solid rgba(28,38,32,0.04)" }}
 >
 {DEMO_PAIRS.map((p, i) => (
 <button
 key={i}
 onClick={() => handleSelect(i)}
 className="text-left px-3 py-2 rounded-lg text-xs transition-all duration-200"
 style={{
 color: active === i ? "#8F4022" : "#6E7A6C",
 background: active === i ? "rgba(177,80,43,0.1)" : "transparent",
 border: `1px solid ${active === i ? "rgba(177,80,43,0.2)" : "transparent"}`,
 }}
 >
 <span className="font-mono text-[10px] mr-2" style={{ color: "#B1502B" }}>›</span>
 {p.q}
 </button>
 ))}
 </div>

 {/* Response area */}
 <div className="p-5 min-h-[200px]">
 {/* User message */}
 <div className="flex justify-end mb-4">
 <div
 className="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-tr-sm text-xs"
 style={{ background: "rgba(177,80,43,0.12)", color: "#8F4022", border: "1px solid rgba(177,80,43,0.2)" }}
 >
 {DEMO_PAIRS[active].q}
 </div>
 </div>

 {/* AI response */}
 <div className="flex gap-3">
 <div
 className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
 style={{ background: "rgba(31,71,56,0.15)", border: "1px solid rgba(31,71,56,0.3)" }}
 >
 
 </div>
 <div>
 <p className="text-[10px] font-mono font-semibold mb-2" style={{ color: "#1F4738" }}>Sir Taks</p>
 <AnimatePresence mode="wait">
 {typing && (
 <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 className="flex gap-1"
 >
 {[0,1,2].map((i) => (
 <motion.div key={i} animate={{ y: [0,-4,0] }}
 transition={{ duration: 0.6, delay: i*0.15, repeat: Infinity }}
 className="w-1.5 h-1.5 rounded-full"
 style={{ background: "#1F4738" }}
 />
 ))}
 </motion.div>
 )}
 {showAnswer && (
 <motion.p key="answer" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
 className="text-xs leading-relaxed font-mono whitespace-pre-line"
 style={{ color: "#566257" }}
 >
 <TypedText text={DEMO_PAIRS[active].a} speed={12} />
 </motion.p>
 )}
 </AnimatePresence>
 </div>
 </div>
 </div>

 {/* Input bar */}
 <div
 className="px-4 py-3 flex items-center gap-3"
 style={{ borderTop: "1px solid rgba(28,38,32,0.04)" }}
 >
 <div
 className="flex-1 h-9 rounded-lg flex items-center px-3 text-xs"
 style={{ background: "rgba(28,38,32,0.03)", border: "1px solid rgba(28,38,32,0.06)", color: "#6E7A6C" }}
 >
 Ask Sir Taks anything…
 </div>
 <button
 className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
 style={{ background: "rgba(31,71,56,0.15)", border: "1px solid rgba(31,71,56,0.3)" }}
 >
 <svg className="w-4 h-4" fill="none" stroke="#1F4738" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
 </svg>
 </button>
 </div>
 </div>

 {/* Powered-by note */}
 <p className="text-center text-xs mt-3" style={{ color: "#6E7A6C" }}>
 Powered by Google Gemini · ZIMSEC-trained prompts
 </p>
 </motion.div>
 </div>
 </div>
 </section>
 );
}
