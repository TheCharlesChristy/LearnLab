import { expect, test } from '@playwright/test';

test.describe('A4 v2 rollout boundary', () => {
  test('default-disabled v2 preserves the v1 catalogue and bounds unknown routes', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Mathematics', exact: true })).toBeVisible();

    await page.goto('/#/experience/unsupported-fixture');
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  });
});
