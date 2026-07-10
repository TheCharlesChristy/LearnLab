// Visually highlights a DOM Range for the read-aloud feature. Prefers the
// CSS Custom Highlight API (`CSS.highlights`) — zero DOM mutation, respects
// text wrapping/line breaks natively, one `Highlight` object whose Range is
// simply swapped each word. Falls back, on browsers without it (older
// Safari/Firefox), to a positioned overlay computed from
// `Range.getClientRects()`: also zero mutation of the actual text nodes, so
// repeated highlight/clear calls can never corrupt the underlying content
// the segment map (./word-boundaries.ts) refers to — unlike a
// `Range.surroundContents()`-based approach, which would.
//
// The corresponding `::highlight(learnlab-read-aloud)` style lives in
// src/index.css (a pseudo-element selector, not stylable via inline props
// or Tailwind's dark: variant — see the CSS file for the class-strategy
// dark-mode override).

export const HIGHLIGHT_NAME = 'learnlab-read-aloud';

function supportsCssHighlights(): boolean {
  return (
    typeof CSS !== 'undefined' &&
    'highlights' in CSS &&
    typeof (globalThis as { Highlight?: unknown }).Highlight === 'function'
  );
}

export interface HighlightController {
  /** Highlight this range, replacing any previous highlight. Pass null to clear. */
  set(range: Range | null): void;
  /** Remove any active highlight without tearing down the controller. */
  clear(): void;
  /** Release all resources (overlay element / registered Highlight). Call on unmount. */
  destroy(): void;
}

function createCssHighlightController(): HighlightController {
  const highlight = new Highlight();
  CSS.highlights.set(HIGHLIGHT_NAME, highlight);
  return {
    set(range) {
      highlight.clear();
      if (range) highlight.add(range);
    },
    clear() {
      highlight.clear();
    },
    destroy() {
      highlight.clear();
      CSS.highlights.delete(HIGHLIGHT_NAME);
    },
  };
}

function createOverlayHighlightController(overlayHost: HTMLElement): HighlightController {
  const overlay = document.createElement('div');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.position = 'absolute';
  overlay.style.inset = '0';
  overlay.style.pointerEvents = 'none';
  overlay.style.overflow = 'visible';
  const previousPosition = overlayHost.style.position;
  if (getComputedStyle(overlayHost).position === 'static') {
    overlayHost.style.position = 'relative';
  }
  overlayHost.appendChild(overlay);

  return {
    set(range) {
      overlay.replaceChildren();
      if (!range || typeof range.getClientRects !== 'function') return;
      const hostRect = overlayHost.getBoundingClientRect();
      for (const rect of Array.from(range.getClientRects())) {
        if (rect.width === 0 || rect.height === 0) continue;
        const box = document.createElement('div');
        box.style.position = 'absolute';
        box.style.left = `${rect.left - hostRect.left}px`;
        box.style.top = `${rect.top - hostRect.top}px`;
        box.style.width = `${rect.width}px`;
        box.style.height = `${rect.height}px`;
        box.className = 'rounded-sm bg-amber-300/60 dark:bg-amber-400/40';
        overlay.appendChild(box);
      }
    },
    clear() {
      overlay.replaceChildren();
    },
    destroy() {
      overlay.remove();
      overlayHost.style.position = previousPosition;
    },
  };
}

/** `overlayHost` is only used by the fallback path (ignored when the CSS Custom Highlight API is available). */
export function createHighlightController(overlayHost: HTMLElement): HighlightController {
  return supportsCssHighlights()
    ? createCssHighlightController()
    : createOverlayHighlightController(overlayHost);
}
