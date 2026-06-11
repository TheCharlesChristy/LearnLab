/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { REPO_NAME } from './src/config';

// SRS §10.2: base is '/<REPO_NAME>/' for CI/Pages builds, '/' locally.
// An explicit BASE env var (used by deploy.yml) takes precedence.
const base = process.env.BASE ?? (process.env.CI ? `/${REPO_NAME}/` : '/');

// NOTE: vite-plugin-pwa is installed but deliberately not configured here;
// task T0.8 owns the PWA setup (SRS §5.8).
export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
});
