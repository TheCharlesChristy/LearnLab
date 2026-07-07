// `step-reveal` widget — SRS §5.3 (registry table row), FR-WID-001/003.
//
// Multi-step worked-solution disclosure. This entry file stays light: the
// implementation (and its Markdown pipeline) loads only in the React.lazy
// chunk (NFR-PERF-001).

import { lazy } from 'react';

import { defineWidget } from '../widget-def';
import type { ParsedProps, RawWidgetProps, WidgetDef } from '../widget-def';

export interface StepRevealProps {
  /** Module-relative JSON path: { steps: [{ title, body }] } (required). */
  src: string;
}

export function parseProps(raw: RawWidgetProps): ParsedProps<StepRevealProps> {
  const errors: string[] = [];

  let src = '';
  if (typeof raw.src === 'string' && raw.src.trim() !== '') {
    src = raw.src;
  } else {
    errors.push('src: required — a path to a steps JSON file, e.g. src="steps/solution.json"');
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, props: { src } };
}

export const def: WidgetDef = defineWidget<StepRevealProps>({
  component: lazy(() => import('./StepReveal')),
  parseProps,
});
