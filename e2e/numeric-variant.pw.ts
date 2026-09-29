import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { parseLaboratoryPack } from '../src/v2/pack';
import { numericAnswer, numericQuestion, numericVariantIndex, numericVariants } from '../src/v2/numeric-variant';
import type { NumericVariantActivity } from '../src/v2/numeric-variant';

test.skip(process.env.VITE_AUTHOR_STUDIO !== 'true', 'Numeric activity preview needs the local Studio build.');

const activity = JSON.parse(readFileSync('tests/fixtures/numeric-variant-activity.json', 'utf8')) as NumericVariantActivity;
const source = JSON.parse(readFileSync('public/laboratory/research-station/pack.json', 'utf8'));
source.capabilities['numeric-variant'] = '0.1.0';
const changed = source.episodes[0].nodes.find((node: { id: string }) => node.id === 'fresh-fault');
changed.activity = activity;
changed.title = 'Calibrate the current meter';
changed.prompt = 'Use an ideal source and one resistor. Predict the current from the source voltage and resistance, then enter a number with units.';
changed.hints = ['Use the relationship I = V/R.', 'Convert milliamps to amps before comparing with the model.'];
changed.workedExample = 'For 6 V across 2 Ω, the current is 6 ÷ 2 = 3 A.';
changed.mechanism = 'In this ideal DC model, current equals potential difference divided by resistance.';
const pack = parseLaboratoryPack(source);
const episode = pack.episodes[0]!;
const node = episode.nodes.find((item) => item.id === 'fresh-fault')!;

test('Studio previews the authored circuits task and records a corrected answer as practice', async ({ page }) => {
  await page.goto('/#/author-studio');
  await page.getByLabel('Import pack or author preview').setInputFiles({
    name: 'numeric-variant-example.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(pack)),
  });
  await page.getByLabel('Starting scene').selectOption(node.id);
  await page.getByLabel('Preview seed (choices and numeric cases)').fill('17');
  await page.getByRole('button', { name: 'Start isolated preview' }).click();
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

test('numeric entry and unit control remain usable at narrow width and 200% text', async ({ page }, info) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/#/author-studio');
  await page.getByLabel('Import pack or author preview').setInputFiles({
    name: 'numeric-variant-example.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(pack)),
  });
  await page.getByLabel('Starting scene').selectOption(node.id);
  await page.getByRole('button', { name: 'Start isolated preview' }).click();
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
