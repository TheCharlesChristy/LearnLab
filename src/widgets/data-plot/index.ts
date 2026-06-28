// `data-plot` widget — SRS §5.3 (registry table row), FR-WID-001/003,
// NFR-PERF-001 (Recharts loads only inside the React.lazy chunk).
//
// This entry file stays Recharts-free: the implementation and its Recharts
// import live in the lazy chunk, keeping the entry bundle small.

import { lazy } from 'react';

import { defineWidget } from '../widget-def';
import type { ParsedProps, RawWidgetProps, WidgetDef } from '../widget-def';

export interface DataPlotProps {
  /** Module-relative JSON path describing the chart (required). */
  src: string;
}

export function parseProps(raw: RawWidgetProps): ParsedProps<DataPlotProps> {
  const errors: string[] = [];

  let src = '';
  if (typeof raw.src === 'string' && raw.src.trim() !== '') {
    src = raw.src;
  } else {
    errors.push('src: required — a path to a chart JSON file, e.g. src="data/growth.json"');
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, props: { src } };
}

export const def: WidgetDef = defineWidget<DataPlotProps>({
  component: lazy(() => import('./DataPlot')),
  parseProps,
});
