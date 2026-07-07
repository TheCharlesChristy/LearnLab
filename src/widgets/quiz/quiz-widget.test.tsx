import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Suspense } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LessonContext } from '../../content/lesson-context';
import type { LessonContextValue } from '../../content/lesson-context';
import type { Quiz } from '../../quiz';
import { def, parseQuizWidgetProps } from './index';
import QuizWidget from './QuizWidget';

const quizJson: Quiz = {
  schemaVersion: 1,
  id: 'inline-1',
  title: 'Inline quiz',
  shuffleQuestions: false,
  shuffleChoices: false,
  questions: [
    {
      type: 'mcq',
      id: 'q1',
      text: 'Pick a',
      choices: ['a', 'b'],
      answer: 0,
      explanation: 'a is right',
    },
    {
      type: 'mcq',
      id: 'q2',
      text: 'Pick b',
      choices: ['a', 'b'],
      answer: 1,
      explanation: 'b is right',
    },
  ],
};

function okResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function renderWidget(
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
  return render(<LessonContext.Provider value={value}>{ui}</LessonContext.Provider>);
}

afterEach(() => {
  cleanup(); // no vitest globals → RTL auto-cleanup is off
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('parseQuizWidgetProps (FR-WID-003)', () => {
  it('accepts src alone', () => {
    const r = parseQuizWidgetProps({ src: 'mini-quiz.json' });
    expect(r).toEqual({ ok: true, props: { src: 'mini-quiz.json', pick: undefined } });
  });
  it('accepts pick as number or numeric string', () => {
    expect(parseQuizWidgetProps({ src: 'q.json', pick: 4 })).toEqual({
      ok: true,
      props: { src: 'q.json', pick: 4 },
    });
    expect(parseQuizWidgetProps({ src: 'q.json', pick: '4' })).toEqual({
      ok: true,
      props: { src: 'q.json', pick: 4 },
    });
  });
  it('rejects a missing/empty src, naming the prop', () => {
    const r = parseQuizWidgetProps({});
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.join()).toMatch(/src/);
    expect(parseQuizWidgetProps({ src: '  ' }).ok).toBe(false);
    expect(parseQuizWidgetProps({ src: true }).ok).toBe(false);
  });
  it('rejects non-positive, fractional, or non-numeric pick, naming the prop', () => {
    for (const pick of [0, -1, 1.5, 'three', false] as const) {
      const r = parseQuizWidgetProps({ src: 'q.json', pick });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.errors.join()).toMatch(/pick/);
    }
  });
});

describe('def (widget definition)', () => {
  it('exposes a lazy component and the prop parser', () => {
    expect(def.component).toBeDefined();
    expect(def.parseProps({ src: 'q.json' }).ok).toBe(true);
    expect(def.parseProps({}).ok).toBe(false);
  });

  it('lazy component renders the quiz inside Suspense', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse(quizJson));
    vi.stubGlobal('fetch', fetchMock);
    const Component = def.component as ComponentType<{ src: string }>;
    renderWidget(
      <Suspense fallback="suspended…">
        <Component src="mini-quiz.json" />
      </Suspense>,
    );
    expect(await screen.findByText('Question 1 of 2')).toBeInTheDocument();
  });
});

describe('QuizWidget fetch + engine wiring', () => {
  it('fetches moduleBaseUrl + src and renders the engine', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse(quizJson));
    vi.stubGlobal('fetch', fetchMock);
    renderWidget(<QuizWidget src="mini-quiz.json" />);

    expect(await screen.findByText('Question 1 of 2')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/content/maths/m1/mini-quiz.json');
  });

  it('pick prop overrides the file and limits questions', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse(quizJson));
    vi.stubGlobal('fetch', fetchMock);
    renderWidget(<QuizWidget src="mini-quiz.json" pick={1} />);
    expect(await screen.findByText('Question 1 of 1')).toBeInTheDocument();
  });

  it('records attempts as inline-quiz with itemId = the loaded quiz id', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(okResponse(quizJson));
    vi.stubGlobal('fetch', fetchMock);
    const recordAttempt = vi.fn().mockResolvedValue(undefined);
    renderWidget(<QuizWidget src="mini-quiz.json" pick={1} />, recordAttempt);

    await screen.findByText('Question 1 of 1');
    // Answer whichever question was picked (correct answers differ per question).
    const radios = screen.getAllByRole('radio');
    await user.click(radios[0] as HTMLElement);
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await user.click(screen.getByRole('button', { name: 'Finish' }));

    await vi.waitFor(() => expect(recordAttempt).toHaveBeenCalledTimes(1));
    const attempt = recordAttempt.mock.calls[0]![0] as { itemId: string; kind: string };
    expect(attempt.itemId).toBe('inline-1');
    expect(attempt.kind).toBe('inline-quiz');
  });

  it('Retry on the summary starts attempt 2 (fresh engine, no refetch needed)', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(okResponse(quizJson));
    vi.stubGlobal('fetch', fetchMock);
    renderWidget(<QuizWidget src="mini-quiz.json" pick={1} />);

    await screen.findByText('Question 1 of 1');
    await user.click(screen.getAllByRole('radio')[0] as HTMLElement);
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await user.click(screen.getByRole('button', { name: 'Finish' }));
    expect(screen.getByText(/Score: \d \/ 1/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Question 1 of 1')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('shows a retry card on fetch failure, and retrying recovers (FR-CONT-007)', async () => {
    const user = userEvent.setup();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('nope', { status: 404 }))
      .mockResolvedValueOnce(okResponse(quizJson));
    vi.stubGlobal('fetch', fetchMock);
    renderWidget(<QuizWidget src="missing.json" />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/Couldn’t load quiz/);
    expect(alert).toHaveTextContent(/HTTP 404/);

    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Question 1 of 2')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('rejects JSON that is not quiz-shaped', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse({ hello: 'world' })));
    renderWidget(<QuizWidget src="bad.json" />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/not a valid quiz/);
  });
});
