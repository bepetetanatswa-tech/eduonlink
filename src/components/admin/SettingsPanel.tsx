/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  IconWrench, IconLock, IconChip, IconFlask, IconChartBar, IconMessage,
  IconPhone, IconTag, IconCoins, IconAlertTriangle, IconCheck,
} from "@/components/icons";

interface Setting { key: string; value: unknown }

interface Props {
  initialSettings: Setting[];
  adminId: string;
}

const SETTING_META: Record<string, {
  label: string; desc: string; type: "toggle" | "number" | "text"; group: string; icon: React.ComponentType<{ size?: number; className?: string }>; danger?: boolean;
}> = {
  maintenance_mode:        { label: "Maintenance mode",         desc: "Block all non-admin access and show a maintenance page.",          type: "toggle", group: "Platform", icon: IconWrench, danger: true },
  allow_new_registrations: { label: "Allow new registrations",  desc: "When this is off, new signups are blocked platform-wide.",          type: "toggle", group: "Platform", icon: IconLock },
  ai_enabled:              { label: "AI features (Sir Taks)",   desc: "Turn all AI chat and HBC blueprint generation on or off.",          type: "toggle", group: "Features", icon: IconChip },
  hbc_enabled:             { label: "HBC project workflow",     desc: "Turn the Heritage-Based Curriculum project system on or off.",       type: "toggle", group: "Features", icon: IconFlask },
  free_ai_daily_limit:     { label: "Free AI daily limit",      desc: "The maximum number of AI questions a free-tier student can ask per day.", type: "number", group: "Limits", icon: IconChartBar },
  maintenance_message:     { label: "Maintenance message",      desc: "The message users see on the maintenance page while it's active.",  type: "text",   group: "Platform", icon: IconMessage },
  ecocash_number:          { label: "EcoCash number",           desc: "The number shown to users for manual EcoCash payments — update this the moment you switch to a dedicated business line.", type: "text", group: "Payments", icon: IconPhone },
  ecocash_name:            { label: "EcoCash recipient name",   desc: "The registered name shown alongside the number on payment screens.", type: "text", group: "Payments", icon: IconTag },
  commission_rate_pct:     { label: "Marketplace commission %", desc: "The platform's cut of teacher course and class sales — the rest goes to the teacher's earnings balance.", type: "number", group: "Payments", icon: IconCoins },
};

const GROUPS = ["Platform", "Features", "Limits", "Payments"];

function Toggle({ on, onChange, danger }: { on: boolean; onChange: (v: boolean) => void; danger?: boolean }) {
  const color = danger && on ? "#A3311E" : on ? "#1F4738" : "#AEB5A6";
  return (
    <button
      onClick={() => onChange(!on)}
      className="relative flex-shrink-0"
      style={{ width: 42, height: 24, borderRadius: 12, background: on ? `${color}22` : "#E3E2D4", border: `1px solid ${color}` }}
      aria-label={on ? "On" : "Off"}
    >
      <span
        className="absolute top-[2px] block rounded-full transition-[left] duration-150"
        style={{ left: on ? 20 : 2, width: 18, height: 18, background: color }}
      />
    </button>
  );
}

export function SettingsPanel({ initialSettings, adminId }: Props) {
  const [settings, setSettings] = useState<Record<string, unknown>>(() => {
    const map: Record<string, unknown> = {};
    initialSettings.forEach((s) => { map[s.key] = s.value; });
    return map;
  });
  const [savedValues, setSavedValues] = useState<Record<string, unknown>>(() => {
    const map: Record<string, unknown> = {};
    initialSettings.forEach((s) => { map[s.key] = s.value; });
    return map;
  });
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const supabase = createClient();

  const save = async (key: string, value: unknown) => {
    setSaving(key);
    setSaveError(null);
    const { error } = await (supabase.from("platform_settings") as any)
      .upsert({ key, value, updated_at: new Date().toISOString(), updated_by: adminId });
    setSaving(null);
    if (error) { setSaveError(`Could not save ${SETTING_META[key]?.label ?? key}: ${error.message}`); return; }
    setSettings((p) => ({ ...p, [key]: value }));
    setSavedValues((p) => ({ ...p, [key]: value }));
    setSaved(key);
    setTimeout(() => setSaved(null), 2000);
  };

  return (
    <div className="max-w-[760px] flex flex-col gap-8">
      <div>
        <h2 className="font-display font-semibold text-xl text-edu-ink">Platform settings</h2>
        <p className="text-sm text-edu-slate-500 mt-1">Global configuration — changes take effect immediately.</p>
      </div>

      {saveError && (
        <div className="flex items-start gap-2 px-4 py-3 rounded bg-edu-clay-100 border border-edu-clay-200 text-sm text-edu-clay-dark">
          <IconAlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          {saveError}
        </div>
      )}

      {settings["maintenance_mode"] === true && (
        <div className="flex items-start gap-3 p-4 rounded bg-edu-clay-100 border border-edu-clay-200">
          <IconAlertTriangle size={20} className="flex-shrink-0 text-edu-clay" />
          <div>
            <p className="text-sm font-semibold text-edu-clay-dark">Maintenance mode is on</p>
            <p className="text-xs text-edu-clay-dark mt-0.5 leading-relaxed">
              All non-admin users are currently seeing the maintenance page. Only you can access the platform.
            </p>
          </div>
        </div>
      )}

      {GROUPS.map((group) => {
        const keys = Object.entries(SETTING_META).filter(([, m]) => m.group === group).map(([k]) => k);
        return (
          <div key={group}>
            <h3 className="text-xs font-semibold text-edu-slate-500 uppercase tracking-[0.06em] mb-3">{group}</h3>
            <div className="flex flex-col gap-3">
              {keys.map((key) => {
                const meta = SETTING_META[key];
                if (!meta) return null;
                const val = settings[key];
                const isSaving = saving === key;
                const isSaved = saved === key;
                const Icon = meta.icon;
                const dangerActive = meta.danger && val === true;

                return (
                  <div
                    key={key}
                    className={`rounded border p-5 ${dangerActive ? "bg-edu-clay-100 border-edu-clay-200" : "border-edu-slate-200"}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 mt-0.5 ${dangerActive ? "text-edu-clay" : "text-edu-slate-500"}`}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <p className="font-display font-semibold text-sm text-edu-ink">{meta.label}</p>
                          {meta.type === "toggle" && (
                            <Toggle on={val === true} danger={meta.danger} onChange={(v) => save(key, v)} />
                          )}
                        </div>
                        <p className="text-sm text-edu-slate-600 leading-relaxed mt-1">{meta.desc}</p>

                        {meta.type !== "toggle" && (
                          <div className="flex flex-wrap items-center gap-3 mt-4">
                            {meta.type === "number" && (
                              <input
                                type="number"
                                min={1}
                                max={100}
                                value={typeof val === "number" ? val : 10}
                                onChange={(e) => setSettings((p) => ({ ...p, [key]: parseInt(e.target.value) || 10 }))}
                                className="field w-20 text-center"
                              />
                            )}
                            {meta.type === "text" && (
                              <input
                                type="text"
                                value={typeof val === "string" ? val : ""}
                                onChange={(e) => setSettings((p) => ({ ...p, [key]: e.target.value }))}
                                className="field flex-1 min-w-[200px] sm:max-w-[320px]"
                              />
                            )}
                            <button
                              onClick={() => save(key, val)}
                              disabled={isSaving || val === savedValues[key]}
                              className="btn-ghost h-9 px-4 text-xs disabled:opacity-40"
                            >
                              Save
                            </button>
                            {isSaving && <span className="text-xs text-edu-slate-500">Saving…</span>}
                            {isSaved && (
                              <span className="flex items-center gap-1 text-xs text-edu-bottle-dark">
                                <IconCheck size={12} strokeWidth={3} /> Saved
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="p-4 rounded bg-edu-copper-50 border border-edu-copper-200">
        <p className="text-xs text-edu-slate-600 leading-relaxed">
          <strong className="text-edu-copper-dark">Note:</strong> maintenance mode immediately redirects all non-admin users to the maintenance page. AI and HBC toggles affect all users platform-wide. Changes persist until toggled again.
        </p>
      </div>
    </div>
  );
}
