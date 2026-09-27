// Keep the production browser suite out of Vitest's default .spec discovery.
if (process.env.VITEST) {
  const { test } = await import('vitest');
  test.skip('Laboratory browser suite — run with VITE_EXPERIENCE_RUNTIME_V2=true playwright test', () => {});
} else {
  await import('./laboratory.pw');
}
export {};
