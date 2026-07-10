import 'fake-indexeddb/auto';

import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { db } from '../progress';

import { useReadAloud } from './useReadAloud';

interface BoundaryEvent {
  charIndex: number;
  charLength: number;
  name?: string;
}

class MockUtterance {
  text: string;
  rate = 1;
  onboundary: ((event: BoundaryEvent) => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}

class MockSpeechSynthesis {
  speaking = false;
  paused = false;
  current: MockUtterance | null = null;
  cancelCalls = 0;

  speak(utterance: MockUtterance) {
    this.current = utterance;
    this.speaking = true;
    this.paused = false;
  }
  cancel() {
    this.cancelCalls += 1;
    this.speaking = false;
    this.paused = false;
    this.current = null;
  }
  pause() {
    this.paused = true;
  }
  resume() {
    this.paused = false;
  }
  fireBoundary(charIndex: number, charLength: number, name = 'word') {
    this.current?.onboundary?.({ charIndex, charLength, name });
  }
  fireEnd() {
    const u = this.current;
    this.current = null;
    this.speaking = false;
    u?.onend?.();
  }
}

let mockSynthesis: MockSpeechSynthesis;

beforeEach(async () => {
  mockSynthesis = new MockSpeechSynthesis();
  Object.defineProperty(window, 'speechSynthesis', {
    value: mockSynthesis,
    configurable: true,
    writable: true,
  });
  (window as unknown as { SpeechSynthesisUtterance: typeof MockUtterance }).SpeechSynthesisUtterance =
    MockUtterance;
  await db.open();
  await Promise.all(db.tables.map((t) => t.clear()));
});

afterEach(() => {
  // Deliberately does NOT delete window.speechSynthesis here: RTL's own
  // afterEach-registered cleanup() (src/test-setup.ts) unmounts any
  // still-mounted renderHook result after this hook runs, and useReadAloud's
  // unmount effect calls speechSynthesis.cancel() — deleting the mock first
  // would make that cleanup crash. beforeEach reassigns a fresh mock before
  // every test, which is sufficient isolation.
  document.body.innerHTML = '';
});

function containerRef(html: string) {
  const el = document.createElement('div');
  el.innerHTML = html;
  document.body.appendChild(el);
  return { current: el };
}

describe('useReadAloud', () => {
  it('reports unsupported when the browser has no speechSynthesis', () => {
    Reflect.deleteProperty(window, 'speechSynthesis');
    const ref = containerRef('<p>Hello</p>');
    const { result } = renderHook(() => useReadAloud(ref));
    expect(result.current.status).toBe('unsupported');
  });

  it('starts idle, then speaking after start()', () => {
    const ref = containerRef('<p>Hello world</p>');
    const { result } = renderHook(() => useReadAloud(ref));
    expect(result.current.status).toBe('idle');

    act(() => result.current.start());
    expect(result.current.status).toBe('speaking');
    expect(mockSynthesis.current?.text).toBe('Hello world');
  });

  it('does nothing when the container has no readable text', () => {
    const ref = containerRef('<pre data-language="python"><code>x = 1</code></pre>');
    const { result } = renderHook(() => useReadAloud(ref));
    act(() => result.current.start());
    expect(result.current.status).toBe('idle');
    expect(mockSynthesis.current).toBeNull();
  });

  it('pause()/resume() toggle status and call through to speechSynthesis', () => {
    const ref = containerRef('<p>Hello world</p>');
    const { result } = renderHook(() => useReadAloud(ref));
    act(() => result.current.start());

    act(() => result.current.pause());
    expect(result.current.status).toBe('paused');
    expect(mockSynthesis.paused).toBe(true);

    act(() => result.current.resume());
    expect(result.current.status).toBe('speaking');
    expect(mockSynthesis.paused).toBe(false);
  });

  it('stop() cancels speech and resets to idle', () => {
    const ref = containerRef('<p>Hello world</p>');
    const { result } = renderHook(() => useReadAloud(ref));
    act(() => result.current.start());
    act(() => result.current.stop());
    expect(result.current.status).toBe('idle');
    expect(mockSynthesis.cancelCalls).toBeGreaterThan(0);
  });

  it('onend transitions status back to idle without an explicit stop() call', () => {
    const ref = containerRef('<p>Hello world</p>');
    const { result } = renderHook(() => useReadAloud(ref));
    act(() => result.current.start());
    act(() => mockSynthesis.fireEnd());
    expect(result.current.status).toBe('idle');
  });

  it('a boundary event does not throw even with an empty highlight target', () => {
    const ref = containerRef('<p>Hello world</p>');
    const { result } = renderHook(() => useReadAloud(ref));
    act(() => result.current.start());
    expect(() => act(() => mockSynthesis.fireBoundary(6, 5))).not.toThrow();
  });

  it('changing resetKey cancels any in-progress speech', () => {
    const ref = containerRef('<p>Hello world</p>');
    const { result, rerender } = renderHook(({ key }) => useReadAloud(ref, key), {
      initialProps: { key: 'lesson-1' },
    });
    act(() => result.current.start());
    expect(mockSynthesis.speaking).toBe(true);

    rerender({ key: 'lesson-2' });
    expect(mockSynthesis.cancelCalls).toBeGreaterThan(0);
  });

  it('unmounting cancels any in-progress speech', () => {
    const ref = containerRef('<p>Hello world</p>');
    const { result, unmount } = renderHook(() => useReadAloud(ref));
    act(() => result.current.start());
    unmount();
    expect(mockSynthesis.cancelCalls).toBeGreaterThan(0);
  });

  it('setRate clamps to [MIN_RATE, MAX_RATE] and persists via the kv store', async () => {
    const ref = containerRef('<p>Hello world</p>');
    const { result } = renderHook(() => useReadAloud(ref));

    act(() => result.current.setRate(5));
    expect(result.current.rate).toBe(2);

    act(() => result.current.setRate(0.1));
    expect(result.current.rate).toBe(0.5);

    await waitFor(async () => {
      const row = await db.kv.get('ttsRate');
      expect(row?.value).toBe(0.5);
    });
  });

  it('restores a previously persisted rate on mount', async () => {
    await db.kv.put({ key: 'ttsRate', value: 1.5 });
    const ref = containerRef('<p>Hello world</p>');
    const { result } = renderHook(() => useReadAloud(ref));
    await waitFor(() => expect(result.current.rate).toBe(1.5));
  });
});
