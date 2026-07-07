// Toast system (task deliverable 9): aria-live polite, dismissable.
// A module-level bus lets non-React code (PWA registration, progress
// onWriteError wiring) enqueue toasts without needing the React context.

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export interface ToastInput {
  message: string;
  /** Optional action button (e.g. "Reload to update", FR-PWA-001). */
  actionLabel?: string;
  onAction?: () => void;
  /** Auto-dismiss after this many ms; null = sticky until dismissed. */
  durationMs?: number | null;
}

interface ToastRecord extends ToastInput {
  id: number;
}

type Listener = (t: ToastInput) => void;

const listeners = new Set<Listener>();
let nextId = 1;

/** Enqueue a toast from anywhere (React or not). */
export function toast(input: ToastInput): void {
  for (const l of listeners) l(input);
}

/** Renders queued toasts. Mount exactly once, near the app root. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  useEffect(() => {
    const listener: Listener = (input) => {
      const record: ToastRecord = { ...input, id: nextId++ };
      setToasts((ts) => [...ts, record]);
      const duration = input.durationMs === undefined ? 6000 : input.durationMs;
      if (duration !== null) {
        window.setTimeout(() => {
          setToasts((ts) => ts.filter((t) => t.id !== record.id));
        }, duration);
      }
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const dismiss = (id: number) => setToasts((ts) => ts.filter((t) => t.id !== id));

  return (
    <>
      {children}
      <div
        aria-live="polite"
        aria-label="Notifications"
        role="region"
        className="fixed bottom-4 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm shadow-lg dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <p className="flex-1">{t.message}</p>
            {t.actionLabel && (
              <button
                type="button"
                onClick={() => {
                  t.onAction?.();
                  dismiss(t.id);
                }}
                className="shrink-0 rounded px-2 py-1 font-semibold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:text-indigo-300 dark:hover:bg-slate-700"
              >
                {t.actionLabel}
              </button>
            )}
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="shrink-0 rounded p-1 text-slate-500 hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <X aria-hidden className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
