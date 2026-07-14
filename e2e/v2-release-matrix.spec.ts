// Loader shim: Vitest sees e2e/*.spec.ts, while Playwright owns the real
// browser suite in the matching .pw.ts file.
if (process.env.VITEST) {
  const { test } = await import('vitest');
  test.skip('Playwright e2e suite — run with `npx playwright test` (see e2e/v2-release-matrix.pw.ts)', () => {});
} else {
  await import('./v2-release-matrix.pw');
}

export {};
