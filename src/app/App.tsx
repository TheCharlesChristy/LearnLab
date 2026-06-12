// App root: theme + toasts + hash router (C-3 / FR-SHELL-001).

import { useState } from 'react';
import { RouterProvider, createHashRouter } from 'react-router';

import { ToastProvider } from '../ui';

import { buildRoutes } from './router';
import { ThemeProvider } from './theme';

export default function App() {
  // Created once per app instance (lazy state init keeps tests/HMR clean).
  const [router] = useState(() => createHashRouter(buildRoutes()));
  return (
    <ThemeProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </ThemeProvider>
  );
}
