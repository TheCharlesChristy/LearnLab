import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { LaboratoryPack } from '../src/v2/pack';

const pack = JSON.parse(readFileSync('public/laboratory/great-fire-investigation/pack.json', 'utf8')) as LaboratoryPack;
test.skip(process.env.VITE_EXPERIENCE_RUNTIME_V2 !== 'true', 'Opt-in laboratory is disabled.');

test('four Great Fire investigations use sources, written claims, fresh checks and local resume', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const episode of pack.episodes) {
    await page.goto(`/#/laboratory/${pack.id}/${episode.id}`);
    for (const node of episode.nodes) {
      await expect(page.getByRole('heading', { name: node.title, exact: true })).toBeVisible();
      if (node.activity.type === 'choice') {
        await page.getByRole('button', { name: node.activity.options.find((option) => option.correct)!.text, exact: true }).click();
      } else if (node.activity.type === 'evidence-board') {
        for (const source of node.activity.sources.slice(0, 2)) {
          await page.getByRole('button', { name: new RegExp(source.title) }).click();
          await expect(page.getByText('What it cannot prove:')).toBeVisible();
          await page.getByRole('button', { name: 'Pin as evidence' }).click();
        }
        if (episode.id === 'fire-map')
          await page.screenshot({ path: info.outputPath('history-map-desktop.png'), fullPage: true });
        await page.getByLabel('Your provisional claim').fill('The two records offer evidence about what was reported or observed, but neither can establish the first ignition on its own.');
        await page.getByRole('button', { name: 'Save claim to notebook' }).click();
        await expect(page.getByRole('status').filter({ hasText: 'Saved 124 characters' })).toBeVisible();
        if (episode.id === 'case-conference') {
          await page.reload();
          await expect(page.getByLabel('Your provisional claim')).toHaveValue(/two records/);
        }
        await page.getByRole('button', { name: 'I reviewed my claim against these prompts' }).click();
        await expect(page.getByText('This has not been marked for historical accuracy.')).toBeVisible();
      }
      await page.getByRole('button', { name: node.transitions.passed ? 'Continue investigation' : 'Finish investigation' }).click();
    }
    await expect(page.getByRole('heading', { name: episode.debrief!.title })).toBeVisible();
    if (episode.id === 'fire-map') {
      await page.screenshot({ path: info.outputPath('history-completion.png'), fullPage: true });
    }
  }
  expect(errors).toEqual([]);
});

test('history evidence map and source desk remain usable at narrow width and enlarged text', async ({ page }, info) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto(`/#/laboratory/${pack.id}/fire-map`);
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  const first = pack.episodes[2]!.nodes[0]!;
  if (first.activity.type !== 'choice') throw new Error('Expected source choice');
  await page.getByRole('button', { name: first.activity.options.find((option) => option.correct)!.text, exact: true }).press('Enter');
  await page.getByRole('button', { name: 'Continue investigation' }).press('Enter');
  await expect(page.getByRole('heading', { name: 'Walk the evidence map' })).toBeVisible();
  await expect(page.getByRole('list', { name: 'Map places in text' })).toBeVisible();
  await page.getByRole('button', { name: /The Crown’s early report/ }).click();
  await expect(page.getByText('What it cannot prove:')).toBeVisible();
  await page.screenshot({ path: info.outputPath('history-map-phone-expanded.png'), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test('downloaded history case reopens with source pins and writing while offline', async ({ browser, baseURL, browserName }) => {
  test.skip(browserName !== 'chromium', 'Persistent offline profile checked in Chromium.');
  const profile = mkdtempSync(path.join(tmpdir(), 'learnlab-history-offline-'));
  let context = await browser.browserType().launchPersistentContext(profile);
  const route = `${baseURL}/#/laboratory/${pack.id}/first-report`;
  try {
    let page = await context.newPage();
    await page.goto(route);
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await page.getByRole('button', { name: 'Download for offline use' }).click();
    await expect(page.getByRole('status').filter({ hasText: /^Ready offline ·/ })).toBeVisible({ timeout: 60000 });
    const first = pack.episodes[0]!.nodes[0]!;
    if (first.activity.type !== 'choice') throw new Error('Expected first choice');
    await page.getByRole('button', { name: first.activity.options.find((option) => option.correct)!.text, exact: true }).click();
    await page.getByRole('button', { name: 'Continue investigation' }).click();
    await page.getByRole('button', { name: /The Crown’s early report/ }).click();
    await page.getByRole('button', { name: 'Pin as evidence' }).click();
    await page.getByLabel('Your provisional claim').fill('The Gazette names an early location, but it does not explain the first ignition.');
    await page.getByRole('button', { name: 'Save claim to notebook' }).click();
    await expect(page.getByRole('status').filter({ hasText: /^Saved \d+ characters/ })).toBeVisible();
    await context.close();
    context = await browser.browserType().launchPersistentContext(profile, { offline: true });
    page = await context.newPage();
    await page.goto(route);
    await expect(page.getByRole('heading', { name: 'Two dispatches, two vantage points' })).toBeVisible();
    await expect(page.getByLabel('Your provisional claim')).toHaveValue(/Gazette names an early location/);
    await expect(page.getByText('1 pinned')).toBeVisible();
    await page.getByRole('button', { name: /A diary hears, then sees/ }).click();
    await expect(page.getByText('Paraphrase written for this lesson')).toBeVisible();
    await page.getByRole('button', { name: 'Help' }).click();
    await page.getByRole('button', { name: 'Show next hint' }).click();
    await expect(page.getByText('Hint 1:')).toBeVisible();
  } finally {
    await context.close();
    rmSync(profile, { recursive: true, force: true });
  }
});

test('a struggling history learner can use hints and leave without false mastery', async ({ page }) => {
  await page.goto(`/#/laboratory/${pack.id}/case-conference`);
  await page.getByRole('button', { name: 'Treat the loudest contemporary pamphlet as the answer.' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Try another explanation' })).toBeVisible();
  await page.getByRole('button', { name: 'Help', exact: true }).click();
  await page.getByRole('button', { name: 'Show next hint' }).click();
  await page.getByRole('button', { name: 'Continue with help' }).click();
  await expect(page.getByRole('heading', { name: 'Convene the case conference' })).toBeVisible();
  await page.getByRole('button', { name: 'Help', exact: true }).click();
  await page.getByRole('button', { name: 'Show worked example' }).click();
  await page.getByRole('button', { name: 'Continue with help' }).click();
  await expect(page.getByRole('heading', { name: 'Challenge from the editor' })).toBeVisible();
  await page.getByRole('button', { name: 'Yes. A map plus a printed accusation is independent proof.' }).click();
  await page.getByRole('button', { name: 'No. The survey records ruins and the pamphlet records an allegation; neither proves a culprit.' }).click();
  await page.getByRole('button', { name: 'Finish investigation' }).click();
  await expect(page.getByText('0 of 2 fresh checks passed independently.')).toBeVisible();
  await page.getByText('See each check in your notebook').click();
  await expect(page.getByText('Completed with help').first()).toBeVisible();
});

test('source cards and claim controls work by touch in light and dark', async ({ browser, baseURL, browserName }, info) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, hasTouch: true, ...(browserName === 'firefox' ? {} : { isMobile: true }) });
  const page = await context.newPage();
  try {
    await page.goto(`/#/laboratory/${pack.id}/first-report`);
    await page.getByRole('button', { name: 'The servant brought Pepys an alert.' }).tap();
    await page.getByRole('button', { name: 'Continue investigation' }).tap();
    await page.getByRole('button', { name: /The Crown’s early report/ }).tap();
    await page.getByRole('button', { name: 'Pin as evidence' }).tap();
    await page.getByLabel('Your provisional claim').fill('The Gazette records a place and official response, not the origin of the first spark.');
    await page.getByRole('button', { name: 'Save claim to notebook' }).tap();
    await expect(page.getByRole('status').filter({ hasText: /^Saved \d+ characters/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /A diary hears, then sees/ })).toBeEnabled();
    const light = await page.locator('.lab-panel').first().evaluate((element) => getComputedStyle(element).backgroundColor);
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    const dark = await page.locator('.lab-panel').first().evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(dark).not.toBe(light);
    await expect.poll(() => page.getByRole('button', { name: /A diary hears, then sees/ })
      .evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgb(19, 42, 52)');
    await page.screenshot({ path: info.outputPath('history-phone-dark-touch.png'), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  } finally {
    await context.close();
  }
});
