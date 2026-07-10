import { afterEach, describe, expect, it } from 'vitest';

import { extractSpeakableContent } from './extract-speakable-text';

function container(html: string): HTMLElement {
  const el = document.createElement('div');
  el.innerHTML = html;
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('extractSpeakableContent', () => {
  it('flattens plain text across elements, joined with single spaces', () => {
    const { text } = extractSpeakableContent(container('<p>Hello</p><p>world</p>'));
    expect(text).toBe('Hello world');
  });

  it('skips whitespace-only text nodes', () => {
    const { text } = extractSpeakableContent(
      container('<div>  <p>One</p>\n  <p>Two</p>  </div>'),
    );
    expect(text).toBe('One Two');
  });

  it('preserves inline formatting text (bold/italic) as plain words', () => {
    const { text } = extractSpeakableContent(
      container('<p>The <strong>derivative</strong> is <em>exact</em>.</p>'),
    );
    expect(text).toBe('The derivative is exact .');
  });

  it('skips code blocks entirely', () => {
    const { text } = extractSpeakableContent(
      container(
        '<p>Before.</p><pre data-language="python"><code>def f(x): return x**2</code></pre><p>After.</p>',
      ),
    );
    expect(text).toBe('Before. After.');
  });

  it('substitutes humanized LaTeX for a katex node instead of its rendered glyphs', () => {
    const el = container(
      `<p>The derivative is <span class="katex"><span class="katex-mathml"><math><semantics><mrow><mi>x</mi></mrow><annotation encoding="application/x-tex">x^2</annotation></semantics></math></span><span class="katex-html">x&sup2;</span></span>.</p>`,
    );
    const { text, segments } = extractSpeakableContent(el);
    expect(text).toBe('The derivative is x squared .');
    const katexSegment = segments.find((s) => s.target.kind === 'element');
    expect(katexSegment?.text).toBe('x squared');
  });

  it('does not descend into a katex node (no duplicate/glyph text picked up)', () => {
    const el = container(
      `<span class="katex"><span class="katex-mathml"><math><semantics><annotation encoding="application/x-tex">2x</annotation></semantics></math></span><span class="katex-html"><span class="mord">2</span><span class="mord">x</span></span></span>`,
    );
    const { segments } = extractSpeakableContent(el);
    expect(segments).toHaveLength(1);
    expect(segments[0]?.text).toBe('2x'); // "2x" has no ^, so humanizeLatex passes it through unchanged
  });

  it('produces segments whose offsets line up with the flattened text', () => {
    const { text, segments } = extractSpeakableContent(container('<p>One two</p><p>three</p>'));
    expect(text).toBe('One two three');
    for (const segment of segments) {
      expect(text.slice(segment.start, segment.start + segment.text.length)).toBe(segment.text);
    }
  });

  it('returns empty content for an empty container', () => {
    const { text, segments } = extractSpeakableContent(container(''));
    expect(text).toBe('');
    expect(segments).toHaveLength(0);
  });

  it('text segments map back to their real DOM Text node', () => {
    const el = container('<p>Hello world</p>');
    const { segments } = extractSpeakableContent(el);
    expect(segments).toHaveLength(1);
    const target = segments[0]?.target;
    expect(target?.kind).toBe('text');
    if (target?.kind === 'text') {
      expect(target.node.textContent).toBe('Hello world');
      expect(target.node.parentElement?.tagName).toBe('P');
    }
  });
});
