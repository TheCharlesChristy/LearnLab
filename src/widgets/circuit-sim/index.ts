// `circuit-sim` widget — SRS §5.3 (registry table row, roadmap §13 P3
// candidate), FR-WID-001/003, D-024.
//
// Simple analog DC circuit calculator: one voltage source plus resistors
// wired in series and/or parallel (a restricted series/parallel tree, NOT a
// general SPICE-like solver — see D-0xx writeup in docs/WIDGETS.md). This is
// the analog counterpart to `logic-gate-sim`. This entry file stays light:
// the implementation loads only in the React.lazy chunk (NFR-PERF-001).

import { lazy } from 'react';

import { defineWidget } from '../widget-def';
import type { ParsedProps, RawWidgetProps, WidgetDef } from '../widget-def';

export interface CircuitSimProps {
  /** Module-relative circuit JSON path: { voltage, circuit } (required). */
  src: string;
}

export function parseProps(raw: RawWidgetProps): ParsedProps<CircuitSimProps> {
  const errors: string[] = [];

  let src = '';
  if (typeof raw.src === 'string' && raw.src.trim() !== '') {
    src = raw.src;
  } else {
    errors.push('src: required — a path to a circuit JSON file, e.g. src="circuits/series-parallel.json"');
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, props: { src } };
}

export const def: WidgetDef = defineWidget<CircuitSimProps>({
  component: lazy(() => import('./CircuitSim')),
  parseProps,
});
