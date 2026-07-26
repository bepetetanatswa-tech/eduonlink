import type { Metadata } from "next";
import { VoaLogoMark } from "@/components/logo/VoaLogoMark";
import { IconChip, IconBook, IconFlask } from "@/components/icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { template: "%s — EduOnLink", default: "EduOnLink Auth" },
};

const FEATURES = [
  { Icon: IconChip, label: "Sir Taks AI tutor", sub: "Marks your work, explains what you got wrong" },
  { Icon: IconBook, label: "Full ZIMSEC curriculum", sub: "ECD through A-Level, exactly as ZIMSEC sets it" },
  { Icon: IconFlask, label: "HBC project support", sub: "Guided help through all six project stages" },
];

const TRUST = ["28+ ZIMSEC subjects covered", "All 10 provinces, urban and rural", "Free for every student, always"];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-edu-paper">
      {/* Left panel — dark chrome register, hidden on mobile */}
      <div className="hidden lg:flex lg:w-[44%] xl:w-[40%] relative flex-col bg-edu-ink margin-rule">
        <div className="relative z-10 flex flex-col h-full p-12 text-edu-paper">
          <a href="/" className="flex items-center gap-3">
            <VoaLogoMark size={34} />
            <span className="font-display font-bold text-lg">EduOnLink</span>
          </a>

          <div className="flex-1 flex flex-col justify-center max-w-sm">
            <h2 className="font-display font-semibold leading-tight mb-5" style={{ fontSize: "2.2rem" }}>
              Everything you need for ZIMSEC, in one place.
            </h2>
            <p className="text-sm leading-relaxed text-edu-slate-300">
              Sir Taks tutors and marks your work, live classes run on low bandwidth, and the HBC project suite guides you stage by stage — built for how Zimbabwean students actually study.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {FEATURES.map((f) => (
              <div key={f.label} className="flex items-center gap-3 p-3 rounded border border-edu-slate-700">
                <div className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0 bg-edu-slate-800 text-edu-gold">
                  <f.Icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-edu-paper">{f.label}</p>
                  <p className="text-xs text-edu-slate-400">{f.sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-edu-slate-700">
            <ul className="flex flex-col gap-1.5">
              {TRUST.map((t) => (
                <li key={t} className="text-xs text-edu-slate-400">{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Right: form panel */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="lg:hidden flex items-center gap-2.5 p-6 pb-0">
          <a href="/" className="flex items-center gap-2.5">
            <VoaLogoMark size={32} />
            <span className="font-display font-bold text-edu-ink">EduOnLink</span>
          </a>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 py-10">
          {children}
        </div>
      </div>
    </div>
  );
}
