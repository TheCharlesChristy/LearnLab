if (process.env.VITEST) {
  const { test } = await import('vitest');
  test.skip('Author build boundary needs an explicit production browser build', () => {});
} else await import('./author-build-boundary.pw');
export {};
