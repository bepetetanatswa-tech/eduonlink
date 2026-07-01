import type { Metadata } from "next";
import { VoaLogoMark } from "@/components/logo/VoaLogoMark";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { template: "%s — VOA", default: "VOA Auth" },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex" style={{ background: "#07080C" }}>
      {/* Left decorative panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-[42%] relative flex-col overflow-hidden">
        {/* Mesh background */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(at 30% 40%, rgba(77,127,255,0.18) 0%, transparent 55%),
              radial-gradient(at 80% 70%, rgba(0,229,163,0.1) 0%, transparent 50%),
              radial-gradient(at 60% 10%, rgba(245,166,35,0.08) 0%, transparent 45%),
              #07080C
            `,
          }}
        />

        {/* Grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(77,127,255,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(77,127,255,0.05) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            maskImage: "radial-gradient(ellipse at 40% 50%, black 20%, transparent 80%)",
          }}
        />

        {/* Glow orbs */}
        <div
          className="absolute top-1/4 left-1/3 w-80 h-80 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(77,127,255,0.12) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(0,229,163,0.10) 0%, transparent 70%)",
            filter: "blur(30px)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3">
            <VoaLogoMark size={36} />
            <span className="font-display font-bold text-white text-lg">VOA</span>
          </a>

          {/* Center copy */}
          <div className="flex-1 flex flex-col justify-center">
            <p className="font-mono text-xs font-medium tracking-[0.15em] uppercase mb-6" style={{ color: "#4D7FFF" }}>
              Zimbabwe&apos;s Future Learns Here
            </p>
            <h2 className="font-display font-bold text-white leading-tight mb-6" style={{ fontSize: "2.6rem" }}>
              The intelligence<br />
              behind your<br />
              <span className="text-gradient-cobalt">education.</span>
            </h2>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: "#6B7290" }}>
              AI tutoring, ZIMSEC curriculum, live classes, and HBC project blueprints — all in one platform built for Zimbabwe.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-col gap-3">
            {[
              { icon: "✦", label: "Sir Taks AI Tutor", sub: "Powered by Gemini",   accent: "#00E5A3" },
              { icon: "📚", label: "Full ZIMSEC Curriculum", sub: "O-Level & A-Level", accent: "#4D7FFF" },
              { icon: "🔬", label: "HBC Project Blueprints", sub: "AI-generated SBPs", accent: "#F5A623" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: `${f.accent}12`, border: `1px solid ${f.accent}20` }}
                >
                  {f.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{f.label}</p>
                  <p className="text-xs" style={{ color: "#4A5170" }}>{f.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Trust bar */}
          <div className="mt-8 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <p className="text-xs mb-3" style={{ color: "#4A5170" }}>Powering Zimbabwe&apos;s next generation</p>
            <div className="flex flex-col gap-2">
              {[
                { label: "28+ ZIMSEC subjects covered", accent: "#4D7FFF" },
                { label: "All 10 provinces, urban & rural", accent: "#00E5A3" },
                { label: "Free for every student, always", accent: "#F5A623" },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: f.accent }} />
                  <span className="text-xs" style={{ color: "#4A5170" }}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right: form panel */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 p-6 pb-0">
          <a href="/" className="flex items-center gap-2.5">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-lg opacity-70" style={{ background: "linear-gradient(135deg, #4D7FFF, #00E5A3)" }} />
              <div className="absolute inset-[1px] rounded-[7px] flex items-center justify-center" style={{ background: "#07080C" }}>
                <span className="font-display font-bold text-xs" style={{ background: "linear-gradient(135deg, #4D7FFF, #00E5A3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>V</span>
              </div>
            </div>
            <span className="font-display font-bold text-white">VOA</span>
          </a>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 py-10">
          {children}
        </div>
      </div>
    </div>
  );
}
