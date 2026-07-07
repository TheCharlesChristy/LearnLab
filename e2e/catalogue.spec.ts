// Loader shim: vitest's default include picks up e2e/*.spec.ts, but these
// suites are Playwright tests (Playwright's test() throws outside
// `playwright test`) and vite.config.ts is outside this task's allowlist.
// Under vitest this registers one skipped placeholder; under Playwright it
// loads the real suite from ./catalogue.pw.ts.
if (process.env.VITEST) {
  const { test } = await import('vitest');
  test.skip('Playwright e2e suite — run with `npx playwright test` (see e2e/catalogue.pw.ts)', () => {});
} else {
  await import('./catalogue.pw');
}

export {};
