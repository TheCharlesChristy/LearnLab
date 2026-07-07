// `vector-field` widget — SRS §5.3 roadmap row (Phase ≥ P3 candidate, now
// pinned by BUILD_PLAN.md D-024), FR-WID-001/003, NFR-SEC-002 (mathjs
// `compile` only, never eval), NFR-A11Y-001, NFR-PERF-001.
//
// Plots a 2D vector field: an arrow grid over [xmin,xmax]x[ymin,ymax] where
// each arrow's direction/length comes from evaluating two mathjs expressions
// `fx(x,y)` and `fy(x,y)` at that grid point.
//
// This entry file stays mathjs-free: the implementation (and its mathjs
// subset) loads only inside the React.lazy chunk (NFR-PERF-001).

import { lazy } from 'react';

import { defineWidget } from '../widget-def';
import type { ParsedProps, RawWidgetProps, WidgetDef } from '../widget-def';

export interface VectorFieldProps {
  /** Expression in x, y for the field's x-component, e.g. "y" or "-x". Parsed by mathjs `compile`. */
  fx: string;
  /** Expression in x, y for the field's y-component, e.g. "-x" or "y". Parsed by mathjs `compile`. */
  fy: string;
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
  /** Grid spacing between arrows. Must be > 0 and give at least a 2x2 grid. */
  step: number;
  /** Visual arrow-length multiplier on top of the auto-normalized size. */
  scale: number;
  /** Show background gridlines. */
  grid: boolean;
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

export function parseProps(raw: RawWidgetProps): ParsedProps<VectorFieldProps> {
  const errors: string[] = [];

  let fx = '';
  if (typeof raw.fx === 'string' && raw.fx.trim() !== '') {
    fx = raw.fx;
  } else {
    errors.push('fx: required — a non-empty expression in x, y, e.g. fx="y"');
  }

  let fy = '';
  if (typeof raw.fy === 'string' && raw.fy.trim() !== '') {
    fy = raw.fy;
  } else {
    errors.push('fy: required — a non-empty expression in x, y, e.g. fy="-x"');
  }

  const xminRead = readNumber(raw, 'xmin', errors);
  const xmaxRead = readNumber(raw, 'xmax', errors);
  const xmin = xminRead ?? -5;
  const xmax = xmaxRead ?? 5;
  // Only meaningful when neither bound already failed numeric validation.
  const xBoundsOk =
    (raw.xmin === undefined || xminRead !== undefined) &&
    (raw.xmax === undefined || xmaxRead !== undefined);
  if (xBoundsOk && xmin >= xmax) {
    errors.push(`xmin: must be less than xmax (got xmin=${xmin}, xmax=${xmax})`);
  }

  const yminRead = readNumber(raw, 'ymin', errors);
  const ymaxRead = readNumber(raw, 'ymax', errors);
  const ymin = yminRead ?? -5;
  const ymax = ymaxRead ?? 5;
  const yBoundsOk =
    (raw.ymin === undefined || yminRead !== undefined) &&
    (raw.ymax === undefined || ymaxRead !== undefined);
  if (yBoundsOk && ymin >= ymax) {
    errors.push(`ymin: must be less than ymax (got ymin=${ymin}, ymax=${ymax})`);
  }

  const stepRead = readNumber(raw, 'step', errors);
  const step = stepRead ?? 1;
  const stepOk = raw.step === undefined || stepRead !== undefined;
  if (stepOk) {
    if (step <= 0) {
      errors.push(`step: must be greater than 0 (got ${step})`);
    } else {
      if (xBoundsOk && xmin < xmax && (xmax - xmin) / step < 1) {
        errors.push(
          `step: too large — must give at least 2 grid points across x (got step=${step}, x range=${xmax - xmin})`,
        );
      }
      if (yBoundsOk && ymin < ymax && (ymax - ymin) / step < 1) {
        errors.push(
          `step: too large — must give at least 2 grid points across y (got step=${step}, y range=${ymax - ymin})`,
        );
      }
    }
  }

  const scaleRead = readNumber(raw, 'scale', errors);
  const scale = scaleRead ?? 1;
  const scaleOk = raw.scale === undefined || scaleRead !== undefined;
  if (scaleOk && scale <= 0) {
    errors.push(`scale: must be greater than 0 (got ${scale})`);
  }

  const grid = readBoolean(raw, 'grid', true, errors);

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, props: { fx, fy, xmin, xmax, ymin, ymax, step, scale, grid } };
}

export const def: WidgetDef = defineWidget<VectorFieldProps>({
  component: lazy(() => import('./VectorField')),
  parseProps,
});
