import { useCallback, useEffect, useRef, useState } from 'react';

export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; error: unknown };

/**
 * Load async data keyed by a string; exposes a retry() for FR-CONT-007
 * retry cards. `key` should encode every input the loader depends on.
 */
export function useAsyncData<T>(
  load: () => Promise<T>,
  key: string,
): AsyncState<T> & { retry: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' });
  const [nonce, setNonce] = useState(0);

  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    loadRef.current().then(
      (data) => {
        if (!cancelled) setState({ status: 'ready', data });
      },
      (error: unknown) => {
        if (!cancelled) setState({ status: 'error', error });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [key, nonce]);

  const retry = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, retry };
}

/** Human-readable message for a load failure (ContentLoadError or generic). */
export function describeError(error: unknown): string {
  if (error && typeof error === 'object') {
    const e = error as { kind?: string; url?: string; status?: number; message?: string };
    if (e.kind === 'fetch') {
      return `Could not fetch ${e.url ?? 'content'}${e.status ? ` (HTTP ${e.status})` : ''}.`;
    }
    if (e.kind === 'validation') {
      return `Content failed validation: ${e.url ?? 'unknown file'}.`;
    }
    if (typeof e.message === 'string' && e.message) return e.message;
  }
  return String(error);
}
