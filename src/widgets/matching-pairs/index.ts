// `matching-pairs` widget — SRS §5.3 (registry table row), FR-WID-001/003.
//
// A click/tap-to-select matching game: pick a term on the left, then its
// match on the right. Deliberately NOT HTML5 drag-and-drop (D-028) — native
// drag-and-drop isn't keyboard- or screen-reader-operable without
// substantial extra engineering, while click-to-select gets full a11y for
// free from ordinary <button> semantics. This entry file stays light; the
// implementation loads only in the React.lazy chunk (NFR-PERF-001).

import { lazy } from 'react';

import { defineWidget } from '../widget-def';
import type { ParsedProps, RawWidgetProps, WidgetDef } from '../widget-def';

export interface MatchingPairsProps {
  /** Module-relative JSON path: { title?, instructions?, pairs: [{ left, right }] } (required). */
  src: string;
}

export function parseProps(raw: RawWidgetProps): ParsedProps<MatchingPairsProps> {
  const errors: string[] = [];

  let src = '';
  if (typeof raw.src === 'string' && raw.src.trim() !== '') {
    src = raw.src;
  } else {
    errors.push(
      'src: required — a path to a matching-pairs JSON file, e.g. src="cards/key-terms.json"',
    );
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, props: { src } };
}

export const def: WidgetDef = defineWidget<MatchingPairsProps>({
  component: lazy(() => import('./MatchingPairs')),
  parseProps,
});
