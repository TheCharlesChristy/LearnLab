// Loader shim (same convention as the other e2e/*.spec.ts files): vitest's
// default include picks up e2e/*.spec.ts, but this suite is a Playwright test
// (Playwright's test() throws outside `playwright test`). Under vitest this
// registers one skipped placeholder; under Playwright it loads the real
// suite from ./v2-rollout.pw.ts.
if (process.env.VITEST) {
  const { test } = await import('vitest');
  test.skip('Playwright e2e suite — run with `npx playwright test` (see e2e/v2-rollout.pw.ts)', () => {});
} else {
  await import('./v2-rollout.pw');
}

export {};
