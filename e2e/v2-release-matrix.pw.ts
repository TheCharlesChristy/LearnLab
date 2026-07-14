// v2 / #65 release verification. The runtime's terminal/retry flow is driven
// in src/experience/runtime/recovery.test.tsx because v2 has intentionally not
// been wired into a learner route yet. This browser-level piece verifies the
// production artefact that every future route will inherit: the exact CSP and
// its no-prefetch/no-eval local-first release gate.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

import { expect, test } from '@playwright/test';

import { repoRoot } from './helpers';

const APPROVED_CSP =
  "default-src 'self'; script-src 'self' 'wasm-unsafe-eval' https://cdn.jsdelivr.net; worker-src 'self' blob:; connect-src 'self' https://cdn.jsdelivr.net blob:; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'";

test('v2 release: production CSP and source-origin quality gate pass', async ({ page, browserName }) => {
  // The result is build-global, so avoid repeating a file-system release gate
  // for all cross-browser projects. Chromium still observes the built policy
  // as the browser receives it, rather than testing index.html in isolation.
  test.skip(browserName !== 'chromium', 'production artefact gate runs once in Chromium');

  const result = spawnSync(process.execPath, ['scripts/quality-check.mjs'], {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: 60_000,
  });
  const output = `${result.stdout}\n${result.stderr}`;
  expect(result.status, output).toBe(0);

  const html = readFileSync(resolve(repoRoot, 'dist', 'index.html'), 'utf8');
  expect(html).toContain(APPROVED_CSP);
  expect(html).not.toMatch(/<link\b[^>]*\brel=["'](?:prefetch|prerender)["']/i);

  await page.goto('/');
  await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveAttribute(
    'content',
    APPROVED_CSP,
  );
});
