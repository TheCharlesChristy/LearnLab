// `truth-table` widget — SRS §5.3 (roadmap row: "P3 widget candidates ...
// truth-table"), BUILD_PLAN.md Phase P6 / D-024, FR-WID-001/003.
//
// Given a boolean **expression string** (e.g. "A AND (B OR NOT C)"), parses
// and evaluates it to render the full truth table. Complementary to
// `logic-gate-sim` (which takes a wired circuit JSON of gates/connections),
// not a duplicate of it — this widget has no circuit/diagram, just a plain
// expression typed by the content author. This entry file stays free of the
// parser/renderer: the implementation loads only in the React.lazy chunk
// (NFR-PERF-001).

import { lazy } from 'react';

import { defineWidget } from '../widget-def';
import type { ParsedProps, RawWidgetProps, WidgetDef } from '../widget-def';

export interface TruthTableProps {
  /** Boolean expression, e.g. "A AND (B OR NOT C)". See ./expression.ts for the grammar. */
  expr: string;
  /** Safety cap on distinct variables (2^maxInputs rows). Default 6, mirrors logic-gate-sim's cap. */
  maxInputs?: number;
}

export function parseProps(raw: RawWidgetProps): ParsedProps<TruthTableProps> {
  const errors: string[] = [];

  let expr = '';
  if (typeof raw.expr === 'string' && raw.expr.trim() !== '') {
    expr = raw.expr;
  } else {
    errors.push(
      'expr: required — a non-empty boolean expression, e.g. expr="A AND (B OR NOT C)"',
    );
  }

  let maxInputs = 6;
  if (raw.maxInputs !== undefined) {
    const n =
      typeof raw.maxInputs === 'number' ? raw.maxInputs : Number(String(raw.maxInputs).trim());
    if (!Number.isInteger(n) || n <= 0) {
      errors.push(`maxInputs: must be a positive integer — got ${JSON.stringify(raw.maxInputs)}`);
    } else {
      maxInputs = n;
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, props: { expr, maxInputs } };
}

export const def: WidgetDef = defineWidget<TruthTableProps>({
  component: lazy(() => import('./TruthTable')),
  parseProps,
});
