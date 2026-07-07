import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './app/App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// FR-PWA-001: register the service worker (production builds only; the
// virtual module is provided by vite-plugin-pwa).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  void import('./app/pwa').then((m) => m.setupPwa());
}
