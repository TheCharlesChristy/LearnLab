// `figure` widget — SRS §5.3 (registry table row), FR-WID-001/003.
// `alt` is enforced by validation (NFR-A11Y-001): parseProps rejects a
// missing/empty alt with a message naming the prop.

import { lazy } from 'react';

import { defineWidget } from '../widget-def';
import type { ParsedProps, RawWidgetProps, WidgetDef } from '../widget-def';

export interface FigureProps {
  /** Image URL; relative paths resolve against the lesson's moduleBaseUrl. */
  src: string;
  /** Required alternative text (SRS §5.3: "alt enforced by validation"). */
  alt: string;
  caption?: string;
  /** Rendered width in CSS pixels. */
  width?: number;
}

export function parseProps(raw: RawWidgetProps): ParsedProps<FigureProps> {
  const errors: string[] = [];

  let src = '';
  if (typeof raw.src === 'string' && raw.src.trim() !== '') {
    src = raw.src;
  } else {
    errors.push('src: required — an image path or URL, e.g. src="images/circuit.png"');
  }

  let alt = '';
  if (typeof raw.alt === 'string' && raw.alt.trim() !== '') {
    alt = raw.alt;
  } else {
    errors.push('alt: required — describe the image for screen-reader users (NFR-A11Y-001)');
  }

  let caption: string | undefined;
  if (raw.caption !== undefined) {
    if (typeof raw.caption === 'string') {
      caption = raw.caption;
    } else {
      errors.push(`caption: must be a string (got ${JSON.stringify(raw.caption)})`);
    }
  }

  let width: number | undefined;
  if (raw.width !== undefined) {
    const n = typeof raw.width === 'number' ? raw.width : Number(raw.width);
    if (typeof raw.width !== 'boolean' && Number.isFinite(n) && n > 0) {
      width = n;
    } else {
      errors.push(`width: must be a positive number of pixels (got ${JSON.stringify(raw.width)})`);
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, props: { src, alt, caption, width } };
}

export const def: WidgetDef = defineWidget<FigureProps>({
  component: lazy(() => import('./Figure')),
  parseProps,
});
