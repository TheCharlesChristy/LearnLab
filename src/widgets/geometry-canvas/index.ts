// `geometry-canvas` widget — SRS §13 roadmap / docs/BUILD_PLAN.md Phase P6
// (decision D-024), FR-WID-001/003, NFR-A11Y-001.
//
// Interactive 2D geometry construction: points, lines and circles defined by
// a small JSON scene description (module-relative `src`), with `draggable`
// points that recompute any lines/circles defined in terms of them. This
// entry file stays light: the SVG/drag implementation loads only in the
// React.lazy chunk (NFR-PERF-001).

import { lazy } from 'react';

import { defineWidget } from '../widget-def';
import type { ParsedProps, RawWidgetProps, WidgetDef } from '../widget-def';

export interface GeometryCanvasProps {
  /** Module-relative geometry scene JSON path: { bounds, points, lines?, circles? } (required). */
  src: string;
  /** Rendered width in CSS pixels. Default 480. */
  width: number;
  /** Rendered height in CSS pixels. Default 480. */
  height: number;
}

/** Read an optional positive-number prop; pushes an error naming the prop (FR-WID-003). */
function readPositiveNumber(
  raw: RawWidgetProps,
  name: string,
  fallback: number,
  errors: string[],
): number {
  const value = raw[name];
  if (value === undefined) return fallback;
  const n = typeof value === 'number' ? value : Number(value);
  if (typeof value === 'boolean' || !Number.isFinite(n) || n <= 0) {
    errors.push(`${name}: must be a positive number of pixels (got ${JSON.stringify(value)})`);
    return fallback;
  }
  return n;
}

export function parseProps(raw: RawWidgetProps): ParsedProps<GeometryCanvasProps> {
  const errors: string[] = [];

  let src = '';
  if (typeof raw.src === 'string' && raw.src.trim() !== '') {
    src = raw.src;
  } else {
    errors.push(
      'src: required — a path to a geometry scene JSON file, e.g. src="scenes/triangle.json"',
    );
  }

  const width = readPositiveNumber(raw, 'width', 480, errors);
  const height = readPositiveNumber(raw, 'height', 480, errors);

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, props: { src, width, height } };
}

export const def: WidgetDef = defineWidget<GeometryCanvasProps>({
  component: lazy(() => import('./GeometryCanvas')),
  parseProps,
});
