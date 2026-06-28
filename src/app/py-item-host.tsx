// PyItemHost — the app-shell orchestrator that wires a Python item (<PyItem>)
// to the progress subsystem (§3.4 steps 4–7, §6.3 PROGRESS/PERSIST). It is used
// in two places by the lesson page:
//   * embedded ::py items inside a Markdown lesson (via MarkdownLesson's
//     pyItemRenderer), and
//   * full-page Python lessons (Lesson.kind === 'python', §4.4).
//
// PyItem itself never imports src/progress (persistence boundary, §3.5): it
// surfaces PROGRESS via onProgress, PERSIST via onPersist, and accepts
// savedState as a prop. This module is the only place those callbacks meet
// src/progress.
//
// ITEM ID (stable, unique within a module). The itemId for a Python item is its
// module-relative `.py` source path with the trailing ".py" removed, e.g.
//   "items/power-rule-quiz.py"  -> "items/power-rule-quiz"
//   "items/full-sim.py"         -> "items/full-sim"
// We deliberately keep the directory prefix rather than just the basename so two
// items with the same filename in different folders stay distinct, and it is
// stable across renders because it derives only from the authored `src`.
//
// SEED. A stable 32-bit integer hash of `${moduleId}:${itemId}` (FNV-1a) so the
// first run is reproducible (§6.6); the item self-manages attempt reseeding via
// saved_state.

import { useMemo, useRef } from 'react';

import {
  getItemState,
  recordAttempt,
  requestPersistentStorage,
  setItemState,
} from '../progress';
import type { JsonObject, ProgressPayload } from '../python';
import { PyItem } from '../python';
import { useAsyncData } from './useAsyncData';

export interface PyItemHostProps {
  moduleId: string;
  /** Absolute (BASE_URL-relative) URL the host fetches the .py source from. */
  sourceUrl: string;
  /** Module-relative source path (e.g. "items/quiz.py"); derives the itemId. */
  src: string;
  params?: Record<string, unknown>;
  height?: number;
  /** Optional display title (full-page lessons pass the lesson title). */
  title?: string;
}

/** itemId = module-relative .py path minus the ".py" extension (see header). */
export function pyItemId(src: string): string {
  return src.replace(/\.py$/i, '');
}

/** Stable 32-bit FNV-1a hash → a non-negative integer seed (§6.6). */
export function seedFor(moduleId: string, itemId: string): number {
  const s = `${moduleId}:${itemId}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function PyItemHost({
  moduleId,
  sourceUrl,
  src,
  params,
  height,
  title,
}: PyItemHostProps) {
  const itemId = pyItemId(src);
  const seed = useMemo(() => seedFor(moduleId, itemId), [moduleId, itemId]);

  // Captured at mount so every recorded attempt has a sensible startedAt.
  const startedAtRef = useRef(Date.now());

  // PyItem props are JSON-safe; ::py params arrive typed as Record<string,
  // unknown> but are JSON-parsed upstream, so they are JsonObject in practice.
  const itemParams = params as JsonObject | undefined;

  // Load any persisted item state before mounting PyItem (§6.10). Keyed so a
  // route change to a different item reloads the right saved state.
  const saved = useAsyncData(
    () => getItemState(moduleId, itemId),
    `py-item-state:${moduleId}:${itemId}`,
  );

  const onProgress = (p: ProgressPayload) => {
    // 'scored' → a real graded attempt; 'completed' → a 1/1 completion marker.
    // §6.3 says "mark item complete for completed", but there is no dedicated
    // item-complete store. A 1/1 python-item attempt is the smallest consistent
    // choice: it makes the item visible in the progress tables (§5.5) exactly
    // like a scored run.
    const score = p.kind === 'completed' ? 1 : (p.score ?? 0);
    const maxScore = p.kind === 'completed' ? 1 : (p.maxScore ?? 0);
    void recordAttempt({
      moduleId,
      itemId,
      kind: 'python-item',
      score,
      maxScore,
      startedAt: startedAtRef.current,
      finishedAt: Date.now(),
      answers: {},
    }).then(() => requestPersistentStorage());
  };

  const onPersist = (state: JsonObject) => {
    // The host already debounced this PERSIST (500 ms trailing); the ≤64 KB cap
    // is enforced inside setItemState. Errors surface via the progress
    // onWriteError → toast (NFR-REL-001); no double-handling here.
    void setItemState(moduleId, itemId, state);
  };

  // Render PyItem only once saved state has resolved, so PyItem mounts with the
  // correct savedState exactly once (it does not re-read savedState later).
  if (saved.status === 'loading') {
    return (
      <div
        data-py-item-host={itemId}
        style={{ minHeight: Math.max(height ?? 240, 240) }}
        className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-surface-dark-muted"
      >
        <p
          role="status"
          className="flex items-center gap-2 p-4 py-8 text-sm text-slate-600 dark:text-slate-300"
        >
          <span
            aria-hidden
            className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-indigo-600 motion-safe:animate-spin"
          />
          Loading saved progress…
        </p>
      </div>
    );
  }

  // On error reading saved state we proceed as a first run (savedState = null);
  // the read error itself already surfaced via the progress write-error path.
  const savedState =
    saved.status === 'ready' ? ((saved.data ?? null) as JsonObject | null) : null;

  return (
    <PyItem
      itemId={itemId}
      sourceUrl={sourceUrl}
      params={itemParams}
      height={height}
      seed={seed}
      savedState={savedState}
      onProgress={onProgress}
      onPersist={onPersist}
      title={title}
    />
  );
}
