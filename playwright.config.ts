// Playwright e2e configuration — SRS §11 (E2E row), AC-01/03/05/07.
//
// The suite runs against a production build of the app (vite preview) with
// the fixture course tree served from dist/content/ (decision D-001 — P0
// ships no public content). scripts/e2e-prepare.mjs performs that build.
//
// Projects: chromium always runs locally; firefox and webkit are defined so
// CI can run all three engines (§11) once those browsers are installed —
// locally `--project=chromium` is enough.

import fs from 'node:fs';
import path from 'node:path';

import { chromium, defineConfig, devices } from '@playwright/test';

const PORT = 4173;

/**
 * Sandbox fallback: if the chromium revision pinned by this Playwright
 * version is not installed (e.g. cdn.playwright.dev unreachable — offline /
 * egress-restricted environments) reuse the newest chromium build already
 * present under PLAYWRIGHT_BROWSERS_PATH. In CI `npx playwright install`
 * provides the pinned revision and this returns undefined.
 */
function chromiumExecutableFallback(): string | undefined {
  try {
    if (fs.existsSync(chromium.executablePath())) return undefined;
  } catch {
    // executablePath() can throw when the registry is empty — fall through.
  }
  const browsersDir = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!browsersDir || !fs.existsSync(browsersDir)) return undefined;
  const revisions = fs
    .readdirSync(browsersDir)
    .map((name) => /^chromium-(\d+)$/.exec(name))
    .filter((m): m is RegExpExecArray => m !== null)
    .sort((a, b) => Number(b[1]) - Number(a[1]));
  for (const m of revisions) {
    const exe = path.join(browsersDir, m[0], 'chrome-linux', 'chrome');
    if (fs.existsSync(exe)) return exe;
  }
  return undefined;
}

const chromiumExecutable = chromiumExecutableFallback();

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `node scripts/e2e-prepare.mjs && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    // e2e-prepare runs a full vite build first; allow plenty of time.
    timeout: 300_000,
    // BASE='/' keeps the local base path even when CI is set (vite.config.ts).
    env: { BASE: '/' },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(chromiumExecutable ? { launchOptions: { executablePath: chromiumExecutable } } : {}),
      },
    },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
