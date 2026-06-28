// `code-runner` implementation — learner-typed Python run in the Pyodide worker.
// SRS §5.3 (registry row), FR-PY-001/004, NFR-SEC-002, NFR-PERF-001, C-6.
//
// EXECUTION MODEL (C-6 / NFR-SEC-002): learner code runs ONLY in the DOM-less
// Pyodide worker via pyHost.runSnippet — never eval/new Function on the main
// thread. The editor below is just text input.
//
// LAZY LOADING (NFR-PERF-001): this file is the React.lazy boundary for the
// widget. It imports CodeMirror (via ./Editor) and the src/python barrel, so
// both land in this widget's chunk, not the entry bundle.
//
// COMPLETION & THE onComplete CONTRACT (§3.5 boundary): the widget must NOT
// import src/progress. When `solutionTest` is provided and passes after a
// successful learner run, the widget:
//   1. renders a visible "✓ Complete" state,
//   2. sets `data-complete="true"` on its root element, and
//   3. calls the optional `onComplete()` prop (default no-op).
// The app shell wires `onComplete` (e.g. via the widget registry / Markdown
// renderer) to record a completion progress event when it is ready. Until then
// completion is purely visual + observable via the data attribute.
//
// TIMEOUT / WEDGED WORKER (§5.3): runSnippet is called with a 5 s soft timeout.
// The PRIMARY recovery mechanism is the restart fallback: if runSnippet has not
// resolved within the soft timeout, we surface a "still running…" warning with a
// "Restart Python runtime" button (pyHost.restart()). SharedArrayBuffer-based
// interrupt is best-effort and only meaningful when crossOriginIsolated &&
// SharedArrayBuffer exists; the current PyHost.runSnippet does not expose an SAB
// interrupt handle, so we feature-detect SAB only to label the affordance and
// otherwise rely on restart (documented choice).

import { useContext, useEffect, useRef, useState } from 'react';

import { LessonContext } from '../../content';
import { pyHost, usePyRuntime } from '../../python';

import Editor from './Editor';
import type { CodeRunnerProps } from './index';

/**
 * Result shape of pyHost.runSnippet (SNIPPET_RESULT payload, §6.3). The python
 * barrel does not re-export this type, so we mirror the contracted shape locally;
 * the host's return value satisfies it structurally.
 */
export interface SnippetResult {
  runId: string;
  ok: boolean;
  stdout: string;
  stderr: string;
  error?: string;
}

/** Soft timeout for a learner run (§5.3). */
const SOFT_TIMEOUT_MS = 5000;

/** True when SharedArrayBuffer-based interrupt could be used (best-effort). */
function sabInterruptAvailable(): boolean {
  return (
    typeof crossOriginIsolated !== 'undefined' &&
    crossOriginIsolated === true &&
    typeof SharedArrayBuffer !== 'undefined'
  );
}

type RunState =
  | { phase: 'idle' }
  | { phase: 'running' }
  | { phase: 'slow' } // exceeded the soft timeout, still not resolved
  | { phase: 'done'; result: SnippetResult }
  | { phase: 'failed'; message: string };

export default function CodeRunner({
  starter = '',
  solutionTest,
  rows,
  onComplete,
}: CodeRunnerProps) {
  // LessonContext is optional here (null outside lesson routes); we don't use it
  // for anything required, but read it so future wiring (e.g. itemId) is local.
  useContext(LessonContext);

  const runtime = usePyRuntime();
  const [code, setCode] = useState(starter);
  const [run, setRun] = useState<RunState>({ phase: 'idle' });
  const [complete, setComplete] = useState(false);

  // Track the in-flight run so a late resolve from a superseded run is ignored.
  const runTokenRef = useRef(0);
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    };
  }, []);

  const isBusy = run.phase === 'running' || run.phase === 'slow';

  async function handleRun() {
    const token = ++runTokenRef.current;
    setRun({ phase: 'running' });

    // Soft-timeout watcher: flip to "slow" so the restart affordance appears,
    // but keep awaiting the real result (graceful path, §5.3).
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    slowTimerRef.current = setTimeout(() => {
      if (runTokenRef.current === token) {
        setRun((prev) => (prev.phase === 'running' ? { phase: 'slow' } : prev));
      }
    }, SOFT_TIMEOUT_MS);

    try {
      await pyHost.ensureRuntime();
      const result = await pyHost.runSnippet(code, SOFT_TIMEOUT_MS);
      if (runTokenRef.current !== token) return; // superseded
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
      setRun({ phase: 'done', result });

      // Completion check: only after a successful learner run, run the hidden
      // solutionTest; if it runs without raising (ok === true), mark complete.
      if (result.ok && solutionTest && solutionTest.trim() !== '') {
        try {
          const testResult = await pyHost.runSnippet(solutionTest, SOFT_TIMEOUT_MS);
          if (runTokenRef.current !== token) return;
          if (testResult.ok && !complete) {
            setComplete(true);
            onComplete?.();
          }
        } catch {
          // A failed/timed-out test simply does not mark complete; the learner's
          // own run output is unaffected.
        }
      }
    } catch (err) {
      if (runTokenRef.current !== token) return;
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
      setRun({
        phase: 'failed',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async function handleRestart() {
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    runTokenRef.current++; // invalidate the wedged run
    setRun({ phase: 'idle' });
    try {
      await pyHost.restart();
    } catch (err) {
      setRun({
        phase: 'failed',
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const runtimeLoading =
    runtime.state === 'loading-pyodide' || runtime.state === 'loading-bundle';

  return (
    <section
      className="my-4 rounded-lg border border-gray-300 p-3 dark:border-gray-700"
      data-widget="code-runner"
      data-complete={complete ? 'true' : 'false'}
      aria-label="Python code runner"
    >
      <Editor
        value={code}
        onChange={setCode}
        rows={rows}
        disabled={isBusy}
        ariaLabel="Python code editor"
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void handleRun()}
          disabled={isBusy}
          className="rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          {isBusy ? 'Running…' : 'Run'}
        </button>

        {runtimeLoading && (
          <span role="status" className="text-sm opacity-80">
            {runtime.phaseText ?? 'Loading Python runtime…'}
          </span>
        )}

        {complete && (
          <span className="text-sm font-medium text-green-700 dark:text-green-400">
            ✓ Complete
          </span>
        )}
      </div>

      {run.phase === 'slow' && (
        <div role="alert" className="mt-2 rounded border border-amber-400 bg-amber-50 p-2 text-sm dark:bg-amber-950/30">
          <p className="font-medium">Still running…</p>
          <p className="mt-1 opacity-80">
            This is taking longer than {SOFT_TIMEOUT_MS / 1000} seconds.
            {sabInterruptAvailable()
              ? ' You can wait, or restart the Python runtime.'
              : ' Interrupt is unavailable in this browser; you can restart the Python runtime.'}
          </p>
          <button
            type="button"
            onClick={() => void handleRestart()}
            className="mt-2 rounded bg-amber-600 px-3 py-1 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
          >
            Restart Python runtime
          </button>
        </div>
      )}

      {run.phase === 'failed' && (
        <div role="alert" className="mt-2 rounded border border-red-300 p-2 text-sm">
          <p className="font-medium">Couldn’t run</p>
          <p className="mt-1 opacity-80">{run.message}</p>
        </div>
      )}

      {/* Output panel — announced politely (§5.3 / FR-QUIZ-005 spirit). */}
      <div aria-live="polite" className="mt-2">
        {run.phase === 'done' && <OutputPanel result={run.result} />}
      </div>
    </section>
  );
}

function OutputPanel({ result }: { result: SnippetResult }) {
  const hasStdout = result.stdout !== '';
  const hasStderr = result.stderr !== '';
  const hasError = !!result.error;
  const empty = !hasStdout && !hasStderr && !hasError;

  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-2 font-mono text-xs dark:border-gray-700 dark:bg-gray-900">
      {hasStdout && (
        <pre className="whitespace-pre-wrap break-words" data-testid="cr-stdout">
          {result.stdout}
        </pre>
      )}
      {hasStderr && (
        <pre
          className="whitespace-pre-wrap break-words text-red-600 dark:text-red-400"
          data-testid="cr-stderr"
        >
          {result.stderr}
        </pre>
      )}
      {hasError && (
        <pre
          className="whitespace-pre-wrap break-words text-red-700 dark:text-red-400"
          data-testid="cr-error"
        >
          {result.error}
        </pre>
      )}
      {empty && (
        <p className="opacity-60" data-testid="cr-empty">
          {result.ok ? '(no output)' : '(no output — run failed)'}
        </p>
      )}
    </div>
  );
}
