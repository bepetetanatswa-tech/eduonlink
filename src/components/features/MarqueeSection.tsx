"use client";

const SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology",
  "Geography", "History", "Shona Language", "Ndebele Language",
  "English Language", "Commerce", "Accounts", "Business Studies",
  "Economics", "Computer Science", "Agriculture", "Food & Nutrition",
  "Art & Craft", "Music", "Physical Education", "Divinity",
];

const ACHIEVEMENTS = [
  "🏆 ZIMSEC Aligned", "🤖 Sir Taks AI", "📊 SBP Blueprints",
  "📹 Live Classes", "📝 Past Papers", "🎓 A-Level Support",
  "🔬 HBC Projects", "📱 Mobile First", "🌍 Built for Zimbabwe",
  "⚡ Instant Feedback", "👨‍👩‍👧 Parent Dashboard", "🏫 School Portal",
];

function MarqueeRow({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  const doubled = [...items, ...items];
  return (
    <div className="overflow-hidden" style={{ maskImage: "linear-gradient(90deg, transparent, black 15%, black 85%, transparent)" }}>
      <div className={reverse ? "marquee-track-rev" : "marquee-track"} style={{ gap: "2px" }}>
        {doubled.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium whitespace-nowrap"
            style={{
              color: "#4A5170",
              borderRight: "1px solid rgba(255,255,255,0.05)",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#8892B0")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#4A5170")}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function MarqueeSection() {
  return (
    <section className="py-6 relative overflow-hidden" style={{ borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="flex flex-col gap-1">
        <MarqueeRow items={SUBJECTS} />
        <MarqueeRow items={ACHIEVEMENTS} reverse />
      </div>
    </section>
  );
}
