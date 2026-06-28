import { describe, it, expect, vi } from 'vitest';

import {
  PY_BUNDLE_CHANGED,
  PY_ITEM_CHANGED,
  cacheBust,
  matchItemChange,
  pyHotReloadPlugin,
  subscribePyHotReload,
} from './dev-hot-reload';

describe('matchItemChange', () => {
  it('matches identical content-relative paths', () => {
    expect(matchItemChange('content/maths/m/items/x.py', 'content/maths/m/items/x.py')).toBe(true);
  });

  it('matches across a BASE_URL prefix on the sourceUrl', () => {
    // sourceUrl is BASE_URL + content/... ; the plugin emits content-relative.
    expect(matchItemChange('content/maths/m/items/x.py', '/learnlab/content/maths/m/items/x.py')).toBe(true);
    expect(matchItemChange('content/maths/m/items/x.py', '/content/maths/m/items/x.py')).toBe(true);
  });

  it('ignores cache-busting query strings on either side', () => {
    expect(matchItemChange('content/a/items/x.py', '/content/a/items/x.py?t=123')).toBe(true);
  });

  it('does not match a different item', () => {
    expect(matchItemChange('content/a/items/x.py', '/content/a/items/y.py')).toBe(false);
  });

  it('returns false when no content segment is present', () => {
    expect(matchItemChange('x.py', 'x.py')).toBe(false);
  });
});

describe('cacheBust', () => {
  it('appends a t= query when none exists', () => {
    expect(cacheBust('/content/x.py')).toMatch(/^\/content\/x\.py\?t=\d+$/);
  });
  it('uses & when a query already exists', () => {
    expect(cacheBust('/content/x.py?v=1')).toMatch(/^\/content\/x\.py\?v=1&t=\d+$/);
  });
});

describe('subscribePyHotReload', () => {
  it('is a no-op (does not throw, returns a noop unsub) when hot is undefined (prod)', () => {
    const onItemChanged = vi.fn();
    const onBundleChanged = vi.fn();
    const unsub = subscribePyHotReload({ onItemChanged, onBundleChanged }, undefined);
    expect(typeof unsub).toBe('function');
    expect(() => unsub()).not.toThrow();
    expect(onItemChanged).not.toHaveBeenCalled();
    expect(onBundleChanged).not.toHaveBeenCalled();
  });

  it('routes item-changed and bundle-changed events to handlers', () => {
    const listeners: Record<string, (data: unknown) => void> = {};
    const hot = {
      on: (event: string, cb: (data: unknown) => void) => {
        listeners[event] = cb;
      },
      off: vi.fn(),
    };
    const onItemChanged = vi.fn();
    const onBundleChanged = vi.fn();
    subscribePyHotReload({ onItemChanged, onBundleChanged }, hot);

    listeners[PY_ITEM_CHANGED]!({ path: 'content/a/items/x.py' });
    expect(onItemChanged).toHaveBeenCalledWith('content/a/items/x.py');

    listeners[PY_BUNDLE_CHANGED]!(undefined);
    expect(onBundleChanged).toHaveBeenCalledTimes(1);
  });

  it('ignores item-changed payloads without a string path', () => {
    const listeners: Record<string, (data: unknown) => void> = {};
    const hot = { on: (e: string, cb: (d: unknown) => void) => void (listeners[e] = cb) };
    const onItemChanged = vi.fn();
    subscribePyHotReload({ onItemChanged }, hot);
    listeners[PY_ITEM_CHANGED]!({});
    listeners[PY_ITEM_CHANGED]!(undefined);
    expect(onItemChanged).not.toHaveBeenCalled();
  });

  it('unsubscribe calls hot.off for both events', () => {
    const off = vi.fn();
    const hot = { on: vi.fn(), off };
    const unsub = subscribePyHotReload({}, hot);
    unsub();
    expect(off).toHaveBeenCalledWith(PY_ITEM_CHANGED, expect.any(Function));
    expect(off).toHaveBeenCalledWith(PY_BUNDLE_CHANGED, expect.any(Function));
  });
});

describe('pyHotReloadPlugin', () => {
  it('is a serve-only plugin', () => {
    const p = pyHotReloadPlugin();
    expect(p.apply).toBe('serve');
    expect(p.name).toBe('learnlab:py-hot-reload');
  });

  it('watches the .py sources and emits item-changed for content edits', () => {
    const handlers: Record<string, (path: string) => void> = {};
    const send = vi.fn();
    const added: unknown[] = [];
    const server = {
      ws: { send },
      watcher: {
        add: (paths: unknown) => added.push(paths),
        on: (event: string, cb: (path: string) => void) => {
          handlers[event] = cb;
        },
      },
    };
    pyHotReloadPlugin().configureServer(server);

    expect(added[0]).toEqual([
      'public/content/**/*.py',
      'python/learnsdk/**/*.py',
      'python/courselib/**/*.py',
    ]);

    handlers.change!('/repo/public/content/maths/m/items/x.py');
    expect(send).toHaveBeenCalledWith({
      type: 'custom',
      event: PY_ITEM_CHANGED,
      data: { path: 'content/maths/m/items/x.py' },
    });
  });

  it('debounces bundle-changed for learnsdk/courselib edits', () => {
    vi.useFakeTimers();
    const handlers: Record<string, (path: string) => void> = {};
    const send = vi.fn();
    const server = {
      ws: { send },
      watcher: {
        add: vi.fn(),
        on: (event: string, cb: (path: string) => void) => void (handlers[event] = cb),
      },
    };
    pyHotReloadPlugin().configureServer(server);

    handlers.change!('/repo/python/learnsdk/item.py');
    handlers.change!('/repo/python/courselib/maths.py');
    expect(send).not.toHaveBeenCalled(); // debounced
    vi.advanceTimersByTime(300);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith({ type: 'custom', event: PY_BUNDLE_CHANGED });
    vi.useRealTimers();
  });

  it('ignores non-.py changes', () => {
    const handlers: Record<string, (path: string) => void> = {};
    const send = vi.fn();
    const server = {
      ws: { send },
      watcher: { add: vi.fn(), on: (e: string, cb: (p: string) => void) => void (handlers[e] = cb) },
    };
    pyHotReloadPlugin().configureServer(server);
    handlers.change!('/repo/public/content/maths/m/01-lesson.md');
    expect(send).not.toHaveBeenCalled();
  });
});
