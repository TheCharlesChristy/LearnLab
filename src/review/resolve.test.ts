import { describe, expect, it, vi } from 'vitest';

import type { ModuleLocation } from '../content';
import type { Quiz } from '../quiz';
import type { ScreenSequence } from '../screens';
import type { ReviewState } from '../progress';

import { resolveReviewItem } from './resolve';
import type { ResolverDeps } from './resolve';
import { interleaveByModule, planSession, predictedRecall } from './session';

const LOC: ModuleLocation = {
  subjectId: 'maths',
  coursePath: 'maths/c',
  course: {
    schemaVersion: 1,
    id: 'c',
    title: 'Course C',
    subject: 'maths',
    level: 'alevel',
    description: '',
    modules: [{ id: 'm1', dir: 'm1' }],
  },
  moduleRef: { id: 'm1', dir: 'm1' },
  module: {
    schemaVersion: 1,
    id: 'm1',
    title: 'Module One',
    description: '',
    estMinutes: 10,
    prerequisites: [],
    objectives: [],
    lessons: [
      { id: 'intro', title: 'Intro lesson', file: '01.screens.json', kind: 'screens', estMinutes: 5 },
      { id: 'notes', title: 'Notes lesson', file: '02.md', estMinutes: 5 },
    ],
    assessment: { file: 'assessment.json', passMark: 0.7 },
    version: '1.0.0',
    authors: [],
  },
};

const SEQ: ScreenSequence = {
  schemaVersion: 1,
  id: 'intro',
  title: 'Intro',
  screens: [
    { type: 'predict', id: 'p', prompt: 'guess', choices: ['a', 'b'], reveal: 'r' },
    {
      type: 'tap-choice',
      id: 't',
      prompt: 'Which?',
      choices: [{ text: 'A', feedback: 'Not A because…' }, { text: 'B' }],
      correctIndex: 1,
      successFeedback: 'B, because…',
    },
    {
      type: 'faded-step',
      id: 'f',
      worked: 'Step 1…',
      prompt: 'Finish it',
      inputMode: 'text',
      accept: ['2n\\s*\\+\\s*1'],
    },
    { type: 'flash-recall', id: 'r', front: 'Front?', back: 'Back.' },
  ],
};

const ASSESSMENT: Quiz = {
  schemaVersion: 1,
  id: 'm1-assessment',
  title: 'A',
  questions: [
    { type: 'numeric', id: 'q1', text: '2+2?', answer: 4, tolerance: 0, unit: 'm', explanation: 'Adds.' },
  ],
};

const INLINE: Quiz = {
  schemaVersion: 1,
  id: 'check',
  title: 'Inline',
  questions: [
    { type: 'multi', id: 'q2', text: 'Pick', choices: ['x', 'y', 'z'], answers: [2, 0], explanation: 'e' },
  ],
};

function deps(overrides: Partial<ResolverDeps> = {}): ResolverDeps {
  return {
    findModule: vi.fn(async (id: string) => (id === 'm1' ? LOC : null)),
    loadQuiz: vi.fn(async (_c: string, _d: string, file: string) => {
      if (file === 'assessment.json') return ASSESSMENT;
      if (file === 'check.json') return INLINE;
      throw new Error('404');
    }),
    loadScreenSequence: vi.fn(async () => SEQ),
    loadLessonMarkdown: vi.fn(async () => 'Text\n\n::widget{type="quiz" src="./check.json"}\n'),
    fetchJson: vi.fn(async () => ({ cards: [{ front: 'F0', back: 'B0' }, { front: 'F1', back: 'B1' }] })),
    moduleBaseUrl: () => '/content/maths/c/m1/',
    ...overrides,
  };
}

describe('resolveReviewItem (D-033)', () => {
  it('resolves a tap-choice screen with its lesson as the source', async () => {
    const r = await resolveReviewItem('m1', 'screen:intro:t', deps());
    expect('missing' in r).toBe(false);
    if ('missing' in r) return;
    expect(r.source).toMatchObject({
      moduleTitle: 'Module One',
      lessonTitle: 'Intro lesson',
      href: '/module/m1/lesson/intro',
    });
    expect(r.card).toMatchObject({
      kind: 'choice',
      choices: ['A', 'B'],
      correct: [1],
      choiceFeedback: ['Not A because…', undefined],
    });
  });

  it('resolves a faded-step screen with worked context and a readable answer', async () => {
    const r = await resolveReviewItem('m1', 'screen:intro:f', deps());
    if ('missing' in r) throw new Error('unresolved');
    expect(r.card).toMatchObject({ kind: 'entry', context: 'Step 1…', displayAnswer: '2n + 1' });
  });

  it('resolves flash-recall screens and flashcard decks to recall cards', async () => {
    const screen = await resolveReviewItem('m1', 'screen:intro:r', deps());
    if ('missing' in screen) throw new Error('unresolved');
    expect(screen.card).toEqual({ kind: 'recall', front: 'Front?', back: 'Back.' });

    const d = deps();
    const card = await resolveReviewItem('m1', 'flashcards:cards/deck.json:1', d);
    if ('missing' in card) throw new Error('unresolved');
    expect(card.card).toEqual({ kind: 'recall', front: 'F1', back: 'B1' });
    expect(d.fetchJson).toHaveBeenCalledWith('/content/maths/c/m1/cards/deck.json');
  });

  it('finds assessment questions first, then inline lesson quizzes', async () => {
    const a = await resolveReviewItem('m1', 'm1-assessment:q1', deps());
    if ('missing' in a) throw new Error('unresolved');
    expect(a.card).toMatchObject({ kind: 'entry', inputMode: 'numeric', displayAnswer: '4 m' });
    expect(a.source.href).toBe('/module/m1');

    const b = await resolveReviewItem('m1', 'check:q2', deps());
    if ('missing' in b) throw new Error('unresolved');
    expect(b.card).toMatchObject({ kind: 'choice', multi: true, correct: [0, 2] });
    expect(b.source.lessonTitle).toBe('Notes lesson');
  });

  it('reports removed content as not-found and load failures as load-error', async () => {
    expect(await resolveReviewItem('gone', 'x:y', deps())).toMatchObject({ missing: true, reason: 'not-found' });
    expect(await resolveReviewItem('m1', 'screen:intro:p', deps())).toMatchObject({ reason: 'not-found' }); // predict isn't a checkpoint
    expect(await resolveReviewItem('m1', 'screen:nope:t', deps())).toMatchObject({ reason: 'not-found' });
    expect(await resolveReviewItem('m1', 'flashcards:d.json:9', deps())).toMatchObject({ reason: 'not-found' });
    expect(
      await resolveReviewItem('m1', 'screen:intro:t', deps({ loadScreenSequence: vi.fn(async () => { throw new Error('offline'); }) })),
    ).toMatchObject({ reason: 'load-error' });
  });
});

describe('review session planning', () => {
  const now = 1_800_000_000_000;
  const DAY = 86_400_000;
  function row(moduleId: string, itemId: string, reviewedDaysAgo: number, stability: number): ReviewState {
    return {
      moduleId,
      itemId,
      easinessFactor: 2.5,
      intervalDays: 1,
      repetitions: 1,
      dueAt: now - DAY,
      lastReviewedAt: now - reviewedDaysAgo * DAY,
      lastQuality: 4,
      updatedAt: now,
      stability,
      difficulty: 5,
    };
  }

  it('interleaves round-robin across modules', () => {
    const out = interleaveByModule([
      { moduleId: 'a', n: 1 },
      { moduleId: 'a', n: 2 },
      { moduleId: 'a', n: 3 },
      { moduleId: 'b', n: 4 },
      { moduleId: 'c', n: 5 },
    ]);
    expect(out.map((x) => x.n)).toEqual([1, 4, 5, 2, 3]);
  });

  it('keeps the most-at-risk items when the queue exceeds one session', () => {
    const rows = [
      row('a', 'strong', 1, 30),
      row('a', 'weakest', 20, 1),
      row('b', 'weak', 10, 2),
    ];
    expect(predictedRecall(rows[1]!, now)).toBeLessThan(predictedRecall(rows[0]!, now));
    const plan = planSession(rows, now, 2);
    expect(plan.map((r) => r.itemId).sort()).toEqual(['weak', 'weakest']);
    expect(plan.map((r) => r.moduleId)).toEqual(['a', 'b']);
  });
});
