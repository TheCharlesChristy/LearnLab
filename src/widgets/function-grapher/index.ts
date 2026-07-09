// `function-grapher` widget — SRS §5.3 (registry table row), FR-WID-001/003,
// NFR-SEC-002 (mathjs compile only), NFR-A11Y-001, NFR-PERF-001.
//
// This entry file stays mathjs-free: the implementation (and its mathjs
// subset) loads only inside the React.lazy chunk (NFR-PERF-001).

import { lazy } from 'react';

import { defineWidget } from '../widget-def';
import type { ParsedProps, RawWidgetProps, WidgetDef } from '../widget-def';

export interface FunctionGrapherProps {
  /** Expression in x, parsed by mathjs `compile` (never eval — NFR-SEC-002). */
  expr: string;
  xmin: number;
  xmax: number;
  /** Auto-derived from sampled values when absent. */
  ymin?: number;
  ymax?: number;
  /** Draggable tangent point with gradient readout. */
  tangent: boolean;
  grid: boolean;
  /**
   * Screens engine hook (Brilliant rewrite Phase 1, docs/BRILLIANT_REWRITE_PLAN.md):
   * fires with the live tangent position whenever it changes. Optional —
   * content authored via the `::widget` directive never sets this; only the
   * `manipulable-target` screen type (src/screens/ManipulableTargetScreen.tsx)
   * passes it, to check a goal against the live gradient.
   */
  onTangentChange?: (info: { x: number; gradient: number | null }) => void;
}

/** Coerce a raw directive attribute to a finite number, else undefined. */
function asFiniteNumber(value: string | number | boolean): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/** Read an optional numeric prop; pushes an error naming the prop (FR-WID-003). */
function readNumber(raw: RawWidgetProps, name: string, errors: string[]): number | undefined {
  const value = raw[name];
  if (value === undefined) return undefined;
  const n = asFiniteNumber(value);
  if (n === undefined) {
    errors.push(`${name}: must be a finite number (got ${JSON.stringify(value)})`);
  }
  return n;
}

/** Read an optional boolean prop; pushes an error naming the prop (FR-WID-003). */
function readBoolean(
  raw: RawWidgetProps,
  name: string,
  fallback: boolean,
  errors: string[],
): boolean {
  const value = raw[name];
  if (value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  errors.push(`${name}: must be true or false (got ${JSON.stringify(value)})`);
  return fallback;
}

export function parseProps(raw: RawWidgetProps): ParsedProps<FunctionGrapherProps> {
  const errors: string[] = [];

  let expr = '';
  if (typeof raw.expr === 'string' && raw.expr.trim() !== '') {
    expr = raw.expr;
  } else {
    errors.push('expr: required — a non-empty expression in x, e.g. expr="x^2"');
  }

  const xminRead = readNumber(raw, 'xmin', errors);
  const xmaxRead = readNumber(raw, 'xmax', errors);
  const xmin = xminRead ?? -10;
  const xmax = xmaxRead ?? 10;
  // Only meaningful when neither bound already failed numeric validation.
  if ((raw.xmin === undefined || xminRead !== undefined) &&
      (raw.xmax === undefined || xmaxRead !== undefined) &&
      xmin >= xmax) {
    errors.push(`xmin: must be less than xmax (got xmin=${xmin}, xmax=${xmax})`);
  }

  const ymin = readNumber(raw, 'ymin', errors);
  const ymax = readNumber(raw, 'ymax', errors);
  if (ymin !== undefined && ymax !== undefined && ymin >= ymax) {
    errors.push(`ymin: must be less than ymax (got ymin=${ymin}, ymax=${ymax})`);
  }

  const tangent = readBoolean(raw, 'tangent', false, errors);
  const grid = readBoolean(raw, 'grid', true, errors);

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, props: { expr, xmin, xmax, ymin, ymax, tangent, grid } };
}

export const def: WidgetDef = defineWidget<FunctionGrapherProps>({
  component: lazy(() => import('./FunctionGrapher')),
  parseProps,
});
