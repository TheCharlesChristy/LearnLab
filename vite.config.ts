/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { VitePWA } from 'vite-plugin-pwa';

import { APP_NAME, PYODIDE_BASE_URL, PYODIDE_VERSION, REPO_NAME } from './src/config';
import { pyHotReloadPlugin } from './src/python/dev-hot-reload';

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
    // Precache the app shell incl. KaTeX woff2 fonts (FR-PWA-001) AND
    // python-bundle.zip (§6.2.2 step 2, FR-PWA-003): it's a same-origin
    // root-level asset matching neither the /content/ nor the Pyodide-CDN
    // runtime-caching rule below, so without precache it's unreachable
    // offline — the worker's bundle fetch silently fails and every Python
    // item is stuck forever, even after a full online visit (caught by the
    // AC-04 @py e2e test). It's a normal `dist/` build artifact, so
    // vite-plugin-pwa content-hashes/revisions it like any other precached
    // file — a content change (e.g. via FR-PYDX-001 rebuilds) busts the entry.
    globPatterns: [
      '**/*.{js,css,html,svg,png,ico,woff2,zip}',
      'laboratory/index.json',
      'laboratory/runtime-assets.json',
    ],
    runtimeCaching: [
      {
        urlPattern: /\/laboratory\//,
        handler: 'CacheFirst',
        options: { cacheName: 'learnlab-laboratory-acquired-v1' },
      },
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
  // pyHotReloadPlugin is apply:'serve' → active in `vite dev` only, never in
  // the production build (FR-PYDX-001; keeps prod output unchanged).
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'laboratory-runtime-closure',
      apply: 'build',
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'laboratory/runtime-assets.json', source: '{}' });
      },
      writeBundle(options) {
        // Vite rewrites chunks and CSS late in generateBundle. Hash actual
        // final bytes after writing, before Workbox closeBundle precaches them.
        const folder = path.resolve(options.dir ?? 'dist');
        const files: { path: string; sha256: string; bytes: number }[] = [];
        const walk = (dir: string) => {
          for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const file = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(file);
            else if (/\.(js|css|html|woff2|svg|png|ico)$/.test(entry.name)) {
              const bytes = fs.readFileSync(file);
              files.push({
                path: path.relative(folder, file).split(path.sep).join('/'),
                sha256: createHash('sha256').update(bytes).digest('hex'),
                bytes: bytes.length,
              });
            }
          }
        };
        walk(folder);
        fs.writeFileSync(
          path.join(folder, 'laboratory/runtime-assets.json'),
          JSON.stringify({ formatVersion: 1, files }),
        );
      },
    },
    pwaPlugin,
    pyHotReloadPlugin(),
  ],
  build: {
    // NFR-SEC-001: never inline fonts as data: URIs. Vite inlines assets
    // under 4 KB by default, which caught KaTeX_Size3-Regular.woff2 (3.6 KB);
    // the CSP's default-src 'self' (no font-src) then blocked it, breaking
    // large delimiters. Emitting fonts as same-origin files keeps the CSP
    // strict and lets the PWA precache them like every other KaTeX font.
    // Other assets keep Vite's default threshold (undefined = default).
    assetsInlineLimit: (filePath) =>
      /\.(woff2?|ttf|otf|eot)$/i.test(filePath) ? false : undefined,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
});
