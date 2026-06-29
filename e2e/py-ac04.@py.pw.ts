// AC-04 (@py) — PWA offline guarantee (FR-PWA-003). Visit the projectile module
// ONLINE so the service worker caches the app shell, the content and (cache-
// first, FR-PWA-002) the Pyodide runtime; then go OFFLINE and revisit: the
// lesson + simulation still work and a progress write succeeds (§12 AC-04).
//
// Sequencing matters: offline only holds AFTER the online visit has cached the
// SW + Pyodide + bundle. So the test (1) loads the lesson online and launches
// the sim once to fully warm the runtime and content, (2) flips the Playwright
// context offline, (3) reloads and re-launches, asserting the canvas renders
// from cache and a fresh attempts row lands while offline.
//
// REAL Pyodide is required; the test SKIPS GRACEFULLY when jsDelivr is
// unreachable (see py-helpers). It runs for real in CI.

import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

import { PYODIDE_READY_TIMEOUT, readAttempts, skipUnlessPyodideReachable } from './py-helpers';

const MODULE_ID = 'kinematics-suvat';
const LESSON_ID = 'projectiles';
const ITEM_ID = 'items/projectile';
const LESSON_URL = `/#/module/${MODULE_ID}/lesson/${LESSON_ID}`;

test.describe('@py AC-04 projectile sim works offline (real Pyodide + SW cache)', () => {
  test.beforeEach(async () => {
    await skipUnlessPyodideReachable();
  });

  test('@py AC-04: online visit → offline revisit → lesson + sim + progress write', async ({
    page,
    context,
  }) => {
    test.setTimeout(240_000);

    // --- 1. ONLINE: load the lesson, runtime loads, the sim renders. --------
    await page.goto(LESSON_URL);
    const item = page.locator(`[data-py-item="${ITEM_ID}"]`);
    await item.scrollIntoViewIfNeeded();

    // Runtime-loading card resolves into the rendered sim: the projectile
    // Canvas (role="img", §6.7) and a "Launch" button (§6.13(b)).
    const canvas = item.getByRole('img', { name: 'Interactive canvas' });
    await expect(canvas).toBeVisible({ timeout: PYODIDE_READY_TIMEOUT });
    await expect(item.getByRole('button', { name: 'Launch' })).toBeVisible();

    // Launch once online: warms the tick loop and lands one attempt (the sim
    // calls self.complete() on landing, §6.13(b)) so the SW+runtime are warm.
    await launchAndLand(item);
    const onlineAttempts = await attemptCount(page);
    expect(onlineAttempts).toBeGreaterThanOrEqual(1);

    // Give the service worker a beat to finish caching the Pyodide responses
    // (cache-first, FR-PWA-002) before cutting the network.
    await page.waitForTimeout(2_000);
    await expect
      .poll(() => page.evaluate(() => navigator.serviceWorker?.controller != null), {
        timeout: 15_000,
      })
      .toBe(true);

    // --- 2. GO OFFLINE (Playwright network block). --------------------------
    await context.setOffline(true);

    // --- 3. OFFLINE: reload + revisit; lesson and sim still work. -----------
    await page.reload();
    // App shell precached (FR-PWA-001): the lesson heading renders offline.
    await expect(page.getByRole('heading', { name: 'Projectile motion', level: 1 })).toBeVisible({
      timeout: 30_000,
    });

    const offlineItem = page.locator(`[data-py-item="${ITEM_ID}"]`);
    await offlineItem.scrollIntoViewIfNeeded();
    // Pyodide + bundle served from the SW cache (FR-PWA-003): the sim renders
    // again with no network.
    const offlineCanvas = offlineItem.getByRole('img', { name: 'Interactive canvas' });
    await expect(offlineCanvas).toBeVisible({ timeout: PYODIDE_READY_TIMEOUT });
    await expect(offlineItem.getByRole('button', { name: 'Launch' })).toBeVisible();

    // --- 4. OFFLINE progress write succeeds (FR-PWA-003). -------------------
    const before = await attemptCount(page);
    await launchAndLand(offlineItem);
    await expect
      .poll(() => attemptCount(page), { timeout: 20_000 })
      .toBeGreaterThan(before);

    // Restore network for clean teardown.
    await context.setOffline(false);
  });
});

/** Count python-item attempts for the projectile (progress write evidence). */
async function attemptCount(page: Page): Promise<number> {
  const attempts = await readAttempts(page);
  return attempts.filter((a) => a.moduleId === MODULE_ID && a.itemId === ITEM_ID).length;
}

/**
 * Launch the projectile and wait for it to land. The sim integrates SUVAT at
 * 30 Hz and pauses + completes when y returns to 0 (§6.13(b)); with the default
 * angle/speed that is a couple of seconds. We detect landing by the "best
 * range" readout becoming non-zero (set on landing).
 */
async function launchAndLand(item: Locator): Promise<void> {
  await item.getByRole('button', { name: 'Launch' }).click();
  // The transport text reads "t = X.XX s · best range: Y.Y m"; best range is
  // updated only on landing, so wait for a non-zero best range.
  await expect
    .poll(
      async () => {
        const text = await item.innerText();
        const m = /best range:\s*([\d.]+)\s*m/i.exec(text.replace(/\s+/g, ' '));
        return m ? Number(m[1]) : 0;
      },
      { timeout: 30_000 },
    )
    .toBeGreaterThan(0);
}
