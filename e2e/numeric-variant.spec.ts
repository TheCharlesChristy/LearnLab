if (process.env.VITEST) {
  const { test } = await import('vitest');
  test.skip('Numeric variant browser suite needs an explicit local author build', () => {});
} else await import('./numeric-variant.pw');
export {};
