import { expect, test } from '@playwright/test';
import fs from 'node:fs';

test('ordinary learner build excludes Studio route and emitted module', async ({ page }) => {
  test.skip(process.env.VITE_AUTHOR_STUDIO === 'true', 'Requires ordinary build.');
  expect(fs.readdirSync('dist/assets').some((file) => file.startsWith('AuthorStudioPage-'))).toBe(
    false,
  );
  await page.goto('/#/author-studio');
  await expect(page.getByRole('heading', { name: 'Page not found', exact: true })).toBeVisible();
});

test('explicit author build rejects a non-loopback document host', async ({ page }) => {
  test.skip(process.env.VITE_AUTHOR_STUDIO !== 'true', 'Requires author build.');
  // Serve local production bytes under a non-loopback URL; no external network request.
  await page.route('http://studio.remote.invalid:4173/**', async (route) => {
    const target = new URL(route.request().url());
    target.hostname = 'localhost';
    const response = await route.fetch({
      url: target.href,
      headers: { ...route.request().headers(), host: target.host },
    });
    await route.fulfill({ response });
  });
  await page.goto('http://studio.remote.invalid:4173/#/author-studio');
  await expect(page.getByRole('alert')).toContainText('only on a loopback host');
  await expect(page.getByRole('heading', { name: 'LearnLab Author Studio' })).toHaveCount(0);
});
