// Loader shim (see catalogue.spec.ts): under vitest register a skipped
// placeholder; under Playwright load the real @py suite from ./py-ac02.@py.pw.ts.
if (process.env.VITEST) {
  const { test } = await import('vitest');
  test.skip('Playwright @py suite — run with `npx playwright test` (see e2e/py-ac02.@py.pw.ts)', () => {});
} else {
  await import('./py-ac02.@py.pw');
}

export {};
