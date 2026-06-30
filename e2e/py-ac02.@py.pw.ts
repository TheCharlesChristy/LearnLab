// AC-02 (@py) — reference item 6.13(a) `items/power-rule-quiz.py` loads via REAL
// Pyodide, marks generated answers, records an `attempts` row, and the module
// shows in progress — "with no JS written" (§12 AC-02, §6.13(a)).
//
// This proves the Tier-2 path end-to-end: a single ~30-line Python QuizItem,
// embedded by a lesson's `::py` directive, runs in the Pyodide worker, renders
// its UI through the host component tree, and its PROGRESS message lands in the
// progress store as a python-item attempt (§3.4 steps 4–7, §6.3 PROGRESS,
// §5.5 attempts).
//
// REAL Pyodide is required (no mock), so the test SKIPS GRACEFULLY when
// cdn.jsdelivr.net is unreachable (see py-helpers.skipUnlessPyodideReachable).
// It runs for real in CI. The generated numbers are seeded per attempt, so the
// test reads each rendered question and computes the answer (§6.13(a):
// a*n*x0**(n-1)) rather than assuming any order.

import { expect, test } from '@playwright/test';
import type { Locator } from '@playwright/test';

import {
  PYODIDE_READY_TIMEOUT,
  logBrowserDiagnostics,
  readAttempts,
  readModuleState,
  skipUnlessPyodideReachable,
  solvePowerRuleQuestion,
} from './py-helpers';

const MODULE_ID = 'differentiation-1';
const LESSON_ID = 'power-rule';
const ITEM_ID = 'items/power-rule-quiz';
// The lesson embeds `::py params='{"questions": 4}'` → 4 numeric + 1 mcq.
const EXPECTED_QUESTIONS = 5;

test.describe('@py AC-02 power-rule QuizItem (real Pyodide)', () => {
  test.beforeEach(async () => {
    await skipUnlessPyodideReachable();
  });

  test('@py AC-02: 6.13(a) loads, marks answers, records an attempt, shows in progress', async ({
    page,
  }) => {
    // Cold Pyodide + bundle unpack + quiz run. Allow well beyond the cold-load
    // ceiling (NFR-PY-001 ≤ 20 s) plus the run itself.
    test.setTimeout(180_000);
    logBrowserDiagnostics(page, 'AC-02');

    await page.goto(`/#/module/${MODULE_ID}/lesson/${LESSON_ID}`);

    // The embedded Python item mounts inside its container; scrolling it into
    // view triggers PyHost.ensureRuntime() (FR-PY-002, IntersectionObserver).
    const item = page.locator(`[data-py-item="${ITEM_ID}"]`);
    await item.scrollIntoViewIfNeeded();

    // While loading, the determinate-ish runtime card is shown (FR-PY-003).
    // Wait for it to RESOLVE into rendered quiz UI: the first question prompt
    // ("Question 1 of N") plus the Submit button (§5.4 flow via §6.8 QuizItem).
    const firstQuestion = item.getByText(`Question 1 of ${EXPECTED_QUESTIONS}`);
    await expect(firstQuestion).toBeVisible({ timeout: PYODIDE_READY_TIMEOUT });

    // Answer all questions correctly, reading each rendered prompt.
    for (let i = 1; i <= EXPECTED_QUESTIONS; i++) {
      await expect(item.getByText(`Question ${i} of ${EXPECTED_QUESTIONS}`)).toBeVisible();
      await answerCurrentQuestion(item);
    }

    // Summary with a score (§5.4 / §6.8 summary). All answers correct → 5/5.
    await expect(item.getByText('Summary')).toBeVisible();
    await expect(item.getByText(`Score: ${EXPECTED_QUESTIONS} / ${EXPECTED_QUESTIONS}`)).toBeVisible();

    // AC-02: an attempts row was recorded for this python item (§5.5, §6.3
    // PROGRESS 'scored' → recordAttempt kind:'python-item'). Poll because the
    // write is async after the final RENDER.
    await expect
      .poll(async () => {
        const attempts = await readAttempts(page);
        return attempts.filter(
          (a) => a.moduleId === MODULE_ID && a.itemId === ITEM_ID && a.kind === 'python-item',
        ).length;
      }, { timeout: 15_000 })
      .toBeGreaterThanOrEqual(1);

    const attempts = (await readAttempts(page)).filter(
      (a) => a.moduleId === MODULE_ID && a.itemId === ITEM_ID,
    );
    const last = attempts[attempts.length - 1];
    expect(last, 'a python-item attempt row exists').toBeTruthy();
    expect(last?.score).toBe(EXPECTED_QUESTIONS);
    expect(last?.maxScore).toBe(EXPECTED_QUESTIONS);

    // AC-02: the module shows in progress. Visiting the lesson set the module
    // 'in-progress' (touchLesson, §5.5); the progress page lists it with a
    // resume link (FR-PROG-006).
    const moduleStates = await readModuleState(page);
    expect(
      moduleStates.some((m) => m['moduleId'] === MODULE_ID),
      'differentiation-1 has a moduleState row',
    ).toBe(true);

    await page.goto('/#/progress');
    await expect(
      page.getByRole('link', { name: MODULE_ID }).or(page.getByText(MODULE_ID)).first(),
    ).toBeVisible();
  });
});

/** Answer the question currently rendered in the quiz item, then advance. */
async function answerCurrentQuestion(item: Locator): Promise<void> {
  const rendered = await item.innerText();
  const q = solvePowerRuleQuestion(rendered);

  if (q.kind === 'mcq') {
    // "The derivative of a constant is…" — correct choice is "0".
    await item.getByRole('radio', { name: '0', exact: true }).check();
  } else {
    // Numeric: single labelled textbox ("Your answer", §6.8 NumberInput).
    await item.getByRole('textbox').fill(String(q.answer));
  }

  await item.getByRole('button', { name: 'Submit' }).click();
  // Immediate per-question feedback: "Correct" alert (§5.4 / §6.8).
  await expect(item.getByText('Correct', { exact: true })).toBeVisible();

  // Advance: "Next" for all but the last question, then "Finish".
  await item.getByRole('button', { name: /^(Next|Finish)$/ }).click();
}
