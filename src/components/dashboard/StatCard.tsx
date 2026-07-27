"use client";

import Link from "next/link";

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  accentColor?: string;
  trend?: { value: number; label: string };
  /** Optional — when set, the whole card becomes a link to a relevant subpage. */
  href?: string;
}

export function StatCard({ label, value, subtitle, icon, accentColor = "#B1502B", trend, href }: StatCardProps) {
  const trendColor = trend && trend.value >= 0 ? "#1F4738" : "#A3311E";
  const trendBg = trend && trend.value >= 0 ? "rgba(31,71,56,0.08)" : "rgba(163,49,30,0.08)";
  const trendBorder = trend && trend.value >= 0 ? "rgba(31,71,56,0.2)" : "rgba(163,49,30,0.2)";

  const className = `border border-edu-slate-200 rounded p-5 flex flex-col gap-3 ${
    href ? "transition-all duration-200 hover:border-edu-copper-300 hover:shadow-elevated hover:-translate-y-0.5" : ""
  }`;

  const content = (
    <>
      <div className="flex justify-between items-start">
        <div
          className="w-9 h-9 rounded flex items-center justify-center flex-shrink-0"
          style={{ background: `${accentColor}12`, border: `1px solid ${accentColor}30`, color: accentColor }}
        >
          {icon}
        </div>
        {trend && (
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ color: trendColor, background: trendBg, border: `1px solid ${trendBorder}` }}
          >
            {trend.value >= 0 ? "+" : ""}{trend.value} {trend.label}
          </span>
        )}
      </div>

      <div>
        <p className="font-display font-semibold text-edu-ink" style={{ fontSize: 26, lineHeight: 1.1 }}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        <p className="text-[13px] text-edu-slate-600 mt-1 font-medium">{label}</p>
        {subtitle && <p className="text-[11px] text-edu-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </>
  );

  if (href) {
    return <Link href={href} className={className}>{content}</Link>;
  }
  return <div className={className}>{content}</div>;
}
