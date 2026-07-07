// Print action for LessonPage (SRS §13 roadmap, D-026): a "Print this
// lesson" button that calls window.print(). Mirrors the mocking setup used
// by src/app/__tests__/lesson.test.tsx (same fixtures/helpers, reused
// unmodified) rather than inventing new test scaffolding.

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../content-api', async () => (await import('../__tests__/fixtures')).contentApiMock());
vi.mock('../../progress', async () => (await import('../__tests__/fixtures')).progressMock());
vi.mock('../../markdown', async () => (await import('../__tests__/fixtures')).markdownMock());
vi.mock('../../python', async () => (await import('../__tests__/fixtures')).pythonMock());

import { resetPyItemSpy } from '../__tests__/fixtures';
import { renderRoute } from '../__tests__/helpers';

afterEach(() => resetPyItemSpy());

describe('LessonPage printable view (SRS §13, D-026)', () => {
  it('"Print this lesson" calls window.print() when clicked', async () => {
    const printSpy = vi.fn();
    vi.stubGlobal('print', printSpy);

    const user = userEvent.setup();
    renderRoute('/module/diff-1/lesson/l1');

    await user.click(await screen.findByRole('button', { name: 'Print this lesson' }));

    expect(printSpy).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });
});
