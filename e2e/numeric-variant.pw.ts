import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { numericAnswer, numericQuestion, numericVariantIndex, numericVariants } from '../src/v2/numeric-variant';
import type { NumericVariantActivity } from '../src/v2/numeric-variant';

test.skip(process.env.VITE_AUTHOR_STUDIO !== 'true', 'Numeric activity preview needs the local Studio build.');

const pack = JSON.parse(readFileSync('public/laboratory/research-station/pack.json', 'utf8'));
const episode = pack.episodes.find((item: { id: string }) => item.id === 'resistance-budget')!;
const node = episode.nodes.find((item: { id: string }) => item.id === 'fresh-ohm-law')!;
const activity = node.activity as NumericVariantActivity;

test('Studio previews the authored circuits task and records a corrected answer as practice', async ({ page }) => {
  await page.goto('/#/author-studio');
  await page.getByLabel('Import pack or author preview').setInputFiles({
    name: 'research-station.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(pack)),
  });
  await expect(page.getByLabel('Import pack or author preview')).toBeEnabled();
  await expect(page.getByLabel('Episode').getByRole('option', { name: 'Tune the sensor heater' })).toHaveCount(1);
  await page.getByLabel('Episode').selectOption(episode.id);
  await page.getByLabel('Starting scene').selectOption(node.id);
  await page.getByLabel('Preview seed (choices and numeric cases)').fill('17');
  await page.getByRole('button', { name: 'Start isolated preview' }).click();
  await expect(page.getByRole('heading', { name: 'Actual workspace preview' })).toBeVisible();
  const index = numericVariantIndex(activity, 1_700_000_000_017, node.id, 0);
  const answer = numericAnswer(activity, numericVariants(activity)[index]!);
  await expect(page.getByText(numericQuestion(activity, index), { exact: true })).toBeVisible();
  await page.getByLabel('Your answer').fill('999');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Not yet.' })).toBeVisible();
  await page.getByLabel('Your answer').fill(String(answer * 1000));
  await page.getByRole('combobox', { name: /^Unit/ }).selectOption('mA');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Answer checked using mA' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page.getByText('Inspect preview events, state and evidence', { exact: true }).click();
  await expect(page.locator('pre').filter({ hasText: '"numeric-answer"' })).toContainText('"independent": false');
});

test('hinted worked example and alternative units remain assisted practice in author preview', async ({ page }) => {
  await page.goto('/#/author-studio');
  await page.getByLabel('Import pack or author preview').setInputFiles({
    name: 'research-station.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(pack)),
  });
  await expect(page.getByLabel('Import pack or author preview')).toBeEnabled();
  await expect(page.getByLabel('Episode').getByRole('option', { name: 'Tune the sensor heater' })).toHaveCount(1);
  await page.getByLabel('Episode').selectOption(episode.id);
  await page.getByLabel('Starting scene').selectOption(node.id);
  await page.getByLabel('Preview seed (choices and numeric cases)').fill('21');
  await page.getByRole('button', { name: 'Start isolated preview' }).click();
  await expect(page.getByRole('heading', { name: 'Actual workspace preview' })).toBeVisible();
  await page.getByRole('button', { name: 'Help', exact: true }).click();
  await page.getByRole('button', { name: 'Show next hint', exact: true }).click();
  await expect(page.locator('.lab-help')).toContainText('Hint 1:');
  await page.getByRole('button', { name: 'Show worked example', exact: true }).click();
  await expect(page.locator('.lab-help')).toContainText('For 6 V across 2 Ω, I = V/R = 6/2 = 3 A.');
  const index = numericVariantIndex(activity, 1_700_000_000_021, node.id, 0);
  const answer = numericAnswer(activity, numericVariants(activity)[index]!);
  await page.getByLabel('Your answer').fill(String(answer * 1000));
  await page.getByRole('combobox', { name: /^Unit/ }).selectOption('mA');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Answer checked using mA' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue investigation' }).click();
  await page.getByText('Inspect preview events, state and evidence', { exact: true }).click();
  await expect(page.locator('pre').filter({ hasText: '"numeric-answer"' })).toContainText('"independent": false');
  await expect(page.locator('pre')).toContainText('"worked": true');
});

test('numeric entry and unit control remain usable at narrow width and 200% text', async ({ page }, info) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/#/author-studio');
  await page.getByLabel('Import pack or author preview').setInputFiles({
    name: 'research-station.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(pack)),
  });
  await expect(page.getByLabel('Import pack or author preview')).toBeEnabled();
  await expect(page.getByLabel('Episode').getByRole('option', { name: 'Tune the sensor heater' })).toHaveCount(1);
  await page.getByLabel('Episode').selectOption(episode.id);
  await page.getByLabel('Starting scene').selectOption(node.id);
  await page.getByRole('button', { name: 'Start isolated preview' }).click();
  await expect(page.getByRole('heading', { name: 'Actual workspace preview' })).toBeVisible();
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await expect(page.getByLabel('Your answer')).toBeVisible();
  await page.getByLabel('Your answer').fill('0.5');
  await page.getByRole('combobox', { name: /^Unit/ }).selectOption('A');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await page.screenshot({ path: info.outputPath('numeric-variant-phone-expanded.png'), fullPage: true });
  const overflow = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    return [...document.querySelectorAll('*')].filter((element) => element.getBoundingClientRect().right > width + 1)
      .slice(0, 12).map((element) => ({ tag: element.tagName, className: element.className,
        right: Math.round(element.getBoundingClientRect().right), text: element.textContent?.slice(0, 50) }));
  });
  expect(overflow).toEqual([]);
  const heights = await Promise.all([
    page.getByLabel('Your answer'),
    page.getByRole('combobox', { name: /^Unit/ }),
    page.getByRole('button', { name: 'Check answer' }),
  ].map((locator) => locator.evaluate((element) => element.getBoundingClientRect().height)));
  expect(heights.every((height) => height >= 44)).toBe(true);
  await page.evaluate(() => { document.documentElement.classList.add('dark'); });
  const colours = await page.getByLabel('Your answer').evaluate((element) => {
    const style = getComputedStyle(element);
    return { background: style.backgroundColor, ink: style.color, border: style.borderColor };
  });
  expect(colours).toEqual({
    background: 'rgb(19, 42, 52)',
    ink: 'rgb(225, 243, 239)',
    border: 'rgb(66, 101, 112)',
  });
  await page.screenshot({ path: info.outputPath('numeric-variant-phone-dark-expanded.png'), fullPage: true });
});
