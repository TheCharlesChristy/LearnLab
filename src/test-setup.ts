import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// RTL auto-cleanup needs vitest globals (not enabled) — register manually.
afterEach(() => cleanup());

// jsdom lacks matchMedia — needed by the theme provider (FR-SHELL-005).
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

// jsdom lacks IntersectionObserver — needed by the lesson scroll sentinel
// (FR-SHELL-004). Instances are collected so tests can fire intersections.
type IOCallback = (entries: Array<{ isIntersecting: boolean }>) => void;

export const intersectionObservers: Array<{ callback: IOCallback; elements: Element[] }> = [];

if (typeof globalThis.IntersectionObserver === 'undefined') {
  class MockIntersectionObserver {
    private record: { callback: IOCallback; elements: Element[] };
    constructor(callback: IOCallback) {
      this.record = { callback, elements: [] };
      intersectionObservers.push(this.record);
    }
    observe(el: Element) {
      this.record.elements.push(el);
    }
    unobserve(el: Element) {
      this.record.elements = this.record.elements.filter((e) => e !== el);
    }
    disconnect() {
      this.record.elements = [];
    }
    takeRecords() {
      return [];
    }
  }
  globalThis.IntersectionObserver =
    MockIntersectionObserver as unknown as typeof IntersectionObserver;
}
