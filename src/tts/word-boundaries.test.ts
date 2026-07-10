import { afterEach, describe, expect, it } from 'vitest';

import { extractSpeakableContent } from './extract-speakable-text';
import { findSegmentAt, segmentToRange } from './word-boundaries';
import type { SpeakableSegment } from './extract-speakable-text';

afterEach(() => {
  document.body.innerHTML = '';
});

function containerWith(html: string): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = html;
  document.body.appendChild(el);
  return el;
}

describe('findSegmentAt', () => {
  const segments: SpeakableSegment[] = [
    { text: 'One', start: 0, target: { kind: 'text', node: document.createTextNode('One'), nodeStart: 0 } },
    { text: 'two', start: 4, target: { kind: 'text', node: document.createTextNode('two'), nodeStart: 0 } },
    { text: 'three', start: 8, target: { kind: 'text', node: document.createTextNode('three'), nodeStart: 0 } },
  ];

  it('finds the segment containing a charIndex in its middle', () => {
    expect(findSegmentAt(segments, 5)?.text).toBe('two');
  });

  it('finds the segment when charIndex lands exactly on its start', () => {
    expect(findSegmentAt(segments, 8)?.text).toBe('three');
  });

  it('finds the segment when charIndex is inside the joining space (falls back to the preceding segment)', () => {
    expect(findSegmentAt(segments, 3)?.text).toBe('One');
  });

  it('returns null for an index before the first segment (should not happen, but must not throw)', () => {
    expect(findSegmentAt([], 0)).toBeNull();
  });

  it('finds the last segment for an index past the end', () => {
    expect(findSegmentAt(segments, 999)?.text).toBe('three');
  });
});

describe('segmentToRange', () => {
  it('builds a Range selecting exactly the word at charIndex/charLength within a text segment', () => {
    const el = containerWith('<p>Hello world</p>');
    const { segments } = extractSpeakableContent(el);
    const segment = segments[0]!; // "Hello world" — one segment, one text node

    // charIndex 6, charLength 5 -> "world"
    const range = segmentToRange(segment, 6, 5);
    expect(range).not.toBeNull();
    expect(range?.toString()).toBe('world');
  });

  it('builds a Range for the first word too', () => {
    const el = containerWith('<p>Hello world</p>');
    const { segments } = extractSpeakableContent(el);
    const segment = segments[0]!;
    const range = segmentToRange(segment, 0, 5);
    expect(range?.toString()).toBe('Hello');
  });

  it('selects the whole element for an element-target (humanized maths) segment regardless of charIndex', () => {
    const el = containerWith(
      `<span class="katex"><span class="katex-mathml"><math><semantics><annotation encoding="application/x-tex">x^2</annotation></semantics></math></span></span>`,
    );
    const { segments } = extractSpeakableContent(el);
    const segment = segments[0]!;
    const range = segmentToRange(segment, segment.start, 1);
    expect(range).not.toBeNull();
    expect(range?.commonAncestorContainer).toBeDefined();
  });

  it('returns null when the underlying node has been removed from the document', () => {
    const el = containerWith('<p>Hello world</p>');
    const { segments } = extractSpeakableContent(el);
    const segment = segments[0]!;
    el.remove();
    expect(segmentToRange(segment, 0, 5)).toBeNull();
  });

  it('clamps a charLength that would run past the end of the text node', () => {
    const el = containerWith('<p>Hi</p>');
    const { segments } = extractSpeakableContent(el);
    const segment = segments[0]!;
    const range = segmentToRange(segment, 0, 999);
    expect(range?.toString()).toBe('Hi');
  });
});
