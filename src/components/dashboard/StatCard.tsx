"use client";

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  accentColor?: string;
  trend?: { value: number; label: string };
}

export function StatCard({ label, value, subtitle, icon, accentColor = "#4D7FFF", trend }: StatCardProps) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "16px",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        position: "relative",
        overflow: "hidden",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.12)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)")}
    >
      {/* Top glow */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "1px",
        background: `linear-gradient(90deg, transparent, ${accentColor}40, transparent)`,
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div
          style={{
            width: 40, height: 40, borderRadius: "10px",
            background: `${accentColor}15`,
            border: `1px solid ${accentColor}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: accentColor, flexShrink: 0,
          }}
        >
          {icon}
        </div>
        {trend && (
          <span
            style={{
              fontSize: "11px", fontWeight: 600,
              color: trend.value >= 0 ? "#00E5A3" : "#FF6B6B",
              background: trend.value >= 0 ? "rgba(0,229,163,0.1)" : "rgba(255,107,107,0.1)",
              border: `1px solid ${trend.value >= 0 ? "rgba(0,229,163,0.2)" : "rgba(255,107,107,0.2)"}`,
              padding: "2px 8px", borderRadius: "20px",
            }}
          >
            {trend.value >= 0 ? "+" : ""}{trend.value}% {trend.label}
          </span>
        )}
      </div>

      <div>
        <p style={{ fontSize: "28px", fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.1 }}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        <p style={{ fontSize: "13px", color: "#6B7290", marginTop: "4px", fontWeight: 500 }}>{label}</p>
        {subtitle && <p style={{ fontSize: "11px", color: "#4A5170", marginTop: "2px" }}>{subtitle}</p>}
      </div>
    </div>
  );
}
