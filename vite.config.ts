/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

import { APP_NAME, PYODIDE_BASE_URL, PYODIDE_VERSION, REPO_NAME } from './src/config';

// SRS §10.2: base is '/<REPO_NAME>/' for CI/Pages builds, '/' locally.
// An explicit BASE env var (used by deploy.yml) takes precedence.
const base = process.env.BASE ?? (process.env.CI ? `/${REPO_NAME}/` : '/');

// PWA (SRS §5.8, FR-PWA-001..004). The SW caches only self + the pinned
// Pyodide prefix (NFR-SEC-001 / C-4).
const pwaPlugin = VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
  manifest: {
    name: APP_NAME,
    short_name: APP_NAME,
    description: 'Interactive engineering learning platform — all progress stays on-device.',
    // Relative start_url/scope work under the GitHub Pages base path.
    start_url: '.',
    scope: '.',
    display: 'standalone',
    theme_color: '#4f46e5',
    background_color: '#f8fafc',
    icons: [
      { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: {
    // Precache the app shell incl. KaTeX woff2 fonts (FR-PWA-001).
    globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
    runtimeCaching: [
      {
        // Same-origin course content (FR-PWA-002). A path-only RegExp can
        // only ever match same-origin URLs in Workbox (cross-origin patterns
        // must match from the protocol onward).
        urlPattern: /\/content\//,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'content-v1',
          expiration: { maxEntries: 500 },
        },
      },
      {
        // Pinned Pyodide CDN prefix → cache-first, 1 year (FR-PWA-002).
        urlPattern: new RegExp(`^${PYODIDE_BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
        handler: 'CacheFirst',
        options: {
          cacheName: `pyodide-v${PYODIDE_VERSION}`,
          expiration: { maxEntries: 80, maxAgeSeconds: 365 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  },
});

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), pwaPlugin],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
});
