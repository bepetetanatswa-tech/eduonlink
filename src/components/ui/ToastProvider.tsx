"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { IconCheck, IconAlertTriangle } from "@/components/icons";

type ToastVariant = "success" | "error" | "info";
interface Toast { id: number; message: string; variant: ToastVariant; }

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_STYLE: Record<ToastVariant, { bg: string; border: string; text: string }> = {
  success: { bg: "#EAF1EC", border: "#B9CFC1", text: "#1F4738" },
  error:   { bg: "#F4E4E0", border: "#E0B7AC", text: "#A3311E" },
  info:    { bg: "#F2EEE3", border: "#CCD0C0", text: "#1C2620" },
};

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) { clearTimeout(timer); timers.current.delete(id); }
  }, []);

  const showToast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, variant }]);
    const timer = setTimeout(() => dismiss(id), 4000);
    timers.current.set(id, timer);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[300] flex flex-col gap-2 items-center w-full px-4 pointer-events-none"
        style={{ maxWidth: 420 }}
      >
        {toasts.map((t) => {
          const s = VARIANT_STYLE[t.variant];
          return (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto flex items-center gap-2.5 w-full rounded px-4 py-3 shadow-elevated animate-chalk-in"
              style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text }}
            >
              {t.variant === "success" && <IconCheck size={16} className="flex-shrink-0" strokeWidth={2.4} />}
              {t.variant === "error" && <IconAlertTriangle size={16} className="flex-shrink-0" />}
              <p className="text-sm font-medium flex-1">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="text-xs opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.showToast;
}
