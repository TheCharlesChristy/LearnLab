// Playwright e2e configuration — SRS §11 (E2E row), AC-01/02/03/04/05/07/10.
//
// The suite runs against a production build of the app (vite preview).
// scripts/e2e-prepare.mjs stages dist/content with BOTH the real pilot modules
// (public/content — driven by the @py specs) AND the fixture course tree
// (tests/fixtures/content/valid — driven by AC-01/03/05/07; decision D-001).
//
// TWO TIERS OF SPECS:
//   * Non-@py (AC-01/03/05/07): pure-app/fixture flows, run everywhere.
//   * @py (AC-02/04/10, *.@py.pw.ts; the `@py` tag is in each test TITLE):
//     need REAL Pyodide from the pinned jsDelivr CDN (§6.2.4). They run in CI
//     (open egress) and SKIP GRACEFULLY locally when jsDelivr is unreachable
//     (e2e/py-helpers.ts skipUnlessPyodideReachable). See e2e/README.md.
//
// SELECTING A TIER (the CI e2e job runs the whole suite — both tiers):
//   * only @py:      npx playwright test --grep @py
//   * only non-@py:  npx playwright test --grep-invert @py
//
// Projects: chromium always runs locally; firefox and webkit are defined so
// CI can run all three engines (§11) once those browsers are installed —
// locally `--project=chromium` is enough. The chromiumExecutableFallback below
// reuses a browser under PLAYWRIGHT_BROWSERS_PATH (e.g. /opt/pw-browsers) when
// the pinned revision is not installed (offline / egress-restricted sandboxes).

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
    // The general e2e suite runs on 3 engines (NFR-COMPAT-001); the real-Pyodide
    // @py smoke is Chromium-only (§11, §10.3), so firefox/webkit skip it.
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, grepInvert: /@py/ },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, grepInvert: /@py/ },
  ],
});
