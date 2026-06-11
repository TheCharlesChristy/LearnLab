// `quiz` widget definition — SRS §5.3 (FR-WID-001/003).
// Props: src (required, module-relative quiz JSON), pick? (overrides file).
// The orchestrator wires `def` into src/widgets/registry.ts under key 'quiz'.

import { lazy } from 'react';

import { defineWidget } from '../widget-def';
import type { ParsedProps, RawWidgetProps, WidgetDef } from '../widget-def';
import type { QuizWidgetProps } from './QuizWidget';

export type { QuizWidgetProps } from './QuizWidget';

export function parseQuizWidgetProps(raw: RawWidgetProps): ParsedProps<QuizWidgetProps> {
  const errors: string[] = [];

  const src = raw.src;
  if (typeof src !== 'string' || src.trim() === '') {
    errors.push('src: required string (module-relative quiz JSON path)');
  }

  let pick: number | undefined;
  if (raw.pick !== undefined) {
    const value =
      typeof raw.pick === 'number'
        ? raw.pick
        : typeof raw.pick === 'string' && /^\d+$/.test(raw.pick.trim())
          ? Number(raw.pick.trim())
          : NaN;
    if (!Number.isInteger(value) || value < 1) {
      errors.push('pick: must be a positive integer');
    } else {
      pick = value;
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, props: { src: (src as string).trim(), pick } };
}

export const def: WidgetDef = defineWidget<QuizWidgetProps>({
  component: lazy(() => import('./QuizWidget')),
  parseProps: parseQuizWidgetProps,
});
