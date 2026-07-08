// Detects a failed dynamic import — a stale, content-hashed lazy chunk that
// no longer exists on the server after a new deploy — so RouteErrorPage can
// auto-recover instead of showing a scary error for what's really just a tab
// left open across a deploy. This app is a PWA navigated via a hash router
// (no full page reload between routes), so a tab open before a new build
// lands can hit this the next time it lazy-imports a route/widget chunk it
// hasn't loaded yet — not a code bug, an inherent gap in this architecture.
//
// Each browser phrases the same failure differently:
// - Chromium: "Failed to fetch dynamically imported module: <url>"
// - Firefox: "error loading dynamically imported module: <url>"
// - Safari: "Importing a module script failed"
const CHUNK_ERROR_PATTERN =
  /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i;

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return CHUNK_ERROR_PATTERN.test(message);
}

/**
 * sessionStorage key guarding the one free auto-reload per tab session (see
 * RouteErrorPage.tsx). Exported so the test can seed/inspect it directly.
 */
export const CHUNK_RELOAD_GUARD_KEY = 'chunk-reload-attempted';
