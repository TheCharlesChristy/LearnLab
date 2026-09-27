if (process.env.VITEST) {
  const { test } = await import('vitest');
  test.skip('Author Studio browser suite requires an explicit local author build', () => {});
} else await import('./author-studio.pw');
export {};
