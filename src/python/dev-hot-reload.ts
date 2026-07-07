// Dev-only Python hot-reload (FR-PYDX-001).
//
// In `npm run dev`, `build-content --watch` + `build-python-bundle --watch`
// keep public/content and public/python-bundle.zip fresh, but public/ is served
// statically by Vite and is NOT part of the module graph — editing a content
// `.py` triggers no HMR. This module bridges that gap with two halves:
//
//   1. A Vite dev plugin (`pyHotReloadPlugin`) that, while serving, watches the
//      `.py` *sources* and pushes a custom HMR event to the client:
//        • a content item `.py` changed  → `py:item-changed { path }`
//        • a learnsdk/courselib `.py`    → `py:bundle-changed` (debounced)
//      `path` is normalised to a content-relative URL (e.g.
//      `content/maths/alevel-pure/.../items/foo.py`).
//
//   2. Pure client helpers (`matchItemChange`, `subscribePyHotReload`) used by
//      use-py-item, behind a runtime `import.meta.hot` guard, so the whole
//      mechanism tree-shakes out of production (FR-PY-002: Tier-1 ships zero
//      Pyodide / zero dev-loop code; the prod bundle is byte-identical).
//
// EVERYTHING here is dependency-free beyond what Vite already provides.

// ---------------------------------------------------------------------------
// Shared event contract (host plugin → client)
// ---------------------------------------------------------------------------

export const PY_ITEM_CHANGED = 'py:item-changed';
export const PY_BUNDLE_CHANGED = 'py:bundle-changed';

export interface PyItemChangedData {
  /** Content-relative URL of the changed item, e.g. `content/maths/m/items/x.py`. */
  path: string;
}

// ---------------------------------------------------------------------------
// Pure matching logic (unit-testable; no Vite, no React, no import.meta.hot)
// ---------------------------------------------------------------------------

/**
 * Normalise a URL/path to a comparable, base- and query-free content suffix.
 * Accepts absolute (`/learnlab/content/x.py`), root (`/content/x.py`),
 * relative (`content/x.py`) and cache-busted (`...x.py?t=123`) forms.
 */
function contentSuffix(input: string): string {
  // Drop any query/hash (cache-busting).
  const s = input.replace(/[?#].*$/, '');
  // Keep everything from the first `content/` segment onward, so a BASE_URL
  // prefix (`/learnlab/`) does not defeat the comparison. Without a `content/`
  // segment a path is not a comparable item URL → empty (never matches).
  const idx = s.indexOf('content/');
  if (idx < 0) return '';
  return s.slice(idx);
}

/**
 * Does an item with `sourceUrl` correspond to the changed content path emitted
 * by the dev plugin? Compares on the `content/...`-relative suffix so BASE_URL
 * and cache-busting queries are irrelevant.
 */
export function matchItemChange(changedPath: string, sourceUrl: string): boolean {
  const a = contentSuffix(changedPath);
  const b = contentSuffix(sourceUrl);
  return a !== '' && a === b;
}

/**
 * Append a cache-busting query so a re-fetch bypasses any HTTP/SW cache and the
 * just-edited source is read. Preserves an existing query string.
 */
export function cacheBust(url: string): string {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}t=${Date.now()}`;
}

// ---------------------------------------------------------------------------
// Client subscription helper (dev-only; no-op when HMR is unavailable)
// ---------------------------------------------------------------------------

export interface PyHotReloadHandlers {
  /** A content item `.py` changed; `path` is content-relative. */
  onItemChanged?: (path: string) => void;
  /** The learnsdk/courselib bundle changed; restart the worker. */
  onBundleChanged?: () => void;
}

interface HmrLike {
  on(event: string, cb: (data: unknown) => void): void;
  off?(event: string, cb: (data: unknown) => void): void;
}

/**
 * Subscribe to the dev plugin's HMR events. Returns an unsubscribe function.
 *
 * In production `import.meta.hot` is `undefined`, so this is a pure no-op and the
 * caller's dev-only branch (guarded by `import.meta.env.DEV`) is dead code that
 * the bundler tree-shakes away — production behaviour is unchanged.
 *
 * `hot` is injectable so the pure logic can be unit-tested without a live HMR
 * runtime; production call sites pass `import.meta.hot`.
 */
export function subscribePyHotReload(
  handlers: PyHotReloadHandlers,
  hot: HmrLike | undefined,
): () => void {
  if (!hot) return () => undefined;

  const itemCb = (data: unknown) => {
    const path = (data as PyItemChangedData | undefined)?.path;
    if (typeof path === 'string') handlers.onItemChanged?.(path);
  };
  const bundleCb = () => handlers.onBundleChanged?.();

  hot.on(PY_ITEM_CHANGED, itemCb);
  hot.on(PY_BUNDLE_CHANGED, bundleCb);

  return () => {
    hot.off?.(PY_ITEM_CHANGED, itemCb);
    hot.off?.(PY_BUNDLE_CHANGED, bundleCb);
  };
}

// ---------------------------------------------------------------------------
// The Vite dev plugin (apply: 'serve' → never in the production build)
// ---------------------------------------------------------------------------

// Minimal structural types so this file needs no `vite` value/type import at
// the type-check boundary used by the app build. vite.config.ts treats the
// return as a Plugin (structurally compatible).
interface WsLike {
  send(payload: { type: 'custom'; event: string; data?: unknown }): void;
}
interface WatcherLike {
  add(paths: string | readonly string[]): void;
  on(event: 'change' | 'add' | 'unlink', cb: (path: string) => void): void;
}
interface DevServerLike {
  ws: WsLike;
  watcher: WatcherLike;
}
interface PluginLike {
  name: string;
  apply: 'serve';
  configureServer(server: DevServerLike): void;
}

const BUNDLE_DEBOUNCE_MS = 300;

/**
 * Normalise an absolute filesystem path of a changed content `.py` to the
 * content-relative URL the client matches against. Returns null when the path
 * is not under a `content/` segment (defensive).
 */
function toContentRelative(absPath: string): string | null {
  const norm = absPath.replace(/\\/g, '/');
  const marker = '/content/';
  const idx = norm.indexOf(marker);
  if (idx < 0) return null;
  return 'content/' + norm.slice(idx + marker.length);
}

export function pyHotReloadPlugin(): PluginLike {
  return {
    name: 'learnlab:py-hot-reload',
    apply: 'serve',
    configureServer(server) {
      // Watch the .py *sources*. public/content/** is already served by Vite but
      // not watched for HMR; python/** is outside the served root entirely.
      server.watcher.add([
        'public/content/**/*.py',
        'python/learnsdk/**/*.py',
        'python/courselib/**/*.py',
      ]);

      let bundleTimer: ReturnType<typeof setTimeout> | null = null;
      const scheduleBundleChanged = () => {
        if (bundleTimer) clearTimeout(bundleTimer);
        bundleTimer = setTimeout(() => {
          bundleTimer = null;
          server.ws.send({ type: 'custom', event: PY_BUNDLE_CHANGED });
        }, BUNDLE_DEBOUNCE_MS);
      };

      const onPy = (file: string) => {
        const norm = file.replace(/\\/g, '/');
        if (!norm.endsWith('.py')) return;
        if (/\/python\/(learnsdk|courselib)\//.test(norm)) {
          // learnsdk/courselib edit → build-python-bundle --watch rebuilds the
          // zip; tell the client to restart the worker once it settles.
          scheduleBundleChanged();
          return;
        }
        const rel = toContentRelative(norm);
        if (rel) {
          server.ws.send({
            type: 'custom',
            event: PY_ITEM_CHANGED,
            data: { path: rel } satisfies PyItemChangedData,
          });
        }
      };

      server.watcher.on('change', onPy);
      server.watcher.on('add', onPy);
    },
  };
}
