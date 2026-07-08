// RouteErrorPage's stale-chunk auto-recovery: a failed dynamic import (a
// content-hashed lazy chunk gone after a new deploy, see chunk-error.ts)
// should trigger one silent reload rather than showing the error card, but
// a SECOND consecutive occurrence of the same failure class must fall
// through to the normal error UI instead of reloading forever.

import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CHUNK_RELOAD_GUARD_KEY } from '../chunk-error';
import { RouteErrorPage } from '../RouteErrorPage';

function renderWithThrownError(message: string) {
  function Boom(): never {
    throw new Error(message);
  }
  const router = createMemoryRouter(
    [{ path: '/', element: <Boom />, errorElement: <RouteErrorPage /> }],
    { initialEntries: ['/'] },
  );
  return render(<RouterProvider router={router} />);
}

describe('RouteErrorPage stale-chunk auto-recovery', () => {
  let reload: ReturnType<typeof vi.fn>;
  const originalLocation = window.location;

  beforeEach(() => {
    window.sessionStorage.clear();
    reload = vi.fn();
    // jsdom's location.reload isn't directly spy-able (non-configurable on
    // the Location prototype) — replace the whole `window.location` property
    // with a stub instead, which IS configurable at the `window` level.
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, reload },
    });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
    vi.restoreAllMocks();
  });

  it('reloads once, silently, on the first chunk-load failure and sets the guard', async () => {
    renderWithThrownError('Failed to fetch dynamically imported module: /assets/ModulePage-x.js');

    expect(reload).toHaveBeenCalledOnce();
    expect(window.sessionStorage.getItem(CHUNK_RELOAD_GUARD_KEY)).toBe('1');
  });

  it('does not reload again on a second consecutive chunk failure; clears the guard and shows the error card', async () => {
    window.sessionStorage.setItem(CHUNK_RELOAD_GUARD_KEY, '1');

    renderWithThrownError("error loading dynamically imported module: /assets/QuizEngine-y.js");

    expect(reload).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem(CHUNK_RELOAD_GUARD_KEY)).toBeNull();
    expect(await screen.findByText('Something went wrong')).toBeInTheDocument();
    expect(
      screen.getByText('error loading dynamically imported module: /assets/QuizEngine-y.js'),
    ).toBeInTheDocument();
  });

  it('never reloads for an unrelated application error', async () => {
    renderWithThrownError('kaboom-unrelated-error');

    expect(reload).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem(CHUNK_RELOAD_GUARD_KEY)).toBeNull();
    expect(await screen.findByText('kaboom-unrelated-error')).toBeInTheDocument();
  });
});
