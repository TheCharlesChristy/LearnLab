// AC-01 (app half) — the fixture course tree, added as FILES ONLY under
// tests/fixtures/content/valid (zero src/ changes; see scripts/e2e-prepare.mjs),
// is indexed by build-content and RENDERS in the app: catalogue → course →
// module → lesson. Proves constraint C-5. The pipeline half of AC-01 (index
// generation from a temp root) is covered by tests/pipeline/build-content.test.ts.

import { expect, test } from '@playwright/test';

import { COURSE_ID, MODULE_ID, loadFixtureModule } from './helpers';

const mod = loadFixtureModule();

test.describe('AC-01 catalogue and content rendering (fixture content, zero src/ changes)', () => {
  test('AC-01: catalogue shows the fixture subject and course from index.json alone', async ({
    page,
  }) => {
    await page.goto('/');

    // Subject section (§4.2 index: maths → "Mathematics"). exact:true — the
    // maths subject now also lists real pilot courses (e.g. "A-level Pure
    // Mathematics"), so disambiguate from those course-title headings.
    await expect(page.getByRole('heading', { name: 'Mathematics', exact: true })).toBeVisible();

    // Fixture course card: title link, level badge, module count
    // (FR-SHELL-002). The level/module assertions are scoped to the fixture
    // card, since the real pilots also render "A-level" and "1 module ·".
    const fixtureLink = page.getByRole('link', { name: 'Pipeline Test Course' });
    await expect(fixtureLink).toBeVisible();
    // The fixture course card is the smallest container holding both the title
    // link and the module-count line (CourseCard is a <div> Card, not a
    // landmark, so filter rather than role-scope).
    const fixtureCard = page
      .locator('div')
      .filter({ has: fixtureLink })
      .filter({ hasText: /module ·/ })
      .last();
    await expect(fixtureCard.getByText('A-level', { exact: true })).toBeVisible();
    await expect(fixtureCard.getByText(/1 module ·/)).toBeVisible();
  });

  test('AC-01: course → module → lesson renders the fixture lesson markdown', async ({ page }) => {
    await page.goto('/');

    // Catalogue → course page.
    await page.getByRole('link', { name: 'Pipeline Test Course' }).click();
    await expect(page).toHaveURL(new RegExp(`#/course/${COURSE_ID}$`));
    await expect(page.getByRole('heading', { name: 'Pipeline Test Course' })).toBeVisible();
    await expect(
      page.getByText('A fixture course used by the content-pipeline tests.'),
    ).toBeVisible();

    // Course → module page (ordered module list, FR-SHELL-003).
    await page.getByRole('link', { name: `1. ${mod.title}` }).click();
    await expect(page).toHaveURL(new RegExp(`#/module/${MODULE_ID}$`));
    await expect(page.getByRole('heading', { name: mod.title, level: 1 })).toBeVisible();

    // Module → first lesson.
    const firstLesson = mod.lessons[0];
    if (!firstLesson) throw new Error('fixture module has no lessons');
    await page.getByRole('link', { name: `1. ${firstLesson.title}` }).click();
    await expect(page).toHaveURL(new RegExp(`#/module/${MODULE_ID}/lesson/${firstLesson.id}$`));

    // The lesson markdown rendered: its heading ("# Lesson One") and the
    // callout body from 01-one.md are visible (FR-SHELL-004 / §4.5).
    await expect(page.getByRole('heading', { name: firstLesson.title }).first()).toBeVisible();
    await expect(
      page.getByText('The derivative at a point is the gradient of the tangent there.'),
    ).toBeVisible();
  });
});
