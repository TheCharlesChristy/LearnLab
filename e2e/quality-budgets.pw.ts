// A deliberately modest mobile performance regression fixture for v2 / #64.
// CDP CPU throttling is Chromium-only, so playwright.config.ts assigns this
// tag solely to the Chromium Pixel 5 project. These are interaction budgets,
// not lab benchmarks: they catch accidental eager imports or blocking work.

import { expect, test } from '@playwright/test';

test.describe('@low-end v2 quality budgets', () => {
  test('@low-end: throttled mobile starts the catalogue and opens a course promptly', async ({
    page,
    context,
  }) => {
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

    const startup = performance.now();
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Mathematics', exact: true })).toBeVisible();
    expect(performance.now() - startup).toBeLessThan(8_000);

    const interaction = performance.now();
    await page.getByRole('link', { name: 'Pipeline Test Course' }).click();
    await expect(page.getByRole('heading', { name: 'Pipeline Test Course' })).toBeVisible();
    expect(performance.now() - interaction).toBeLessThan(2_500);
  });
});
