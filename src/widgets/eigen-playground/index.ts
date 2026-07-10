// `eigen-playground` widget — interactive eigen-decomposition of a symmetric
// 2x2 matrix [[a,b],[b,c]] (a covariance-matrix shape). `a` and `c` are fixed
// per-instance (the axis variances); the learner drags a single scalar `b`
// (the covariance/off-diagonal term) and watches the principal eigenvector
// angle and the ellipse it draws rotate live, closed-form (no numeric
// eigensolver needed for 2x2 symmetric matrices — NFR-PERF-001).
//
// This entry file stays dependency-light: the SVG/drag implementation loads
// only inside the React.lazy chunk.

import { lazy } from 'react';

import { defineWidget } from '../widget-def';
import type { ParsedProps, RawWidgetProps, WidgetDef } from '../widget-def';

export interface EigenPlaygroundProps {
  /** Fixed variance along x (diagonal entry a of [[a,b],[b,c]]). Must be > 0. */
  a: number;
  /** Fixed variance along y (diagonal entry c). Must be > 0. */
  c: number;
  /** Lower bound of the draggable off-diagonal term b. */
  bMin: number;
  /** Upper bound of the draggable off-diagonal term b. */
  bMax: number;
  /** Starting value of b. Defaults to the midpoint of [bMin, bMax]. */
  bInit?: number;
  /** Show a scatter cloud of sample points drawn from the implied covariance. */
  showPoints: boolean;
  /**
   * Screens engine hook (manipulable-target): fires with the live
   * eigen-decomposition whenever b changes. Optional — content authored via
   * the `::widget` directive never sets this.
   */
  onEigenChange?: (info: {
    b: number;
    angleDeg: number;
    eigenvalues: [number, number];
  }) => void;
}

function asFiniteNumber(value: string | number | boolean): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function readNumber(raw: RawWidgetProps, name: string, errors: string[]): number | undefined {
  const value = raw[name];
  if (value === undefined) return undefined;
  const n = asFiniteNumber(value);
  if (n === undefined) {
    errors.push(`${name}: must be a finite number (got ${JSON.stringify(value)})`);
  }
  return n;
}

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

export function parseProps(raw: RawWidgetProps): ParsedProps<EigenPlaygroundProps> {
  const errors: string[] = [];

  const aRead = readNumber(raw, 'a', errors);
  const a = aRead ?? 2;
  if ((raw.a === undefined || aRead !== undefined) && a <= 0) {
    errors.push(`a: must be greater than 0 (got ${a})`);
  }

  const cRead = readNumber(raw, 'c', errors);
  const c = cRead ?? 1;
  if ((raw.c === undefined || cRead !== undefined) && c <= 0) {
    errors.push(`c: must be greater than 0 (got ${c})`);
  }

  const bMinRead = readNumber(raw, 'bMin', errors);
  const bMaxRead = readNumber(raw, 'bMax', errors);
  const bMin = bMinRead ?? -1.5;
  const bMax = bMaxRead ?? 1.5;
  const bBoundsOk =
    (raw.bMin === undefined || bMinRead !== undefined) &&
    (raw.bMax === undefined || bMaxRead !== undefined);
  if (bBoundsOk && bMin >= bMax) {
    errors.push(`bMin: must be less than bMax (got bMin=${bMin}, bMax=${bMax})`);
  }

  const bInitRead = readNumber(raw, 'bInit', errors);
  let bInit = bInitRead ?? (bMin + bMax) / 2;
  if (bBoundsOk && bInitRead !== undefined && (bInit < bMin || bInit > bMax)) {
    errors.push(`bInit: must be within [bMin, bMax] (got bInit=${bInit}, range=[${bMin}, ${bMax}])`);
  }
  if (!(bInit >= bMin && bInit <= bMax)) bInit = (bMin + bMax) / 2;

  const showPoints = readBoolean(raw, 'showPoints', true, errors);

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, props: { a, c, bMin, bMax, bInit, showPoints } };
}

export const def: WidgetDef = defineWidget<EigenPlaygroundProps>({
  component: lazy(() => import('./EigenPlayground')),
  parseProps,
});
