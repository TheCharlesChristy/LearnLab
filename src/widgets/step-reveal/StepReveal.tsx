// `step-reveal` implementation — multi-step worked solutions (SRS §5.3 row).
//
// Fetches a module-relative JSON file { steps: [{ title, body }] } where each
// body is Markdown, and reveals one step at a time via a real <button>
// ("Show next step"). When the final step is revealed the widget reports
// interaction-complete VISUALLY: an aria-live note announces "All steps
// revealed" and a data attribute (data-step-reveal-complete) is set. Per the
// task contract this widget does NOT import src/progress.
//
// Failure handling: network/HTTP failure → retry card; malformed JSON / bad
// shape → error card naming the problem (FR-CONT-006/007 spirit). The widget
// renders an inline card rather than throwing.
//
// Step bodies render through MarkdownInline (src/markdown public barrel), which
// disables raw HTML (skipHtml — FR-CONT-005 / NFR-SEC-002).

import { useContext, useEffect, useRef, useState } from 'react';

import { LessonContext } from '../../content';
import { MarkdownInline } from '../../markdown';

import type { StepRevealProps } from './index';

interface Step {
  title: string;
  body: string;
}

/** True for URLs that must not be re-based: scheme:, protocol-relative, root-relative. */
function isAbsoluteUrl(src: string): boolean {
  return /^(?:[a-z][a-z\d+\-.]*:|\/)/i.test(src);
}

/** Validate the fetched value into Step[], or throw an Error naming the problem. */
function parseSteps(value: unknown): Step[] {
  if (typeof value !== 'object' || value === null) {
    throw new Error('file must be a JSON object with a "steps" array');
  }
  const v = value as Record<string, unknown>;
  if (!Array.isArray(v.steps) || v.steps.length === 0) {
    throw new Error('steps: must be a non-empty array');
  }
  return v.steps.map((rawStep, i) => {
    if (typeof rawStep !== 'object' || rawStep === null) {
      throw new Error(`steps[${i}]: must be an object { title, body }`);
    }
    const s = rawStep as Record<string, unknown>;
    if (typeof s.title !== 'string' || s.title.trim() === '') {
      throw new Error(`steps[${i}].title: must be a non-empty string`);
    }
    if (typeof s.body !== 'string') {
      throw new Error(`steps[${i}].body: must be a Markdown string`);
    }
    return { title: s.title, body: s.body };
  });
}

type LoadState =
  | { status: 'loading' }
  | { status: 'fetch-error'; message: string }
  | { status: 'data-error'; message: string }
  | { status: 'ready'; steps: Step[] };

export default function StepReveal({ src }: StepRevealProps) {
  const ctx = useContext(LessonContext); // optional: null outside lesson routes
  const url =
    ctx && !isAbsoluteUrl(src) ? `${ctx.moduleBaseUrl}${src.replace(/^\.\//, '')}` : src;

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    void (async () => {
      let raw: unknown;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        raw = await res.json();
      } catch (err) {
        console.error(`[step-reveal] failed to load ${url}`, err);
        if (!cancelled) {
          setState({
            status: 'fetch-error',
            message: err instanceof Error ? err.message : String(err),
          });
        }
        return;
      }
      try {
        const steps = parseSteps(raw);
        if (!cancelled) setState({ status: 'ready', steps });
      } catch (err) {
        if (!cancelled) {
          setState({
            status: 'data-error',
            message: err instanceof Error ? err.message : String(err),
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url, reloadToken]);

  if (state.status === 'loading') {
    return (
      <div role="status" className="my-4 rounded-lg border p-4 text-sm opacity-80">
        Loading steps…
      </div>
    );
  }

  if (state.status === 'fetch-error') {
    return (
      <div role="alert" className="my-4 rounded-lg border border-red-300 p-4">
        <p className="font-medium">Couldn’t load steps</p>
        <p className="mt-1 text-sm opacity-80">
          {src}: {state.message}
        </p>
        <button
          type="button"
          onClick={() => setReloadToken((t) => t + 1)}
          className="mt-2 rounded bg-blue-600 px-3 py-1 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (state.status === 'data-error') {
    return (
      <div role="alert" className="my-4 rounded-lg border border-red-300 p-4">
        <p className="font-medium">Invalid steps data</p>
        <p className="mt-1 text-sm opacity-80">
          {src}: {state.message}
        </p>
      </div>
    );
  }

  return <Stepper steps={state.steps} />;
}

function Stepper({ steps }: { steps: Step[] }) {
  // Number of steps currently revealed; first step is shown immediately.
  const [revealed, setRevealed] = useState(1);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const lastStepRef = useRef<HTMLDivElement>(null);

  const allRevealed = revealed >= steps.length;

  function showNext() {
    setRevealed((n) => Math.min(n + 1, steps.length));
  }

  // Move focus to the newly revealed step heading for keyboard/screen-reader
  // continuity (NFR-A11Y-001). Skip the initial render.
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    lastStepRef.current?.focus();
  }, [revealed]);

  return (
    <section
      className="my-4 rounded-lg border p-4"
      aria-label="Worked solution, revealed step by step"
      data-step-reveal-complete={allRevealed ? 'true' : 'false'}
    >
      <ol className="space-y-4">
        {steps.slice(0, revealed).map((step, i) => (
          <li key={i}>
            <div
              ref={i === revealed - 1 ? lastStepRef : undefined}
              tabIndex={-1}
              className="outline-none"
            >
              <h4 className="font-medium">
                Step {i + 1}: {step.title}
              </h4>
              <div className="mt-1 text-sm">
                <MarkdownInline markdown={step.body} />
              </div>
            </div>
          </li>
        ))}
      </ol>

      {!allRevealed && (
        <button
          ref={nextButtonRef}
          type="button"
          onClick={showNext}
          className="mt-4 rounded bg-blue-600 px-3 py-1 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Show next step ({revealed} of {steps.length})
        </button>
      )}

      {/* Visual + assistive completion signal ("fully revealed state counts as
          interaction", SRS §5.3). No progress import. */}
      <p role="status" aria-live="polite" className="mt-4 text-sm font-medium text-green-700">
        {allRevealed ? 'All steps revealed' : ''}
      </p>
    </section>
  );
}
