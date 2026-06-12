// AC-07 — keyboard-ONLY assessment run (NFR-A11Y-001, FR-QUIZ-005).
//
// After the initial page.goto, the test drives the app exclusively with
// page.keyboard (Tab/Arrow/Space/Enter + typing): module page → assessment,
// answers every question (mcq via arrow keys/space, numeric/text typed),
// submits via keyboard, reads each feedback through the aria-live="polite"
// region, and reaches the summary. The practice-mode toggle is skipped.
//
// Questions and choices are shuffled per attempt (FR-QUIZ-002), so each step
// matches the rendered question text against the fixture assessment.json.

import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import {
  MODULE_ID,
  findQuestionByRenderedText,
  loadFixtureAssessment,
  typedAnswerFor,
} from './helpers';

const quiz = loadFixtureAssessment();
const TOTAL = quiz.questions.length;

interface FocusInfo {
  tag: string;
  type: string;
  name: string;
  text: string;
}

function activeElement(page: Page): Promise<FocusInfo> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLInputElement | null;
    return {
      tag: el?.tagName.toLowerCase() ?? '',
      type: el?.type ?? '',
      name: el?.name ?? '',
      text: (el?.textContent ?? '').trim(),
    };
  });
}

/** Press Tab until the focused element satisfies the predicate (keyboard-only nav). */
async function tabTo(page: Page, what: string, predicate: (el: FocusInfo) => boolean) {
  for (let i = 0; i < 50; i++) {
    await page.keyboard.press('Tab');
    if (predicate(await activeElement(page))) return;
  }
  throw new Error(`tabTo: never reached ${what}`);
}

test('AC-07: keyboard-only user completes the full assessment via aria-live feedback', async ({
  page,
}) => {
  test.setTimeout(150_000);

  // Initial navigation — the ONLY non-keyboard interaction in this test.
  await page.goto(`/#/module/${MODULE_ID}`);
  await expect(page.getByRole('link', { name: 'Start assessment' })).toBeVisible();

  // Module page → assessment via Tab + Enter.
  await tabTo(page, 'the Start assessment link', (el) => el.tag === 'a' && el.text === 'Start assessment');
  await page.keyboard.press('Enter');

  const quizRegion = page.getByRole('region', { name: quiz.title, exact: true });
  const liveRegion = quizRegion.locator('[aria-live="polite"]');
  await expect(quizRegion).toBeVisible();

  for (let i = 1; i <= TOTAL; i++) {
    await expect(quizRegion.getByText(`Question ${i} of ${TOTAL}`)).toBeVisible();
    const q = findQuestionByRenderedText(await quizRegion.innerText(), quiz.questions);

    if (q.type === 'mcq') {
      // Displayed choice order is shuffled — find the correct choice's
      // displayed index, then select it with Space/ArrowDown only.
      const labels = (await quizRegion.locator('fieldset label').allInnerTexts()).map((t) =>
        t.trim(),
      );
      const target = labels.indexOf(q.choices[q.answer] ?? '');
      expect(target, `choice "${q.choices[q.answer]}" rendered for ${q.id}`).toBeGreaterThanOrEqual(0);
      await tabTo(page, `a radio of ${q.id}`, (el) => el.type === 'radio' && el.name.startsWith(quiz.id));
      if (target === 0) {
        await page.keyboard.press('Space');
      } else {
        for (let k = 0; k < target; k++) await page.keyboard.press('ArrowDown');
      }
    } else if (q.type === 'multi') {
      const labels = (await quizRegion.locator('fieldset label').allInnerTexts()).map((t) =>
        t.trim(),
      );
      const targets = new Set(q.answers.map((a) => labels.indexOf(q.choices[a] ?? '')));
      expect(targets.has(-1), `all answers of ${q.id} rendered`).toBe(false);
      await tabTo(page, `the first checkbox of ${q.id}`, (el) => el.type === 'checkbox' && el.name.startsWith(quiz.id));
      for (let k = 0; k < labels.length; k++) {
        if (targets.has(k)) await page.keyboard.press('Space');
        if (k < labels.length - 1) await page.keyboard.press('Tab');
      }
    } else {
      // numeric (type digits) / text — both render a single textbox.
      await tabTo(page, `the ${q.type} input of ${q.id}`, (el) => el.tag === 'input' && el.type === 'text');
      await page.keyboard.type(typedAnswerFor(q));
    }

    // Submit via keyboard.
    await tabTo(page, 'the Submit button', (el) => el.tag === 'button' && el.text === 'Submit');
    await page.keyboard.press('Enter');

    // FR-QUIZ-005 / AC-07: feedback is exposed through the polite live region.
    await expect(liveRegion).toContainText('Correct!');
    await expect(liveRegion).toContainText(q.explanation.replace(/\$[^$]*\$/g, '').trim().split(/\s+/)[0] ?? '');

    // Focus stayed on the action button (now Next/Finish) — advance via Enter.
    await page.keyboard.press('Enter');
  }

  // Summary reached, all answers correct.
  await expect(
    page.getByRole('region', { name: `${quiz.title} — summary`, exact: true }),
  ).toBeVisible();
  await expect(page.getByText(`Score: ${TOTAL} / ${TOTAL}`)).toBeVisible();
});
