import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import { createPreviewRun, parseAuthorPreview } from '../src/v2/author-preview';
import { projectRun } from '../src/v2/run';
import { parseLaboratoryPack } from '../src/v2/pack';
import { readFileSync } from 'node:fs';
const pack = parseLaboratoryPack(
  JSON.parse(readFileSync('public/laboratory/research-station/pack.json', 'utf8')),
);
async function loadResearchStation(page: Page) {
  await page.getByLabel('Staged course').selectOption(pack.id);
  await page.getByRole('button', { name: 'Load staged pack', exact: true }).click();
}
test.skip(
  process.env.VITE_AUTHOR_STUDIO !== 'true',
  'Author Studio is excluded unless explicitly enabled.',
);

test('author preview shares actual renderer, survives diagnostic export/import and writes no learner rows', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    // Mock API/voice availability for the preference-isolation check, including
    // engines without speech support. This does not test audio playback.
    Object.defineProperty(window, 'speechSynthesis', {
      value: Object.assign(new EventTarget(), {
        cancel() {},
        getVoices: () => [{ localService: true, lang: 'en-GB', name: 'Test local voice' }],
      }),
      configurable: true,
    });
  });
  await page.goto('/#/author-studio');
  await expect(page.getByRole('heading', { name: 'LearnLab Author Studio' })).toBeVisible();
  await loadResearchStation(page);
  await expect(page.getByLabel('Starting scene')).toBeVisible();
  await page.getByLabel('Starting scene').selectOption('fresh-fault');
  await page.getByLabel('Preview seed (choices and numeric cases)').fill('17');
  await page.getByLabel('Hints already used').fill('1');
  await page.getByLabel('Worked example already used').check();
  await page.getByRole('button', { name: 'Start isolated preview', exact: true }).click();
  const title = pack.episodes[0]!.nodes.find((v) => v.id === 'fresh-fault')!.title;
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await page.getByText('Notebook tools', { exact: true }).click();
  await page.getByRole('slider', { name: 'Reading speed' }).focus();
  await page.getByRole('slider', { name: 'Reading speed' }).press('ArrowRight');
  await expect(page.getByRole('slider', { name: 'Reading speed' })).toHaveValue('1.1');
  await page.getByRole('button', { name: 'Help', exact: true }).click();
  await expect(page.locator('.lab-help')).toContainText('Hint 1:');
  await expect(page.locator('.lab-help')).toContainText(
    pack.episodes[0]!.nodes.find((v) => v.id === 'fresh-fault')!.workedExample,
  );
  await page.getByRole('button', { name: '0 A', exact: true }).click();
  await page.getByRole('button', { name: 'Continue investigation', exact: true }).click();
  await page.getByText('Inspect preview events, state and evidence', { exact: true }).click();
  await expect(page.locator('pre').filter({ hasText: '"events"' })).toContainText(
    '"independent": false',
  );
  const pending = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Export reproducible author preview', exact: true })
    .click();
  const file = await pending;
  const filePath = await file.path();
  const fixture = parseAuthorPreview(JSON.parse(fs.readFileSync(filePath!, 'utf8')));
  const projection = projectRun(fixture.pack, fixture.pack.episodes[0]!, createPreviewRun(fixture));
  expect(projection.current).toBe('fresh-reason');
  expect(projection.evidence.every((v) => !v.independent)).toBe(true);
  await page.reload();
  await page.getByLabel('Import pack or author preview').setInputFiles(filePath!);
  await expect(
    page.getByRole('heading', { name: pack.episodes[0]!.nodes.at(-1)!.title }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath('studio-restore.png'), fullPage: true });
  // Query the existing database directly in this isolated test profile; no writes.
  expect(
    await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('learnlab');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const counts = await Promise.all(
        [...db.objectStoreNames].map(
          (name) =>
            new Promise<number>((resolve, reject) => {
              const request = db.transaction(name).objectStore(name).count();
              request.onsuccess = () => resolve(request.result);
              request.onerror = () => reject(request.error);
            }),
        ),
      );
      db.close();
      return counts.reduce((a, b) => a + b, 0);
    }),
  ).toBe(0);
  expect(errors).toEqual([]);
});

test('source validation, undo, new-subject preview and bounded diagnostics', async ({ page }) => {
  await page.goto('/#/author-studio');
  await loadResearchStation(page);
  await expect(page.getByLabel('Starting scene')).toBeVisible();
  await page.getByText('Edit source pack JSON', { exact: true }).click();
  const source = page.getByLabel('Source pack', { exact: true });
  const novel = structuredClone(pack);
  novel.id = 'economic-history';
  novel.subject = { id: 'economic-history', title: 'Economic history' };
  novel.title = 'Investigate a market';
  novel.episodes[0]!.nodes[0]!.title = 'A new subject can use registered tools';
  await source.fill(JSON.stringify(novel));
  await page.getByRole('button', { name: 'Validate and apply source', exact: true }).click();
  await page.getByRole('button', { name: 'Start isolated preview', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: novel.episodes[0]!.nodes[0]!.title }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Undo source edit', exact: true }).click();
  expect(JSON.parse(await source.inputValue()).id).toBe(pack.id);
  await source.fill(JSON.stringify({ ...pack, execute: 'arbitrary-code' }));
  await page.getByRole('button', { name: 'Validate and apply source', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('additional');
  await page.getByLabel('Preview seed (choices and numeric cases)').fill('-1');
  await page.getByRole('button', { name: 'Start isolated preview', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Author preview');
});

test('switching preview episodes clears stale state and archives retain their original content', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/#/author-studio');
  await loadResearchStation(page);
  await page.getByRole('button', { name: 'Start isolated preview', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: pack.episodes[0]!.nodes[0]!.title, exact: true }),
  ).toBeVisible();
  await page.getByText('Archive this notebook and start a new workspace', { exact: true }).click();
  await page.getByRole('button', { name: 'Archive and start new workspace', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Export preview archive 1', exact: true }),
  ).toBeVisible();
  const changed = structuredClone(pack);
  changed.id = 'different-course';
  changed.title = 'Different content';
  const second = structuredClone(changed.episodes[0]!);
  second.id = 'second-investigation';
  second.title = 'Another episode';
  second.nodes[0]!.title = 'Second episode starting scene';
  changed.episodes.push(second);
  await page.getByText('Edit source pack JSON', { exact: true }).click();
  await page.getByLabel('Source pack', { exact: true }).fill(JSON.stringify(changed));
  await page.getByRole('button', { name: 'Validate and apply source', exact: true }).click();
  await page.getByLabel('Episode', { exact: true }).selectOption(second.id);
  await page.getByRole('button', { name: 'Start isolated preview', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: second.nodes[0]!.title, exact: true }),
  ).toBeVisible();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export preview archive 1', exact: true }).click();
  const archive = await pending;
  const saved = parseAuthorPreview(JSON.parse(fs.readFileSync((await archive.path())!, 'utf8')));
  expect(saved.pack.id).toBe(pack.id);
  expect(saved.pack.title).toBe(pack.title);
  expect(saved.episodeId).toBe(pack.episodes[0]!.id);
  expect(errors).toEqual([]);
});

test('phone author controls and expanded text stay within requested viewport', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/#/author-studio');
  await loadResearchStation(page);
  await page.getByRole('button', { name: 'Start isolated preview', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: pack.episodes[0]!.nodes[0]!.title, exact: true }),
  ).toBeVisible();
  for (const expanded of [false, true]) {
    if (expanded)
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });
    expect(
      await page.evaluate(() => ({
        content: document.documentElement.scrollWidth,
        viewport: document.documentElement.clientWidth,
      })),
    ).toMatchObject({ viewport: 360 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      360,
    );
    const targets = await page
      .locator('.lab-studio button:visible')
      .evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().height));
    expect(targets.every((height) => height >= 44)).toBe(true);
    await page.screenshot({
      path: info.outputPath(`studio-phone-${expanded ? 'expanded' : 'normal'}.png`),
      fullPage: true,
    });
  }
});
