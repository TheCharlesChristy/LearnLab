import { afterEach, describe, expect, it } from 'vitest';

import { createHighlightController, HIGHLIGHT_NAME } from './highlight';

afterEach(() => {
  document.body.innerHTML = '';
});

// jsdom has no CSS Custom Highlight API (confirmed: no global `CSS`/`Highlight`),
// so these tests exercise the overlay fallback path for real — not a mock of it.
// The primary CSS-Highlight-API path is covered by manual browser verification
// (docs/BRILLIANT_REWRITE_PLAN.md's verification section) since it needs a real
// browser engine to observe.
describe('createHighlightController (overlay fallback, jsdom has no CSS.highlights)', () => {
  it('appends exactly one overlay host child to the container', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const controller = createHighlightController(host);
    expect(host.children).toHaveLength(1);
    controller.destroy();
  });

  it('set(null) and clear() do not throw and leave no visible boxes', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const controller = createHighlightController(host);
    expect(() => controller.set(null)).not.toThrow();
    expect(() => controller.clear()).not.toThrow();
    controller.destroy();
  });

  it('set(range) does not throw even when Range.getClientRects is unavailable (jsdom)', () => {
    const host = document.createElement('div');
    host.innerHTML = '<p>Hello world</p>';
    document.body.appendChild(host);
    const range = document.createRange();
    const textNode = host.querySelector('p')!.firstChild!;
    range.setStart(textNode, 0);
    range.setEnd(textNode, 5);

    const controller = createHighlightController(host);
    expect(() => controller.set(range)).not.toThrow();
    controller.destroy();
  });

  it('destroy() removes the overlay element from the DOM', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const controller = createHighlightController(host);
    expect(host.children).toHaveLength(1);
    controller.destroy();
    expect(host.children).toHaveLength(0);
  });

  it('exports a stable highlight name for the CSS ::highlight() selector in src/index.css', () => {
    expect(HIGHLIGHT_NAME).toBe('learnlab-read-aloud');
  });
});
