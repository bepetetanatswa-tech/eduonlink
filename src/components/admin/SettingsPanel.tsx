/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Setting { key: string; value: unknown }

interface Props {
  initialSettings: Setting[];
  adminId: string;
}

const SETTING_META: Record<string, {
  label: string; desc: string; type: "toggle" | "number" | "text"; group: string; icon: string; danger?: boolean;
}> = {
  maintenance_mode:        { label: "Maintenance Mode",         desc: "Block all non-admin access and show a maintenance page",          type: "toggle", group: "Platform",   icon: "🔧", danger: true },
  allow_new_registrations: { label: "Allow New Registrations",  desc: "When off, new signups are blocked",                              type: "toggle", group: "Platform",   icon: "🔐" },
  ai_enabled:              { label: "AI Features (Sir Taks)",   desc: "Enable or disable all AI chat and HBC blueprint features",       type: "toggle", group: "Features",   icon: "🤖" },
  hbc_enabled:             { label: "HBC Project Workflow",     desc: "Enable or disable the Heritage-Based Curriculum project system", type: "toggle", group: "Features",   icon: "🏺" },
  free_ai_daily_limit:     { label: "Free AI Daily Limit",      desc: "Max questions per day for free-tier students",                   type: "number", group: "Limits",     icon: "📊" },
  maintenance_message:     { label: "Maintenance Message",      desc: "Message shown to users during maintenance",                      type: "text",   group: "Platform",   icon: "💬" },
};

const GROUPS = ["Platform", "Features", "Limits"];

function Toggle({ on, onChange, danger }: { on: boolean; onChange: (v: boolean) => void; danger?: boolean }) {
  const color = danger && on ? "#FF6B6B" : on ? "#00E5A3" : "#2A2D3E";
  const bg = danger && on ? "rgba(255,107,107,0.15)" : on ? "rgba(0,229,163,0.15)" : "rgba(255,255,255,0.06)";
  return (
    <button
      onClick={() => onChange(!on)}
      style={{ width: 44, height: 24, borderRadius: 12, background: bg, border: `1px solid ${color}40`, cursor: "pointer", position: "relative", transition: "all 0.2s", flexShrink: 0 }}
      aria-label={on ? "On" : "Off"}
    >
      <div style={{ position: "absolute", top: 2, left: on ? 22 : 2, width: 18, height: 18, borderRadius: "50%", background: color, transition: "left 0.2s" }} />
    </button>
  );
}

export function SettingsPanel({ initialSettings, adminId }: Props) {
  const [settings, setSettings] = useState<Record<string, unknown>>(() => {
    const map: Record<string, unknown> = {};
    initialSettings.forEach((s) => { map[s.key] = s.value; });
    return map;
  });
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const supabase = createClient();

  const save = async (key: string, value: unknown) => {
    setSaving(key);
    await (supabase.from("platform_settings") as any)
      .upsert({ key, value, updated_at: new Date().toISOString(), updated_by: adminId });
    setSettings((p) => ({ ...p, [key]: value }));
    setSaving(null);
    setSaved(key);
    setTimeout(() => setSaved(null), 2000);
  };

  return (
    <div style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>Platform Settings</h2>
        <p style={{ fontSize: 12, color: "#4A5170", marginTop: 4 }}>Global configuration — changes take effect immediately</p>
      </div>

      {/* Maintenance Mode Banner */}
      {settings["maintenance_mode"] === true && (
        <div style={{ padding: "14px 18px", background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: 14, display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#FF6B6B", margin: "0 0 2px" }}>Maintenance Mode is ON</p>
            <p style={{ fontSize: 11, color: "#FF9A9A" }}>All non-admin users are currently seeing the maintenance page. Only you can access the platform.</p>
          </div>
        </div>
      )}

      {GROUPS.map((group) => {
        const keys = Object.entries(SETTING_META).filter(([, m]) => m.group === group).map(([k]) => k);
        return (
          <div key={group}>
            <h3 style={{ fontSize: 11, fontWeight: 600, color: "#4A5170", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>{group}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {keys.map((key) => {
                const meta = SETTING_META[key];
                if (!meta) return null;
                const val = settings[key];
                const isSaving = saving === key;
                const isSaved = saved === key;

                return (
                  <div key={key} style={{ background: meta.danger && val === true ? "rgba(255,107,107,0.05)" : "rgba(255,255,255,0.02)", border: `1px solid ${meta.danger && val === true ? "rgba(255,107,107,0.2)" : "rgba(255,255,255,0.06)"}`, borderRadius: 14, padding: "16px 18px", display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{meta.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#CDD6F4", margin: "0 0 2px", fontFamily: "'Space Grotesk', sans-serif" }}>{meta.label}</p>
                      <p style={{ fontSize: 11, color: "#4A5170", margin: 0 }}>{meta.desc}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                      {isSaved && <span style={{ fontSize: 10, color: "#00E5A3" }}>Saved ✓</span>}
                      {isSaving && <span style={{ fontSize: 10, color: "#4A5170" }}>Saving…</span>}

                      {meta.type === "toggle" && (
                        <Toggle on={val === true} danger={meta.danger} onChange={(v) => save(key, v)} />
                      )}
                      {meta.type === "number" && (
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={typeof val === "number" ? val : 10}
                          onChange={(e) => setSettings((p) => ({ ...p, [key]: parseInt(e.target.value) || 10 }))}
                          onBlur={(e) => save(key, parseInt(e.target.value) || 10)}
                          style={{ width: 64, padding: "6px 10px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, fontSize: 13, color: "#CDD6F4", textAlign: "center", outline: "none" }}
                        />
                      )}
                      {meta.type === "text" && (
                        <input
                          type="text"
                          value={typeof val === "string" ? val : ""}
                          onChange={(e) => setSettings((p) => ({ ...p, [key]: e.target.value }))}
                          onBlur={(e) => save(key, e.target.value)}
                          style={{ width: 240, padding: "7px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12, color: "#CDD6F4", outline: "none" }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div style={{ padding: "14px 18px", background: "rgba(77,127,255,0.05)", border: "1px solid rgba(77,127,255,0.12)", borderRadius: 14 }}>
        <p style={{ fontSize: 12, color: "#4A5170", margin: 0, lineHeight: 1.6 }}>
          <strong style={{ color: "#4D7FFF" }}>Note:</strong> Maintenance mode immediately redirects all non-admin users to the maintenance page. AI and HBC toggles affect all users platform-wide. Changes persist until toggled again.
        </p>
      </div>
    </div>
  );
}
