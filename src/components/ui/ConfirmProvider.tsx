"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { IconAlertTriangle } from "@/components/icons";

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders the confirm button in the clay/error tone for destructive actions. */
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  const close = (value: boolean) => {
    pending?.resolve(value);
    setPending(null);
  };

  useEffect(() => {
    if (!pending) return;
    confirmBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div
          className="fixed inset-0 z-[400] flex items-center justify-center p-6"
          style={{ background: "rgba(28,38,32,0.45)" }}
          onClick={() => close(false)}
          role="presentation"
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="w-full max-w-sm bg-edu-paper border border-edu-slate-300 rounded p-6 shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              {pending.danger && (
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-edu-clay-100 text-edu-clay">
                  <IconAlertTriangle size={18} />
                </div>
              )}
              <div>
                <h2 id="confirm-title" className="font-display font-semibold text-edu-ink text-base">
                  {pending.title}
                </h2>
                {pending.message && (
                  <p className="text-sm text-edu-slate-600 leading-relaxed mt-1.5">{pending.message}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button onClick={() => close(false)} className="btn-ghost py-2 px-4 text-sm">
                {pending.cancelLabel ?? "Cancel"}
              </button>
              <button
                ref={confirmBtnRef}
                onClick={() => close(true)}
                className={pending.danger ? "py-2 px-4 text-sm rounded font-semibold text-edu-paper bg-edu-clay hover:bg-edu-clay-dark transition-colors" : "btn-primary py-2 px-4 text-sm"}
              >
                {pending.confirmLabel ?? (pending.danger ? "Delete" : "Confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}
