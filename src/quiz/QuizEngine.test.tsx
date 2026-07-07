import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LessonContext } from '../content/lesson-context';
import type { LessonContextValue } from '../content/lesson-context';
import { QuizEngine } from './QuizEngine';
import type { Quiz } from './types';

const flowQuiz: Quiz = {
  schemaVersion: 1,
  id: 'flow-quiz',
  title: 'Flow quiz',
  shuffleQuestions: false,
  shuffleChoices: false,
  questions: [
    {
      type: 'mcq',
      id: 'q-mcq',
      text: 'The derivative of a constant is…',
      choices: ['0', 'the constant', '1'],
      answer: 0,
      explanation: 'A constant has zero rate of change.',
    },
    {
      type: 'numeric',
      id: 'q-num',
      text: 'What is 1200?',
      answer: 1200,
      tolerance: 0.001,
      unit: 'm',
      explanation: 'It is 1.2e3.',
    },
  ],
};

const multiTextQuiz: Quiz = {
  schemaVersion: 1,
  id: 'multi-text-quiz',
  title: 'Multi and text',
  shuffleQuestions: false,
  shuffleChoices: false,
  questions: [
    {
      type: 'multi',
      id: 'q-multi',
      text: 'Select the even numbers',
      choices: ['1', '2', '3', '4'],
      answers: [1, 3],
      explanation: '2 and 4 are even.',
    },
    {
      type: 'text',
      id: 'q-text',
      text: 'Name the animal',
      accept: ['cat'],
      explanation: 'It is a cat.',
    },
  ],
};

function renderWithContext(
  ui: ReactNode,
  recordAttempt: LessonContextValue['recordAttempt'] = vi.fn().mockResolvedValue(undefined),
) {
  const value: LessonContextValue = {
    moduleId: 'mod-1',
    moduleBaseUrl: '/content/maths/m1/',
    recordAttempt,
    getItemState: vi.fn().mockResolvedValue(null),
    setItemState: vi.fn().mockResolvedValue(undefined),
    recordReview: vi.fn().mockResolvedValue(undefined),
    seedReviewItem: vi.fn().mockResolvedValue(undefined),
  };
  const result = render(<LessonContext.Provider value={value}>{ui}</LessonContext.Provider>);
  return { ...result, ctx: value };
}

afterEach(() => {
  cleanup(); // no vitest globals → RTL auto-cleanup is off
  vi.restoreAllMocks();
});

describe('QuizEngine flow (FR-QUIZ-001)', () => {
  it('shows progress, per-question feedback with explanation, then a summary with review', async () => {
    const user = userEvent.setup();
    const onFinished = vi.fn();
    const recordAttempt = vi.fn().mockResolvedValue(undefined);
    const { ctx } = renderWithContext(
      <QuizEngine
        quiz={flowQuiz}
        attemptNumber={1}
        kind="inline-quiz"
        onFinished={onFinished}
      />,
      recordAttempt,
    );

    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: '0' }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByText('Correct!')).toBeInTheDocument();
    expect(screen.getByText('A constant has zero rate of change.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Question 2 of 2')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Your answer \(m\)/), '999');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByText('Incorrect.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Finish' }));

    // Summary: score, per-question review (your answer, correct answer, explanation).
    expect(screen.getByText(/Score: 1 \/ 2/)).toBeInTheDocument();
    const review = screen.getAllByRole('listitem');
    expect(review).toHaveLength(2);
    expect(within(review[0] as HTMLElement).getByText(/Your answer: 0/)).toBeInTheDocument();
    expect(within(review[1] as HTMLElement).getByText(/Your answer: 999 m/)).toBeInTheDocument();
    expect(
      within(review[1] as HTMLElement).getByText(/Correct answer: 1200 ± 0.001 m/),
    ).toBeInTheDocument();
    expect(within(review[1] as HTMLElement).getByText('It is 1.2e3.')).toBeInTheDocument();

    expect(onFinished).toHaveBeenCalledWith({ score: 1, maxScore: 2 });
    await waitFor(() => expect(recordAttempt).toHaveBeenCalledTimes(1));

    // §13 roadmap (D-021/D-022): the missed numeric question (q-num) is
    // seeded into the review queue; the correctly-answered mcq (q-mcq) is not.
    expect(ctx.seedReviewItem).toHaveBeenCalledTimes(1);
    expect(ctx.seedReviewItem).toHaveBeenCalledWith('flow-quiz:q-num');
  });

  it('handles multi (checkboxes) and text questions', async () => {
    const user = userEvent.setup();
    renderWithContext(<QuizEngine quiz={multiTextQuiz} attemptNumber={1} kind="inline-quiz" />);

    await user.click(screen.getByRole('checkbox', { name: '2' }));
    await user.click(screen.getByRole('checkbox', { name: '4' }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByText('Correct!')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));

    await user.type(screen.getByLabelText(/Your answer/), 'CAT');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByText('Correct!')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Finish' }));

    expect(screen.getByText(/Score: 2 \/ 2/)).toBeInTheDocument();
  });

  it('Retry button calls onRetry', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const oneQuestion: Quiz = { ...flowQuiz, questions: [flowQuiz.questions[0]!] };
    renderWithContext(
      <QuizEngine quiz={oneQuestion} attemptNumber={1} kind="inline-quiz" onRetry={onRetry} />,
    );
    await user.click(screen.getByRole('radio', { name: '0' }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await user.click(screen.getByRole('button', { name: 'Finish' }));
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('uses renderMarkdown for question text and explanations when provided', async () => {
    const user = userEvent.setup();
    const renderMarkdown = (md: string) => <em data-testid="md">{md.toUpperCase()}</em>;
    renderWithContext(
      <QuizEngine
        quiz={{ ...flowQuiz, questions: [flowQuiz.questions[0]!] }}
        attemptNumber={1}
        kind="inline-quiz"
        renderMarkdown={renderMarkdown}
      />,
    );
    expect(screen.getByText('THE DERIVATIVE OF A CONSTANT IS…')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /^0$/i }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(screen.getByText('A CONSTANT HAS ZERO RATE OF CHANGE.')).toBeInTheDocument();
  });
});

describe('numeric input validation (FR-QUIZ-004)', () => {
  it('invalid input disables Submit and shows an inline hint; valid input enables it', async () => {
    const user = userEvent.setup();
    const numericOnly: Quiz = { ...flowQuiz, questions: [flowQuiz.questions[1]!] };
    renderWithContext(<QuizEngine quiz={numericOnly} attemptNumber={1} kind="inline-quiz" />);

    const input = screen.getByLabelText(/Your answer/);
    const submit = screen.getByRole('button', { name: 'Submit' });

    expect(submit).toBeDisabled(); // empty

    await user.type(input, '1,2');
    expect(submit).toBeDisabled();
    expect(screen.getByText(/Enter a number/)).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'true');

    await user.clear(input);
    await user.type(input, '-');
    expect(submit).toBeDisabled();

    await user.clear(input);
    await user.type(input, '1.2e3');
    expect(submit).toBeEnabled();
    expect(screen.queryByText(/Enter a number/)).not.toBeInTheDocument();

    await user.click(submit);
    expect(screen.getByText('Correct!')).toBeInTheDocument();
  });
});

describe('accessibility (FR-QUIZ-005, NFR-A11Y-001, AC-07)', () => {
  it('renders the feedback container with aria-live="polite" before and after answering', async () => {
    const user = userEvent.setup();
    const { container } = renderWithContext(
      <QuizEngine quiz={flowQuiz} attemptNumber={1} kind="inline-quiz" />,
    );
    const live = container.querySelector('[aria-live="polite"]');
    expect(live).not.toBeNull();
    expect(live).toBeEmptyDOMElement();

    await user.click(screen.getByRole('radio', { name: 'the constant' }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent('Incorrect.');
  });

  it('completes an mcq + numeric quiz with the keyboard only', async () => {
    const user = userEvent.setup();
    const recordAttempt = vi.fn().mockResolvedValue(undefined);
    renderWithContext(
      <QuizEngine quiz={flowQuiz} attemptNumber={1} kind="inline-quiz" />,
      recordAttempt,
    );

    // Q1 (mcq): Tab to the first radio (the correct one), Space to select.
    await user.tab();
    expect(screen.getByRole('radio', { name: '0' })).toHaveFocus();
    await user.keyboard(' ');
    expect(screen.getByRole('radio', { name: '0' })).toBeChecked();

    // Tab to Submit, Enter.
    await user.tab();
    expect(screen.getByRole('button', { name: 'Submit' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByText('Correct!')).toBeInTheDocument();

    // Same (still-focused) button is now Next.
    await user.keyboard('{Enter}');
    expect(screen.getByText('Question 2 of 2')).toBeInTheDocument();

    // Q2 (numeric): focus moved to the progress line; Tab reaches the input.
    await user.tab();
    expect(screen.getByLabelText(/Your answer/)).toHaveFocus();
    await user.keyboard('1.2e3');
    await user.tab();
    expect(screen.getByRole('button', { name: 'Submit' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByText('Correct!')).toBeInTheDocument();
    await user.keyboard('{Enter}'); // Finish

    expect(screen.getByText(/Score: 2 \/ 2/)).toBeInTheDocument();
    await waitFor(() => expect(recordAttempt).toHaveBeenCalledTimes(1));
  });
});

describe('attempt recording (FR-QUIZ-003, §5.5, NFR-REL-001)', () => {
  it('records one attempt with the answers echo in authored index space', async () => {
    const user = userEvent.setup();
    const recordAttempt = vi.fn().mockResolvedValue(undefined);
    // shuffleChoices on (default): the echo must remap to authored indices.
    const shuffled: Quiz = {
      schemaVersion: 1,
      id: 'shuffled-quiz',
      title: 'Shuffled',
      questions: [
        {
          type: 'mcq',
          id: 'q1',
          text: 'Pick gamma',
          choices: ['alpha', 'beta', 'gamma', 'delta'],
          answer: 2,
          explanation: 'gamma it is',
        },
      ],
    };
    const before = Date.now();
    renderWithContext(
      <QuizEngine quiz={shuffled} attemptNumber={1} kind="assessment" />,
      recordAttempt,
    );

    await user.click(screen.getByRole('radio', { name: 'gamma' }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await user.click(screen.getByRole('button', { name: 'Finish' }));

    await waitFor(() => expect(recordAttempt).toHaveBeenCalledTimes(1));
    const attempt = recordAttempt.mock.calls[0]![0] as {
      moduleId: string;
      itemId: string;
      kind: string;
      score: number;
      maxScore: number;
      startedAt: number;
      finishedAt: number;
      answers: { questionId: string; given: unknown; correct: boolean }[];
    };
    expect(attempt.moduleId).toBe('mod-1');
    expect(attempt.itemId).toBe('shuffled-quiz');
    expect(attempt.kind).toBe('assessment');
    expect(attempt.score).toBe(1);
    expect(attempt.maxScore).toBe(1);
    expect(attempt.startedAt).toBeGreaterThanOrEqual(before);
    expect(attempt.finishedAt).toBeGreaterThanOrEqual(attempt.startedAt);
    // Echo uses the authored choice index (2 = gamma) regardless of shuffle.
    expect(attempt.answers).toEqual([{ questionId: 'q1', given: 2, correct: true }]);
  });

  it('practice mode records nothing but still calls onFinished and labels the summary', async () => {
    const user = userEvent.setup();
    const recordAttempt = vi.fn().mockResolvedValue(undefined);
    const onFinished = vi.fn();
    const oneQuestion: Quiz = { ...flowQuiz, questions: [flowQuiz.questions[0]!] };
    renderWithContext(
      <QuizEngine
        quiz={oneQuestion}
        attemptNumber={1}
        kind="assessment"
        practiceMode
        onFinished={onFinished}
      />,
      recordAttempt,
    );
    await user.click(screen.getByRole('radio', { name: '0' }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await user.click(screen.getByRole('button', { name: 'Finish' }));

    expect(screen.getByText(/Practice mode — this attempt was not recorded\./)).toBeInTheDocument();
    expect(onFinished).toHaveBeenCalledWith({ score: 1, maxScore: 1 });
    await new Promise((r) => setTimeout(r, 0));
    expect(recordAttempt).not.toHaveBeenCalled();
  });

  it('practice mode does not seed missed questions into the review queue either (§13 roadmap)', async () => {
    const user = userEvent.setup();
    const numericOnly: Quiz = { ...flowQuiz, questions: [flowQuiz.questions[1]!] };
    const { ctx } = renderWithContext(
      <QuizEngine quiz={numericOnly} attemptNumber={1} kind="assessment" practiceMode />,
    );
    await user.type(screen.getByLabelText(/Your answer \(m\)/), '0');
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await user.click(screen.getByRole('button', { name: 'Finish' }));

    await new Promise((r) => setTimeout(r, 0));
    expect(ctx.seedReviewItem).not.toHaveBeenCalled();
  });

  it('completes without recording when no LessonContext is present (tests/storybook)', async () => {
    const user = userEvent.setup();
    const oneQuestion: Quiz = { ...flowQuiz, questions: [flowQuiz.questions[0]!] };
    render(<QuizEngine quiz={oneQuestion} attemptNumber={1} kind="inline-quiz" />);
    await user.click(screen.getByRole('radio', { name: '0' }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await user.click(screen.getByRole('button', { name: 'Finish' }));
    expect(screen.getByText(/Score: 1 \/ 1/)).toBeInTheDocument();
  });

  it('surfaces recordAttempt failures via console.error and an inline notice', async () => {
    const user = userEvent.setup();
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const recordAttempt = vi.fn().mockRejectedValue(new Error('db down'));
    const oneQuestion: Quiz = { ...flowQuiz, questions: [flowQuiz.questions[0]!] };
    renderWithContext(
      <QuizEngine quiz={oneQuestion} attemptNumber={1} kind="assessment" />,
      recordAttempt,
    );
    await user.click(screen.getByRole('radio', { name: '0' }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await user.click(screen.getByRole('button', { name: 'Finish' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be saved/i);
    expect(error).toHaveBeenCalledWith('[quiz] failed to record attempt', expect.any(Error));
    // The summary is still intact (never throws into render).
    expect(screen.getByText(/Score: 1 \/ 1/)).toBeInTheDocument();
  });
});
