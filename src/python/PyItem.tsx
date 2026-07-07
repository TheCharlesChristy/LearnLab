// PyItem — the mount used by lessons (markdown ::py) and full-page Python
// lessons. Renders the live component tree, a determinate-ish loading card
// (FR-PY-003) bound to RuntimeStatus, and a contained per-item error card
// (FR-PY-004) with traceback + "copy traceback" in dev (FR-PYDX-002) / "View
// details" in prod.
//
// PERSISTENCE BOUNDARY (§3.5): PyItem does NOT import src/progress. It surfaces
// PROGRESS via onProgress and PERSIST via onPersist and accepts savedState as a
// prop; the app shell (orchestrator) wires these to src/progress.

import { useRef, useState } from 'react';

import { usePyRuntime } from './runtime';
import { usePyItem } from './use-py-item';
import { TreeRenderer } from './tree-renderer';
import { type PyHost } from './host';
import type { JsonObject, ProgressPayload } from './protocol';

export interface PyItemProps {
  itemId: string;
  sourceUrl: string;
  source?: string;
  params?: JsonObject;
  height?: number;
  seed?: number;
  savedState?: JsonObject | null;
  onProgress?: (p: ProgressPayload) => void;
  onPersist?: (state: JsonObject) => void;
  title?: string;
  /** Injectable for tests; defaults to the session singleton. */
  host?: PyHost;
}

const MIN_HEIGHT = 240; // Reserve space to avoid CLS while loading.
const DEV = import.meta.env.DEV;

export function PyItem(props: PyItemProps) {
  const { itemId, sourceUrl, source, params, height, seed, savedState, title } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);

  const status = usePyRuntime(props.host);
  const { tree, meta, error, emit, restart } = usePyItem({
    itemId,
    sourceUrl,
    source,
    params,
    seed,
    savedState,
    onProgress: props.onProgress,
    onPersist: props.onPersist,
    containerRef,
    host: props.host,
  });

  // Reserve height (height ?? auto, min 240) to avoid layout shift.
  const reserveStyle: React.CSSProperties = {
    minHeight: height ?? MIN_HEIGHT,
    ...(height ? { height } : {}),
  };

  const heading = title ?? meta?.title;

  return (
    <div
      ref={containerRef}
      data-py-item={itemId}
      className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-surface-dark-muted"
      style={reserveStyle}
    >
      {heading ? (
        <div className="border-b border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
          {heading}
        </div>
      ) : null}

      <div className="p-4">
        {error ? (
          <ErrorCard error={error} onRestart={restart} />
        ) : tree ? (
          <TreeRenderer tree={tree} emit={emit} dev={DEV} />
        ) : (
          <LoadingCard phaseText={status.phaseText} state={status.state} />
        )}
      </div>
    </div>
  );
}

function LoadingCard({ phaseText, state }: { phaseText?: string; state: string }) {
  const text =
    state === 'error'
      ? 'Python runtime failed to load.'
      : (phaseText ?? 'Loading Python runtime… cached after first time');
  return (
    <p role="status" className="flex items-center gap-2 py-8 text-sm text-slate-600 dark:text-slate-300">
      <span
        aria-hidden
        className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-indigo-600 motion-safe:animate-spin"
      />
      {text}
    </p>
  );
}

function ErrorCard({
  error,
  onRestart,
}: {
  error: { phase: string; message: string; traceback: string };
  onRestart: () => void;
}) {
  const [open, setOpen] = useState(DEV);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    void navigator.clipboard?.writeText(error.traceback || error.message).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => undefined,
    );
  };

  return (
    <div
      role="alert"
      className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-700 dark:bg-red-950 dark:text-red-100"
    >
      <p className="font-semibold">Python item error</p>
      <p className="mt-1">{error.message}</p>

      {DEV ? (
        <>
          {error.traceback ? (
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded bg-red-100 p-2 font-mono text-xs dark:bg-red-900">
              {error.traceback}
            </pre>
          ) : null}
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={copy}
              className="rounded border border-red-400 px-2 py-1 text-xs hover:bg-red-100 dark:hover:bg-red-900"
            >
              {copied ? 'Copied' : 'Copy traceback'}
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="rounded border border-red-400 px-2 py-1 text-xs hover:bg-red-100 dark:hover:bg-red-900"
            >
              Restart Python runtime
            </button>
          </div>
        </>
      ) : (
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded border border-red-400 px-2 py-1 text-xs hover:bg-red-100 dark:hover:bg-red-900"
          >
            {open ? 'Hide details' : 'View details'}
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="rounded border border-red-400 px-2 py-1 text-xs hover:bg-red-100 dark:hover:bg-red-900"
          >
            Restart Python runtime
          </button>
        </div>
      )}

      {!DEV && open && error.traceback ? (
        <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded bg-red-100 p-2 font-mono text-xs dark:bg-red-900">
          {error.traceback}
        </pre>
      ) : null}
    </div>
  );
}
