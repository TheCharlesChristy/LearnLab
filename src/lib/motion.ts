// Tiny, dependency-free shared helper — `prefers-reduced-motion` detection
// used anywhere a component needs to branch in JS (not just CSS `motion-safe:`/
// `motion-reduce:` variants), e.g. skipping a canvas animation entirely or
// changing a timed content swap to be instant.

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}
