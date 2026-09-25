// Engine-level tests for retrieval evidence (D-033): checkpoint screens seed
// the spaced-review queue on advance, graded by first-try success, and the
// run summary reaches onSequenceComplete.

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LessonContext } from '../content';
import type { LessonContextValue } from '../content';

import { ScreenSequenceEngine } from './ScreenSequenceEngine';
import type { ScreenSequence } from './types';

afterEach(cleanup);

function makeCtx(): LessonContextValue {
  return {
    moduleId: 'm1',
    moduleBaseUrl: '/content/m1/',
    recordAttempt: vi.fn(async () => {}),
    getItemState: vi.fn(async () => null),
    setItemState: vi.fn(async () => {}),
    recordReview: vi.fn(async () => {}),
    seedReviewItem: vi.fn(async () => {}),
    notifyEngagement: vi.fn(),
  };
}

const SEQ: ScreenSequence = {
  schemaVersion: 1,
  id: 'seq',
  title: 'Seq',
  screens: [
    {
      type: 'predict',
      id: 'p1',
      prompt: 'Guess?',
      choices: ['A', 'B'],
      reveal: 'It was A.',
    },
    {
      type: 'tap-choice',
      id: 't1',
      prompt: 'Pick the right one',
      choices: [{ text: 'Wrong' }, { text: 'Right' }],
      correctIndex: 1,
    },
    {
      type: 'entry',
      id: 'e1',
      prompt: 'What is 2+2?',
      inputMode: 'numeric',
      answer: 4,
      tolerance: 0,
    },
  ],
};

describe('ScreenSequenceEngine retrieval evidence (D-033)', () => {
  it('seeds checkpoints by first-try success and reports a run summary', async () => {
    const user = userEvent.setup();
    const ctx = makeCtx();
    const onComplete = vi.fn();
    render(
      <LessonContext.Provider value={ctx}>
        <ScreenSequenceEngine sequence={SEQ} lessonId="lesson-a" onSequenceComplete={onComplete} />
      </LessonContext.Provider>,
    );

    // predict: not a checkpoint — never seeded.
    await user.click(await screen.findByRole('radio', { name: 'A' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    // tap-choice: correct first time → good.
    await user.click(await screen.findByRole('radio', { name: 'Right' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    // entry: wrong, then right → again.
    const input = await screen.findByLabelText(/Your answer/);
    await user.type(input, '5');
    await user.click(screen.getByRole('button', { name: 'Check' }));
    await user.clear(input);
    await user.type(input, '4');
    await user.click(screen.getByRole('button', { name: 'Check' }));
    await user.click(screen.getByRole('button', { name: 'Finish' }));

    expect(ctx.seedReviewItem).toHaveBeenCalledTimes(2);
    expect(ctx.seedReviewItem).toHaveBeenCalledWith('screen:lesson-a:t1', 'good');
    expect(ctx.seedReviewItem).toHaveBeenCalledWith('screen:lesson-a:e1', 'again');
    expect(onComplete).toHaveBeenCalledWith({ checkpoints: 2, firstTry: 1 });
  });

  it('a wrong tap before the right one counts as not-first-try', async () => {
    const user = userEvent.setup();
    const ctx = makeCtx();
    const seq: ScreenSequence = { ...SEQ, screens: [SEQ.screens[1]!] };
    render(
      <LessonContext.Provider value={ctx}>
        <ScreenSequenceEngine sequence={seq} lessonId="l" onSequenceComplete={() => {}} />
      </LessonContext.Provider>,
    );
    await user.click(await screen.findByRole('radio', { name: 'Wrong' }));
    await user.click(screen.getByRole('radio', { name: 'Right' }));
    await user.click(screen.getByRole('button', { name: 'Finish' }));
    expect(ctx.seedReviewItem).toHaveBeenCalledWith('screen:l:t1', 'again');
  });
});
