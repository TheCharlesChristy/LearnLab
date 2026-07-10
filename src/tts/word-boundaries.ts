// Maps a SpeechSynthesisUtterance `boundary` event's `charIndex`/`charLength`
// (an offset into the speakable string from ./extract-speakable-text.ts)
// back to a DOM Range suitable for highlighting.

import type { SpeakableSegment } from './extract-speakable-text';

/** Find the segment containing `charIndex` (segments are ordered, non-overlapping, sorted by `start`). */
export function findSegmentAt(
  segments: readonly SpeakableSegment[],
  charIndex: number,
): SpeakableSegment | null {
  let lo = 0;
  let hi = segments.length - 1;
  let result: SpeakableSegment | null = null;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const segment = segments[mid];
    if (segment !== undefined && segment.start <= charIndex) {
      result = segment;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return result;
}

/**
 * Build a DOM Range for the word starting at `charIndex` (length `charLength`)
 * within `segment`. For a `text` target this selects the precise substring of
 * the underlying text node; for an `element` target (a humanized maths block
 * with no 1:1 character mapping to source DOM text) the whole element is
 * selected as one highlighted unit, regardless of `charIndex`/`charLength`
 * precision within it. Returns null if the segment's node is no longer
 * attached to the document (e.g. the screen advanced mid-utterance).
 */
export function segmentToRange(
  segment: SpeakableSegment,
  charIndex: number,
  charLength: number,
): Range | null {
  if (segment.target.kind === 'element') {
    if (!segment.target.element.isConnected) return null;
    const range = document.createRange();
    try {
      range.selectNode(segment.target.element);
      return range;
    } catch {
      return null;
    }
  }

  const { node, nodeStart } = segment.target;
  if (!node.isConnected) return null;
  const nodeLength = node.textContent?.length ?? 0;
  const localOffset = Math.max(0, charIndex - segment.start);
  const start = Math.min(nodeLength, nodeStart + localOffset);
  const end = Math.min(nodeLength, Math.max(start + 1, start + Math.max(1, charLength)));
  if (start >= nodeLength) return null;
  try {
    const range = document.createRange();
    range.setStart(node, start);
    range.setEnd(node, end);
    return range;
  } catch {
    return null;
  }
}
