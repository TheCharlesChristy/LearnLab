import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../content-api', async () => (await import('./fixtures')).contentApiMock());
vi.mock('../../progress', async () => (await import('./fixtures')).progressMock());
vi.mock('../../markdown', async () => (await import('./fixtures')).markdownMock());

// Stub the (lazily imported) quiz engine: render attempt metadata and a
// finish button that records via the LessonContext, like the real engine.
vi.mock('../../quiz', async () => {
  const { useLessonContext } = await import('../../content/lesson-context');
  const QuizEngine = (props: {
    attemptNumber: number;
    kind: string;
    practiceMode?: boolean;
  }) => {
    const ctx = useLessonContext();
    return (
      <div>
        <p>stub-attempt-{props.attemptNumber}</p>
        <p>stub-kind-{props.kind}</p>
        <button
          onClick={() =>
            void ctx.recordAttempt({
              moduleId: ctx.moduleId,
              itemId: 'diff-1-assessment',
              kind: 'assessment',
              score: 6,
              maxScore: 8,
              startedAt: 1,
              finishedAt: 2,
              answers: [],
            })
          }
        >
          finish-quiz
        </button>
      </div>
    );
  };
  return { QuizEngine };
});

import * as progress from '../../progress';

import { renderRoute } from './helpers';

describe('AssessmentPage (FR-QUIZ-003/006)', () => {
  it('records assessment attempts WITH passMarkInfo', async () => {
    const user = userEvent.setup();
    renderRoute('/module/diff-1/assessment');

    await user.click(await screen.findByRole('button', { name: 'finish-quiz' }));

    expect(progress.recordAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'assessment', score: 6, maxScore: 8 }),
      { passMark: 0.7, isAssessment: true },
    );
  });

  it('numbers the attempt from prior recorded attempts + 1', async () => {
    vi.mocked(progress.useAttempts).mockReturnValue([
      { attemptId: 1 },
      { attemptId: 2 },
    ] as never);
    renderRoute('/module/diff-1/assessment');
    expect(await screen.findByText('stub-attempt-3')).toBeInTheDocument();
    expect(screen.getByText('stub-kind-assessment')).toBeInTheDocument();
  });

  it('offers a clearly labelled practice-mode toggle', async () => {
    renderRoute('/module/diff-1/assessment');
    const toggle = await screen.findByRole('checkbox', { name: /Practice mode/ });
    expect(toggle).not.toBeChecked();
    expect(screen.getByText(/not/)).toBeInTheDocument();
  });
});
