// Walks a container's already-rendered DOM and flattens it into one
// offset-indexed speakable string, for the Web Speech API to read and for
// word-boundary events to be mapped back onto (./word-boundaries.ts).
// Operates entirely on rendered output — no changes to src/markdown's
// rendering pipeline — so it works identically for legacy Markdown lessons
// and every screens-format screen (both funnel through the same
// MarkdownInline/MarkdownLesson core, but this module doesn't need to know
// that; it just reads whatever's in the DOM right now).
//
// Skips: `pre[data-language]` code blocks entirely (read as raw syntax is
// worse than not read at all). A collapsed `:::reveal` needs no special
// handling — its content genuinely isn't in the DOM (see
// src/markdown/directives.tsx), so it's silently absent, which is correct:
// read-aloud only ever reads what's currently visible.
// Substitutes: KaTeX's embedded LaTeX source (every katex-rendered node
// carries `annotation[encoding="application/x-tex"]`) via ./humanize-latex,
// instead of vocalizing the visual glyphs or raw LaTeX syntax.

import { humanizeLatex } from './humanize-latex';

export type HighlightTarget =
  | { kind: 'text'; node: Text; nodeStart: number }
  | { kind: 'element'; element: Element };

export interface SpeakableSegment {
  /** The text this segment contributes to the speakable string (post-humanization for maths). */
  text: string;
  /** Offset of this segment's first character in the concatenated speakable string. */
  start: number;
  target: HighlightTarget;
}

export interface SpeakableContent {
  text: string;
  segments: SpeakableSegment[];
}

function isCodeBlock(el: Element): boolean {
  return el.tagName === 'PRE' && el.hasAttribute('data-language');
}

function isKatexRoot(el: Element): boolean {
  return el.classList.contains('katex');
}

interface WalkState {
  segments: SpeakableSegment[];
  parts: string[];
  offset: number;
}

function pushSegment(state: WalkState, text: string, target: HighlightTarget): void {
  if (text.length === 0) return;
  if (state.parts.length > 0) {
    state.parts.push(' ');
    state.offset += 1;
  }
  state.segments.push({ text, start: state.offset, target });
  state.parts.push(text);
  state.offset += text.length;
}

function walk(node: Node, state: WalkState): void {
  if (node.nodeType === Node.TEXT_NODE) {
    const full = node.textContent ?? '';
    const trimmed = full.trim();
    if (trimmed.length === 0) return;
    const nodeStart = full.length - full.trimStart().length;
    pushSegment(state, trimmed, { kind: 'text', node: node as Text, nodeStart });
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const el = node as Element;
  if (isCodeBlock(el)) return; // skip entirely, don't descend
  if (isKatexRoot(el)) {
    const annotation = el.querySelector('annotation[encoding="application/x-tex"]');
    const latex = annotation?.textContent?.trim();
    if (latex) pushSegment(state, humanizeLatex(latex), { kind: 'element', element: el });
    return; // never descend into katex internals (glyph-only markup, not real text)
  }
  for (const child of Array.from(node.childNodes)) walk(child, state);
}

/** Extract a speakable, offset-mapped flattening of everything currently rendered inside `container`. */
export function extractSpeakableContent(container: Element): SpeakableContent {
  const state: WalkState = { segments: [], parts: [], offset: 0 };
  walk(container, state);
  return { text: state.parts.join(''), segments: state.segments };
}
