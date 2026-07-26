"use client";

import { useEffect, useRef, useState } from "react";
import { IconCheck } from "@/components/icons";

export interface MessageMenuAction {
  label: string;
  onSelect: () => void;
  danger?: boolean;
}

interface Props {
  x: number;
  y: number;
  actions: MessageMenuAction[];
  onClose: () => void;
}

/** Positioned popover menu opened by right-click or long-press on a message. */
export function MessageMenu({ x, y, actions, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const left = Math.min(x, window.innerWidth - rect.width - 12);
    const top = Math.min(y, window.innerHeight - rect.height - 12);
    setPos({ left: Math.max(8, left), top: Math.max(8, top) });
  }, [x, y]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[250]" style={{ background: "rgba(28,38,32,0.06)" }}>
      <div
        ref={ref}
        role="menu"
        className="fixed bg-edu-paper border border-edu-slate-300 rounded shadow-elevated py-1.5 min-w-[150px]"
        style={{ left: pos.left, top: pos.top }}
      >
        {actions.map((a) => (
          <button
            key={a.label}
            role="menuitem"
            onClick={() => { a.onSelect(); onClose(); }}
            className={`w-full text-left px-3.5 py-2 text-sm transition-colors duration-100 ${
              a.danger ? "text-edu-clay hover:bg-edu-clay-100" : "text-edu-ink hover:bg-edu-slate-100"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CopiedFlash({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-edu-bottle ml-1.5">
      <IconCheck size={10} strokeWidth={3} /> Copied
    </span>
  );
}
