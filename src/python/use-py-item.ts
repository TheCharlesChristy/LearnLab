// use-py-item — the lifecycle hook behind PyItem. Owns: lazy runtime boot on
// visibility (FR-PY-002), fetch-source-if-absent (same origin), loadItem,
// latest-tree state, error capture (FR-PY-004), progress/persist surfacing
// (the §3.5 persistence boundary — we never import src/progress; we hand
// PROGRESS/PERSIST to the caller's callbacks), serialize-on-hide flush, and the
// rAF tick driver (only while visible & meta.wantsTick, clamped ≤ 60).

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  pyHost,
  type ItemError,
  type ItemHandle,
  type LoadItemRequest,
  type PyHost,
} from './host';
import { useEnsureRuntimeOnVisible } from './runtime';
import type { JsonObject, JsonValue, ProgressPayload } from './protocol';
import type { PyNode } from './component-tree';

export interface UsePyItemOptions {
  itemId: string;
  sourceUrl: string;
  source?: string;
  params?: JsonObject;
  seed?: number;
  savedState?: JsonObject | null;
  onProgress?: (p: ProgressPayload) => void;
  onPersist?: (state: JsonObject) => void;
  /** Element the IntersectionObserver watches (FR-PY-002) and visibility uses. */
  containerRef: React.RefObject<Element | null>;
  host?: PyHost;
}

export interface UsePyItemResult {
  tree: PyNode | null;
  meta: ItemHandle['meta'] | null;
  error: ItemError | null;
  /** Fire a handler token → EVENT (passed to TreeRenderer's `emit`). */
  emit: (handler: string, value: JsonValue) => void;
  /** Restart the whole runtime (FR-PY-004 wedged-worker recovery). */
  restart: () => void;
}

const DEFAULT_SEED = 0;

export function usePyItem(opts: UsePyItemOptions): UsePyItemResult {
  const host = opts.host ?? pyHost;
  const {
    itemId,
    sourceUrl,
    source,
    params,
    seed = DEFAULT_SEED,
    savedState,
    onProgress,
    onPersist,
    containerRef,
  } = opts;

  const [tree, setTree] = useState<PyNode | null>(null);
  const [meta, setMeta] = useState<ItemHandle['meta'] | null>(null);
  const [error, setError] = useState<ItemError | null>(null);

  const handleRef = useRef<ItemHandle | null>(null);
  // Latest callbacks without re-triggering the load effect.
  const cbRef = useRef({ onProgress, onPersist });
  cbRef.current = { onProgress, onPersist };

  // Lazy boot when the element nears the viewport (FR-PY-002).
  useEnsureRuntimeOnVisible(containerRef, '600px', host);

  // Load the item once the source is known. Re-loads only if the identity of the
  // item (itemId/sourceUrl/seed) changes.
  useEffect(() => {
    let cancelled = false;
    let handle: ItemHandle | null = null;
    const unsubs: Array<() => void> = [];

    async function load() {
      try {
        await host.ensureRuntime();
        if (cancelled) return;

        let src = source;
        if (src == null) {
          // Same-origin fetch (NFR-SEC-001 / C-4). sourceUrl is already a
          // same-origin content path produced by the content loaders.
          const res = await fetch(sourceUrl);
          if (!res.ok) throw new Error(`Failed to fetch ${sourceUrl} (${res.status})`);
          src = await res.text();
        }
        if (cancelled) return;

        const req: LoadItemRequest = {
          itemId,
          sourceUrl,
          source: src,
          params: params ?? {},
          savedState: savedState ?? null,
          seed,
        };
        handle = await host.loadItem(req);
        if (cancelled) {
          handle.destroy();
          return;
        }
        handleRef.current = handle;
        setMeta(handle.meta);
        setError(null);

        unsubs.push(handle.onRender((t) => setTree(t)));
        unsubs.push(handle.onError((e) => setError(e)));
        unsubs.push(handle.onProgress((p) => cbRef.current.onProgress?.(p)));
        unsubs.push(handle.onPersist((s) => cbRef.current.onPersist?.(s)));
      } catch (err: unknown) {
        if (cancelled) return;
        setError({
          phase: 'load',
          message: err instanceof Error ? err.message : String(err),
          traceback: err instanceof Error ? (err.stack ?? '') : '',
        });
      }
    }

    void load();

    return () => {
      cancelled = true;
      for (const u of unsubs) u();
      // Destroy on unmount (FR-PY-006).
      handle?.destroy();
      handleRef.current = null;
    };
  }, [host, itemId, sourceUrl, seed, source, params, savedState]);

  // rAF tick driver: only while the element is visible and the item wants ticks
  // (§6.3 TICK; clamp to min(tickHz, 60)). Uses the document visibility + an
  // IntersectionObserver on the container to gate.
  useEffect(() => {
    if (!meta?.wantsTick) return;
    const el = containerRef.current;
    const handle = handleRef.current;
    if (!el || !handle) return;

    const hz = Math.min(meta.tickHz ?? 60, 60);
    const minIntervalMs = 1000 / Math.max(hz, 1);

    let visible = true;
    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden) {
        last = now;
        return;
      }
      const dt = (now - last) / 1000;
      if (now - last >= minIntervalMs) {
        last = now;
        handle.tick(dt);
      }
    };

    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        (entries) => {
          visible = entries.some((e) => e.isIntersecting);
        },
        { threshold: 0 },
      );
      io.observe(el);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
    };
  }, [meta, containerRef]);

  // Flush state on page hide (§6.3 STATE → onPersist). serializeState round-trips
  // through the worker; the result is surfaced via onPersist like a PERSIST.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== 'hidden') return;
      const handle = handleRef.current;
      if (!handle) return;
      void handle
        .serializeState()
        .then((state) => {
          if (state && typeof state === 'object' && !Array.isArray(state)) {
            cbRef.current.onPersist?.(state as JsonObject);
          }
        })
        .catch(() => undefined);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const emit = useCallback((handler: string, value: JsonValue) => {
    handleRef.current?.sendEvent(handler, value);
  }, []);

  const restart = useCallback(() => {
    void host.restart();
  }, [host]);

  return { tree, meta, error, emit, restart };
}
