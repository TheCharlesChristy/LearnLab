// FR-SHELL-006: every route is wrapped in an error boundary that shows the
// error, a "Copy details" button and a Reload action — never a white screen.

import { useEffect, useState } from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router';

import { Button, Card } from '../ui';

import { CHUNK_RELOAD_GUARD_KEY, isChunkLoadError } from './chunk-error';

function errorMessage(error: unknown): string {
  if (isRouteErrorResponse(error)) return `${error.status} ${error.statusText}`;
  if (error instanceof Error) return error.message;
  return String(error);
}

function errorDetails(error: unknown): string {
  if (error instanceof Error) return `${error.message}\n\n${error.stack ?? ''}`;
  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
}

export function RouteErrorPage() {
  const error = useRouteError();
  const [copied, setCopied] = useState(false);

  // Auto-recover from a stale lazy-loaded chunk (chunk-error.ts): the first
  // time this happens in the tab's session, reload once immediately — the
  // user never sees this error card for a false alarm caused by a tab left
  // open across a new deploy. If the SAME class of failure recurs right
  // after that reload, it's a real, persistent problem: clear the guard (so
  // a later, unrelated staleness event still gets its own free auto-reload)
  // and fall through to the error card below instead of reloading forever.
  useEffect(() => {
    if (!isChunkLoadError(error)) return;
    if (window.sessionStorage.getItem(CHUNK_RELOAD_GUARD_KEY)) {
      window.sessionStorage.removeItem(CHUNK_RELOAD_GUARD_KEY);
      return;
    }
    window.sessionStorage.setItem(CHUNK_RELOAD_GUARD_KEY, '1');
    window.location.reload();
  }, [error]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(errorDetails(error));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Card role="alert" className="mx-auto my-8 max-w-2xl border-red-300 dark:border-red-700">
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="mt-2 break-words font-mono text-sm text-red-800 dark:text-red-300">
        {errorMessage(error)}
      </p>
      <div className="mt-4 flex gap-2">
        <Button variant="secondary" onClick={() => void copy()}>
          {copied ? 'Copied' : 'Copy details'}
        </Button>
        <Button onClick={() => window.location.reload()}>Reload</Button>
      </div>
    </Card>
  );
}
