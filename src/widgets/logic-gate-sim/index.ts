// `logic-gate-sim` widget — SRS §5.3 (registry table row), FR-WID-001/003.
//
// Interactive AND/OR/NOT/XOR/NAND/NOR circuits with toggleable inputs, live
// propagation, and a truth-table side panel. This entry file stays light:
// the implementation loads only in the React.lazy chunk (NFR-PERF-001).

import { lazy } from 'react';

import { defineWidget } from '../widget-def';
import type { ParsedProps, RawWidgetProps, WidgetDef } from '../widget-def';

export interface LogicGateSimProps {
  /** Module-relative circuit JSON path: { inputs, gates, outputs } (required). */
  src: string;
}

export function parseProps(raw: RawWidgetProps): ParsedProps<LogicGateSimProps> {
  const errors: string[] = [];

  let src = '';
  if (typeof raw.src === 'string' && raw.src.trim() !== '') {
    src = raw.src;
  } else {
    errors.push('src: required — a path to a circuit JSON file, e.g. src="circuits/and-or.json"');
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, props: { src } };
}

export const def: WidgetDef = defineWidget<LogicGateSimProps>({
  component: lazy(() => import('./LogicGateSim')),
  parseProps,
});
