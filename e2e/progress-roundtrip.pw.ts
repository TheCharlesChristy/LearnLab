// AC-03 end-to-end: complete lessons (manual "Mark lesson complete" button,
// FR-SHELL-004) + pass the assessment → Settings "Download my progress"
// (FR-PROG-003) → "Erase all local data" (FR-PROG-005, typed ERASE) → import
// the downloaded file (FR-PROG-004) → identical progress state, deep-equal on
// moduleState / lessonProgress / attempts modulo updatedAt (and the locally
// reassigned attemptId).
//
// Note: AC-03 says "complete two lessons"; the fixture module has three
// lessons and FR-QUIZ-003 marks a module completed only when ALL lessons are
// done AND the assessment is passed (and §8.6 strict MVC forbids a 2-lesson
// fixture module). So the test completes all three lessons — which includes
// the AC's two — so that the round-trip also restores the 'completed' module
// state and "Module complete" badge.

import fs from 'node:fs';

import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

import {
  MODULE_ID,
  findQuestionByRenderedText,
  loadFixtureAssessment,
  loadFixtureModule,
  typedAnswerFor,
} from './helpers';

const mod = loadFixtureModule();
const quiz = loadFixtureAssessment();
const TOTAL = quiz.questions.length;

/** Tables whose round-trip AC-03 checks deep-equal (modulo updatedAt). */
interface DbDump {
  moduleState: Record<string, unknown>[];
  lessonProgress: Record<string, unknown>[];
  attempts: Record<string, unknown>[];
  itemState: Record<string, unknown>[];
  kv: Record<string, unknown>[];
  reviewState: Record<string, unknown>[];
}

/** Read all object stores of the 'learnlab' Dexie DB via raw IndexedDB. */
function dumpDb(page: Page): Promise<DbDump> {
  return page.evaluate(async () => {
    const open = indexedDB.open('learnlab');
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => reject(open.error);
    });
    const out: Record<string, unknown[]> = {};
    for (const name of ['moduleState', 'lessonProgress', 'attempts', 'itemState', 'kv', 'reviewState']) {
      out[name] = await new Promise<unknown[]>((resolve, reject) => {
        const req = db.transaction(name, 'readonly').objectStore(name).getAll();
        req.onsuccess = () => resolve(req.result as unknown[]);
        req.onerror = () => reject(req.error);
      });
    }
    db.close();
    return out as unknown as DbDump;
  });
}

function strip(rows: Record<string, unknown>[], drop: string[], sortKey: string) {
  return rows
    .map((row) => {
      const copy: Record<string, unknown> = { ...row };
      for (const key of drop) delete copy[key];
      return copy;
    })
    .sort((a, b) => String(a[sortKey]).localeCompare(String(b[sortKey])));
}

/** AC-03 deep-equality on the tables, modulo updatedAt (+ local attemptId). */
function expectSameProgress(actual: DbDump, expected: DbDump) {
  expect(strip(actual.moduleState, ['updatedAt'], 'moduleId')).toEqual(
    strip(expected.moduleState, ['updatedAt'], 'moduleId'),
  );
  expect(strip(actual.lessonProgress, ['updatedAt'], 'lessonId')).toEqual(
    strip(expected.lessonProgress, ['updatedAt'], 'lessonId'),
  );
  // attemptId is auto-increment-local and reassigned on import by design.
  expect(strip(actual.attempts, ['attemptId'], 'startedAt')).toEqual(
    strip(expected.attempts, ['attemptId'], 'startedAt'),
  );
  // D-021 (§13 roadmap): reviewState round-trips too (this fixture flow
  // answers every question correctly, so it's expected to be empty — the
  // check still proves the 6th table survives export/erase/import intact).
  expect(strip(actual.reviewState, ['updatedAt'], 'itemId')).toEqual(
    strip(expected.reviewState, ['updatedAt'], 'itemId'),
  );
}

/** FR-SHELL-004 manual completion path (the scroll sentinel may race us on short pages). */
async function completeLessonManually(page: Page, lessonId: string) {
  await page.goto(`/#/module/${MODULE_ID}/lesson/${lessonId}`);
  const done = page.getByRole('button', { name: 'Lesson completed' });
  const manual = page.getByRole('button', { name: 'Mark lesson complete' });
  await expect(manual.or(done)).toBeVisible();
  if (await manual.isVisible()) {
    // Tolerate the scroll-sentinel auto-complete winning the race (both
    // paths are valid per FR-SHELL-004).
    await manual.click({ timeout: 5_000 }).catch(() => undefined);
  }
  await expect(done).toBeVisible();
  await expect(done).toBeDisabled();
}

/** Answer the current question correctly (questions/choices are shuffled — match by text). */
async function answerCurrentQuestionCorrectly(quizRegion: Locator) {
  const rendered = await quizRegion.innerText();
  const q = findQuestionByRenderedText(rendered, quiz.questions);

  if (q.type === 'mcq') {
    await quizRegion.getByRole('radio', { name: q.choices[q.answer] ?? '', exact: true }).check();
  } else if (q.type === 'multi') {
    for (const i of q.answers) {
      await quizRegion.getByRole('checkbox', { name: q.choices[i] ?? '', exact: true }).check();
    }
  } else {
    await quizRegion.getByRole('textbox').fill(typedAnswerFor(q));
  }

  await quizRegion.getByRole('button', { name: 'Submit' }).click();
  // FR-QUIZ-005: feedback in the polite live region.
  await expect(quizRegion.locator('[aria-live="polite"]')).toContainText('Correct!');
  await quizRegion.getByRole('button', { name: /^(Next|Finish)$/ }).click();
}

test('AC-03: lessons + assessment → export → erase → import restores identical progress', async ({
  page,
}, testInfo) => {
  test.setTimeout(180_000);

  // --- 1. Complete the lessons via the manual button (FR-SHELL-004). -------
  for (const lesson of mod.lessons) {
    await completeLessonManually(page, lesson.id);
  }
  await page.goto(`/#/module/${MODULE_ID}`);
  await expect(page.getByText('Lesson complete', { exact: true })).toHaveCount(mod.lessons.length);

  // --- 2. Pass the assessment (answers computed from the fixture). ---------
  await page.getByRole('link', { name: 'Start assessment' }).click();
  const quizRegion = page.getByRole('region', { name: quiz.title, exact: true });
  for (let i = 1; i <= TOTAL; i++) {
    await expect(quizRegion.getByText(`Question ${i} of ${TOTAL}`)).toBeVisible();
    await answerCurrentQuestionCorrectly(quizRegion);
  }
  await expect(page.getByText(`Score: ${TOTAL} / ${TOTAL}`)).toBeVisible();

  // Module is now completed (FR-QUIZ-003 / FR-PROG-002) with a best score.
  await page.goto(`/#/module/${MODULE_ID}`);
  await expect(page.getByText('Module complete')).toBeVisible();
  await expect(page.getByText(`Best score: ${TOTAL}/${TOTAL}`)).toBeVisible();

  // --- 3. Export (FR-PROG-003). ---------------------------------------------
  const preEraseDump = await dumpDb(page);
  await page.goto('/#/settings');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download my progress' }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^learnlab-progress-\d{8}\.json$/);
  const exportPath = testInfo.outputPath('learnlab-progress.json');
  await download.saveAs(exportPath);

  const exported = JSON.parse(fs.readFileSync(exportPath, 'utf8')) as {
    app: string;
    exportVersion: number;
    tables: DbDump;
  };
  expect(exported.app).toBe('learnlab');
  // D-021 (§13 roadmap): exportVersion bumped to 2 when reviewState was added.
  expect(exported.exportVersion).toBe(2);
  expect(exported.tables.moduleState).toHaveLength(1);
  expect(exported.tables.lessonProgress).toHaveLength(mod.lessons.length);
  expect(exported.tables.attempts).toHaveLength(1);
  // The export snapshots the live DB exactly.
  expectSameProgress(exported.tables, preEraseDump);

  // --- 4. Erase all (FR-PROG-005: typed confirmation, then reload). --------
  await page.getByRole('button', { name: 'Erase all local data' }).click();
  await page.getByLabel('Type ERASE to confirm').fill('ERASE');
  await Promise.all([
    page.waitForEvent('load'), // eraseAll() reloads the page
    page.getByRole('button', { name: 'Erase everything' }).click(),
  ]);
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

  // Progress is gone.
  await page.goto(`/#/module/${MODULE_ID}`);
  await expect(page.getByText('Not attempted yet')).toBeVisible();
  await expect(page.getByText('Lesson complete', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Module complete')).toHaveCount(0);

  // --- 5. Import the downloaded file (FR-PROG-004). ------------------------
  await page.goto('/#/settings');
  await page.getByLabel('Import progress file').setInputFiles(exportPath);
  const summary = page.getByText(/Imported \d+, skipped \d+\./);
  await expect(summary).toBeVisible();
  const summaryText = (await summary.innerText()).match(/Imported (\d+), skipped (\d+)\./);
  const importedRows = Number(summaryText?.[1] ?? 0);
  // At least the moduleState + lessonProgress + attempts rows came back.
  expect(importedRows).toBeGreaterThanOrEqual(
    exported.tables.moduleState.length +
      exported.tables.lessonProgress.length +
      exported.tables.attempts.length,
  );

  // --- 6. Identical progress UI state + deep-equal tables (AC-03). ---------
  await page.goto(`/#/module/${MODULE_ID}`);
  await expect(page.getByText('Module complete')).toBeVisible();
  await expect(page.getByText(`Best score: ${TOTAL}/${TOTAL}`)).toBeVisible();
  await expect(page.getByText('Lesson complete', { exact: true })).toHaveCount(mod.lessons.length);

  const postImportDump = await dumpDb(page);
  expectSameProgress(postImportDump, exported.tables);
  expect(postImportDump.itemState).toEqual([]);
});
