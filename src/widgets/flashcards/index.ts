// `flashcards` widget — SRS §5.3 (registry table row), FR-WID-001/003.
//
// Spaced-recall cards within a lesson: flip a card to reveal its back, then
// self-grade "Again" / "Good". Grades persist via LessonContext.setItemState
// (itemId `flashcards:${src}` — D-012); this entry file stays light, the
// implementation loads only in the React.lazy chunk (NFR-PERF-001).

import { lazy } from 'react';

import { defineWidget } from '../widget-def';
import type { ParsedProps, RawWidgetProps, WidgetDef } from '../widget-def';

export interface FlashcardsProps {
  /** Module-relative JSON path: { cards: [{ front, back }] } (required). */
  src: string;
}

export function parseProps(raw: RawWidgetProps): ParsedProps<FlashcardsProps> {
  const errors: string[] = [];

  let src = '';
  if (typeof raw.src === 'string' && raw.src.trim() !== '') {
    src = raw.src;
  } else {
    errors.push('src: required — a path to a cards JSON file, e.g. src="cards/unit1.json"');
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, props: { src } };
}

export const def: WidgetDef = defineWidget<FlashcardsProps>({
  component: lazy(() => import('./Flashcards')),
  parseProps,
});
