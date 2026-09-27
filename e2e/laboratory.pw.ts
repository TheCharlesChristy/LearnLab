import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const ROUTE = '/#/laboratory/research-station/close-the-loop';
test.skip(
  process.env.VITE_EXPERIENCE_RUNTIME_V2 !== 'true',
  'Laboratory preview is explicitly disabled in this build.',
);

test('first station episode: mistakes, keyboard repair, help, evidence and resume', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const start = Date.now();
  await page.goto(ROUTE);
  const supply = page.getByRole('group', { name: 'Supply link' });
  await supply.getByRole('button', { name: 'Closed', exact: true }).click();
  expect(Date.now() - start).toBeLessThan(20000); // Functional first-action hypothesis, not human performance.
  await expect(page.getByRole('status').filter({ hasText: 'Source current' })).toContainText('0 A');
  await page
    .getByRole('group', { name: 'Return link' })
    .getByRole('button', { name: 'Closed', exact: true })
    .press('Enter');
  await expect(page.getByRole('status').filter({ hasText: 'Source current' })).toContainText('1 A');
  await page.getByText('See the path and meter readings', { exact: true }).click();
  await expect(page.getByRole('table')).toBeVisible();
  await page.screenshot({ path: info.outputPath('beacon-desktop.png'), fullPage: true });
  await page.getByRole('button', { name: 'Continue investigation', exact: true }).press('Enter');
  await page
    .getByRole('button', {
      name: 'It keeps flowing near the supply, but not after the gap.',
      exact: true,
    })
    .click();
  await expect(page.getByRole('status').filter({ hasText: 'Try another' })).toBeVisible();
  await page
    .getByRole('button', { name: 'It falls to zero throughout the path.', exact: true })
    .click();
  await page.getByRole('button', { name: 'Continue investigation', exact: true }).click();
  await page
    .getByRole('group', { name: 'Return link' })
    .getByRole('button', { name: 'Open', exact: true })
    .click();
  await page.getByRole('button', { name: 'Continue investigation', exact: true }).click();
  await page.getByRole('button', { name: '0.4 A', exact: true }).click();
  await page.getByRole('button', { name: 'Help', exact: true }).click();
  await page.getByRole('button', { name: 'Show next hint', exact: true }).click();
  await page.getByRole('button', { name: '0 A', exact: true }).click();
  await page.getByRole('button', { name: 'Continue investigation', exact: true }).click();
  await page
    .getByRole('button', {
      name: 'Charge is conserved. The resistor transfers energy; the steady current is the same before and after it.',
      exact: true,
    })
    .click();
  await page.getByRole('button', { name: 'Finish investigation', exact: true }).click();
  await expect(page.getByText('1 of 2 fresh causal checks', { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'The beacon has a story to tell' })).toBeVisible();
  await page.getByText('See each check in your notebook', { exact: true }).click();
  await expect(page.getByText('Fresh independent check', { exact: false })).toHaveCount(1);
  await page.getByText('Notebook tools', { exact: true }).click();
  const exported = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export work', exact: true }).click();
  const download = await exported;
  expect(download.suggestedFilename()).toContain('work.json');
  expect(errors).toEqual([]);
});

test('narrow touch workspace: both themes, help escape and retained exposure on restart', async ({
  browser,
  baseURL,
  browserName,
}, info) => {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: 360, height: 640 },
    hasTouch: true,
    isMobile: browserName !== 'firefox',
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  try {
    await page.goto('/#/settings');
    await page.getByLabel('Light', { exact: true }).check();
    await page.goto(ROUTE);
    await expect(page.getByRole('heading', { name: 'Wake the beacon' })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    const firstControl = await page
      .getByRole('group', { name: 'Supply link' })
      .getByRole('button', { name: 'Closed', exact: true })
      .boundingBox();
    expect(firstControl!.y + firstControl!.height).toBeLessThan(640);
    const controls = await page
      .locator('.lab-control button')
      .evaluateAll((buttons) => buttons.map((b) => b.getBoundingClientRect().height));
    expect(controls.every((h) => h >= 44)).toBe(true);
    await page
      .getByRole('group', { name: 'Supply link' })
      .getByRole('button', { name: 'Closed', exact: true })
      .tap();
    await page.screenshot({ path: info.outputPath('beacon-mobile-light.png'), fullPage: true });
    await page.goto('/#/settings');
    await page.getByLabel('Dark', { exact: true }).check();
    await page.goto(ROUTE);
    await expect(
      page
        .getByRole('group', { name: 'Supply link' })
        .getByRole('button', { name: 'Closed', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    for (let i = 0; i < 5; i++) {
      await page.getByRole('button', { name: 'Help', exact: true }).tap();
      await page.getByRole('button', { name: 'Show worked example', exact: true }).tap();
      await page.getByRole('button', { name: 'Continue with help', exact: true }).tap();
    }
    await expect(page.getByText('0 of 2 fresh causal checks', { exact: false })).toBeVisible();
    await page.getByText('Notebook tools', { exact: true }).click();
    await page.getByRole('button', { name: 'Restart episode', exact: true }).tap();
    await expect(page.getByRole('heading', { name: 'Wake the beacon' })).toBeVisible();
    await page.screenshot({ path: info.outputPath('beacon-mobile-dark.png'), fullPage: true });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  } finally {
    await context.close();
  }
});

test('downloaded episode survives browser close and offline reopen with local progress', async ({
  browser,
  baseURL,
}) => {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'learnlab-offline-'));
  let context = await browser.browserType().launchPersistentContext(profile);
  const url = `${baseURL}${ROUTE}`;
  try {
    let page = await context.newPage();
    await page.goto(url);
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await page.getByRole('button', { name: 'Download for offline use', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Ready offline' })).toBeVisible({
      timeout: 60000,
    });
    await page
      .getByRole('group', { name: 'Supply link' })
      .getByRole('button', { name: 'Closed', exact: true })
      .click();
    await expect(
      page
        .getByRole('group', { name: 'Supply link' })
        .getByRole('button', { name: 'Closed', exact: true }),
    ).toBeEnabled();
    await context.close();
    context = await browser.browserType().launchPersistentContext(profile, { offline: true });
    page = await context.newPage();
    await page.goto(url);
    await expect(page.getByRole('heading', { name: 'Wake the beacon' })).toBeVisible();
    await expect(
      page
        .getByRole('group', { name: 'Supply link' })
        .getByRole('button', { name: 'Closed', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('status').filter({ hasText: 'Ready offline' })).toBeVisible({
      timeout: 30000,
    });
    await page
      .getByRole('group', { name: 'Return link' })
      .getByRole('button', { name: 'Closed', exact: true })
      .click();
    await expect(page.getByRole('status').filter({ hasText: 'Source current' })).toContainText(
      '1 A',
    );
    await page.getByRole('button', { name: 'Continue investigation', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'What if the return link opens?' }),
    ).toBeVisible();
  } finally {
    await context.close();
    fs.rmSync(profile, { recursive: true, force: true });
  }
});

test('write failure offers an export and keeps the last persisted circuit intact', async ({
  page,
}) => {
  await page.goto(ROUTE);
  await expect(page.getByRole('heading', { name: 'Wake the beacon' })).toBeVisible();
  // Deliberate failure injection in this isolated automated test profile.
  await page.evaluate(() => {
    IDBObjectStore.prototype.put = () => {
      throw new DOMException('Injected storage failure', 'QuotaExceededError');
    };
  });
  await page
    .getByRole('group', { name: 'Supply link' })
    .getByRole('button', { name: 'Closed', exact: true })
    .click();
  await expect(page.getByRole('alert').filter({ hasText: 'saving failed' })).toBeVisible();
  const exported = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export unsaved work', exact: true }).click();
  expect((await exported).suggestedFilename()).toContain('unsaved');
  await page.reload();
  await expect(
    page
      .getByRole('group', { name: 'Supply link' })
      .getByRole('button', { name: 'Open', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('tablet, landscape and expanded text preserve controls and local-only requests', async ({
  page,
}) => {
  const external: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.protocol.startsWith('http') && url.hostname !== 'localhost')
      external.push(request.url());
  });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const viewport of [
    { width: 820, height: 1180 },
    { width: 740, height: 360 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto(ROUTE);
    await expect(page.getByRole('heading', { name: 'Wake the beacon' })).toBeVisible();
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.getByRole('button', { name: 'Help', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Take a different route' })).toBeFocused();
    await page.getByRole('button', { name: 'Show next hint', exact: true }).press('Enter');
    await expect(page.locator('.lab-help')).toContainText('Hint 1:');
    await page.getByRole('button', { name: 'Help', exact: true }).click();
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '';
    });
  }
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});
