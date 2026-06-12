// Render helpers for app-shell tests. Imported normally by test files (after
// their vi.mock registrations are hoisted), so the real route table picks up
// the mocked modules.

import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { RouterProvider, createMemoryRouter } from 'react-router';

import { ToastProvider } from '../../ui';
import { buildRoutes } from '../router';

/** Render the real route table at a path (memory history). */
export function renderRoute(path: string) {
  const router = createMemoryRouter(buildRoutes(), { initialEntries: [path] });
  return render(
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>,
  );
}

export function wrap(node: ReactNode) {
  return render(<ToastProvider>{node}</ToastProvider>);
}
