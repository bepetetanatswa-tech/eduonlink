"use client";

import Link from "next/link";

interface ActivityItem { label: string; value: number; link: string; color: string }

export function ActivityLinks({ items }: { items: ActivityItem[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
      {items.map((item) => (
        <Link key={item.label} href={item.link} style={{ textDecoration: "none" }}>
          <div
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "16px 18px", transition: "border-color 0.15s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${item.color}30`; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; }}
          >
            <p style={{ fontSize: 24, fontWeight: 700, color: item.color, margin: "0 0 4px", fontFamily: "'Space Grotesk', sans-serif" }}>{item.value}</p>
            <p style={{ fontSize: 12, color: "#4A5170", margin: 0 }}>{item.label}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
