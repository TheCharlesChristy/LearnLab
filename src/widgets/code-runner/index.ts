// `code-runner` widget — learner-typed Python executed in the Pyodide worker.
// SRS §5.3 (registry table row), FR-WID-001/003, FR-PY-001/004, NFR-SEC-002,
// NFR-PERF-001, C-6.
//
// This entry file stays free of CodeMirror and the src/python barrel: the
// implementation and its heavy imports (CodeMirror 6) live in the React.lazy
// chunk so they never reach the entry bundle (NFR-PERF-001). Only `parseProps`
// and the prop types are exported eagerly.

import { lazy } from 'react';

import { defineWidget } from '../widget-def';
import type { ParsedProps, RawWidgetProps, WidgetDef } from '../widget-def';

export interface CodeRunnerProps {
  /** v1 supports python only (§5.3). */
  language: 'python';
  /** Initial editor contents. */
  starter?: string;
  /**
   * Python snippet that, when it runs without raising after a successful learner
   * run, marks the widget complete (§5.3). Optional.
   */
  solutionTest?: string;
  /** Editor height in text rows. Default 10. */
  rows: number;
  /**
   * Optional completion hook the app shell may wire later. The widget itself
   * never imports src/progress (boundary §3.5); it surfaces completion via a
   * visible "✓ Complete" state + a `data-complete` attribute, and calls this
   * callback (default no-op) so the shell can record progress when ready.
   */
  onComplete?: () => void;
}

/**
 * Leaf directive attributes (§4.5) are single-line, so authors encode newlines
 * in `starter`/`solutionTest` as literal `\n` (and `\t`/`\\`) escape sequences —
 * see e.g. public/content/cs/alevel-cs/heaps/01-*.md. Without this step those
 * escapes reach the editor/output verbatim as backslash-n characters instead
 * of line breaks.
 */
const ESCAPES: Record<string, string> = { n: '\n', t: '\t', r: '\r', '\\': '\\' };
function unescapeMultiline(s: string): string {
  return s.replace(/\\(n|t|r|\\)/g, (_, c: string) => ESCAPES[c]!);
}

/**
 * Hand-rolled prop guard (no Zod, §5.3). Every error message names the offending
 * prop (FR-WID-003). Coerces `rows` from string→number; validates
 * language === "python" and rows as a positive integer.
 */
export function parseProps(raw: RawWidgetProps): ParsedProps<CodeRunnerProps> {
  const errors: string[] = [];

  // language — required, must be exactly "python" in v1.
  const language = raw.language;
  if (language !== 'python') {
    errors.push(
      `language: must be "python" (v1 supports python only) — got ${JSON.stringify(language)}`,
    );
  }

  // starter — optional string.
  let starter: string | undefined;
  if (raw.starter !== undefined) {
    if (typeof raw.starter === 'string') {
      starter = unescapeMultiline(raw.starter);
    } else {
      errors.push(`starter: must be a string if provided — got ${JSON.stringify(raw.starter)}`);
    }
  }

  // solutionTest — optional string.
  let solutionTest: string | undefined;
  if (raw.solutionTest !== undefined) {
    if (typeof raw.solutionTest === 'string') {
      solutionTest = unescapeMultiline(raw.solutionTest);
    } else {
      errors.push(
        `solutionTest: must be a string if provided — got ${JSON.stringify(raw.solutionTest)}`,
      );
    }
  }

  // rows — optional, default 10; coerce string→number; positive integer.
  let rows = 10;
  if (raw.rows !== undefined) {
    const n = typeof raw.rows === 'number' ? raw.rows : Number(String(raw.rows).trim());
    if (!Number.isInteger(n) || n <= 0) {
      errors.push(
        `rows: must be a positive integer — got ${JSON.stringify(raw.rows)}`,
      );
    } else {
      rows = n;
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    props: { language: 'python', starter, solutionTest, rows },
  };
}

export const def: WidgetDef = defineWidget<CodeRunnerProps>({
  component: lazy(() => import('./CodeRunner')),
  parseProps,
});
