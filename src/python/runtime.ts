// React hooks over PyHost runtime status + lazy-boot helper.
//
// Tier-1 zero-bytes rule (FR-PY-002): this module imports `pyHost` from host.ts,
// which references worker.ts ONLY via `new URL('./worker.ts', import.meta.url)`.
// That is a Worker URL — Vite splits it into its own chunk and never pulls
// Pyodide into the entry. Components that never mount Python therefore ship no
// Pyodide bytes.

import { useEffect, useRef, useSyncExternalStore } from 'react';

import { pyHost, type PyHost, type RuntimeStatus } from './host';

/** Subscribe to PyHost runtime status (re-renders on every state change). */
export function usePyRuntime(host: PyHost = pyHost): RuntimeStatus {
  return useSyncExternalStore(
    (onChange) => host.subscribe(onChange),
    () => host.getStatus(),
    () => host.getStatus(),
  );
}

/**
 * Call host.ensureRuntime() when `ref`'s element nears the viewport
 * (IntersectionObserver, rootMargin default '600px') — FR-PY-002. Fires once.
 */
export function useEnsureRuntimeOnVisible(
  ref: React.RefObject<Element | null>,
  rootMargin = '600px',
  host: PyHost = pyHost,
): void {
  const fired = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || fired.current) return;
    if (typeof IntersectionObserver === 'undefined') {
      // Environments without IO (very old / SSR): boot eagerly rather than never.
      fired.current = true;
      void host.ensureRuntime();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !fired.current) {
          fired.current = true;
          void host.ensureRuntime();
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin, host]);
}

/** Convenience flag for FR-PY-003 loading UI. */
export function useRuntimeReady(host: PyHost = pyHost): boolean {
  const status = usePyRuntime(host);
  return status.state === 'ready';
}

// Re-export the state type so consumers can type-narrow without reaching into host.ts.
export type { RuntimeStatus, RuntimeState } from './host';
