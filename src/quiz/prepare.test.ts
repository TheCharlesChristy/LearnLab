import { describe, expect, it } from 'vitest';

import { prepareAttempt, toOriginalChoiceIndex } from './prepare';
import type { McqQuestion, MultiQuestion, Question, Quiz } from './types';

function mcq(id: string, answer = 1): McqQuestion {
  return {
    type: 'mcq',
    id,
    text: `Question ${id}`,
    choices: ['alpha', 'beta', 'gamma', 'delta'],
    answer,
    explanation: 'why',
  };
}

function multi(id: string, answers: number[]): MultiQuestion {
  return {
    type: 'multi',
    id,
    text: `Question ${id}`,
    choices: ['p', 'q', 'r', 's'],
    answers,
    explanation: 'why',
  };
}

const questions: Question[] = [
  mcq('q1', 0),
  mcq('q2', 3),
  multi('q3', [0, 2]),
  { type: 'numeric', id: 'q4', text: 'n', answer: 1, tolerance: 0, explanation: 'why' },
  { type: 'text', id: 'q5', text: 't', accept: ['x'], explanation: 'why' },
  mcq('q6', 2),
  multi('q7', [1, 3]),
  mcq('q8', 1),
];

const quiz: Quiz = {
  schemaVersion: 1,
  id: 'prep-quiz',
  title: 'Prep quiz',
  questions,
};

describe('prepareAttempt reproducibility (FR-QUIZ-002)', () => {
  it('same quizId + attemptNumber gives the identical attempt', () => {
    const a = prepareAttempt(quiz, 1);
    const b = prepareAttempt(quiz, 1);
    expect(a.map((p) => p.question)).toEqual(b.map((p) => p.question));
    expect(a.map((p) => p.choiceOrder)).toEqual(b.map((p) => p.choiceOrder));
  });
  it('different attemptNumber gives a different question order', () => {
    const a = prepareAttempt(quiz, 1).map((p) => p.question.id);
    const b = prepareAttempt(quiz, 2).map((p) => p.question.id);
    expect(a).not.toEqual(b);
  });
  it('different quiz id gives a different order for the same attempt number', () => {
    const other: Quiz = { ...quiz, id: 'other-quiz' };
    const a = prepareAttempt(quiz, 1).map((p) => p.question.id);
    const b = prepareAttempt(other, 1).map((p) => p.question.id);
    expect(a).not.toEqual(b);
  });
});

describe('pick selection (FR-QUIZ-001/002)', () => {
  it('quiz.pick limits the number of questions', () => {
    const prepared = prepareAttempt({ ...quiz, pick: 3 }, 1);
    expect(prepared).toHaveLength(3);
    const ids = new Set(questions.map((q) => q.id));
    for (const p of prepared) expect(ids.has(p.question.id)).toBe(true);
    expect(new Set(prepared.map((p) => p.question.id)).size).toBe(3);
  });
  it('pickOverride wins over quiz.pick', () => {
    expect(prepareAttempt({ ...quiz, pick: 3 }, 1, 5)).toHaveLength(5);
  });
  it('pick larger than the pool keeps all questions', () => {
    expect(prepareAttempt({ ...quiz, pick: 99 }, 1)).toHaveLength(questions.length);
  });
});

describe('question shuffling', () => {
  it('shuffles by default (permutation of the originals)', () => {
    const ids = prepareAttempt(quiz, 1).map((p) => p.question.id);
    expect([...ids].sort()).toEqual(questions.map((q) => q.id).sort());
  });
  it('shuffleQuestions: false preserves authored order', () => {
    const ids = prepareAttempt({ ...quiz, shuffleQuestions: false }, 1).map((p) => p.question.id);
    expect(ids).toEqual(questions.map((q) => q.id));
  });
});

describe('choice shuffling and answer remapping', () => {
  it('remaps mcq answer so the displayed correct choice is the authored one', () => {
    for (const attempt of [1, 2, 3, 4, 5]) {
      for (const p of prepareAttempt(quiz, attempt)) {
        if (p.question.type !== 'mcq' || p.original.type !== 'mcq') continue;
        expect([...p.question.choices].sort()).toEqual([...p.original.choices].sort());
        expect(p.question.choices[p.question.answer]).toBe(
          p.original.choices[p.original.answer],
        );
      }
    }
  });
  it('remaps multi answers to the same set of choice texts', () => {
    for (const attempt of [1, 2, 3]) {
      for (const p of prepareAttempt(quiz, attempt)) {
        const displayed = p.question;
        const original = p.original;
        if (displayed.type !== 'multi' || original.type !== 'multi') continue;
        const displayedTexts = displayed.answers.map((i) => displayed.choices[i]).sort();
        const originalTexts = original.answers.map((i) => original.choices[i]).sort();
        expect(displayedTexts).toEqual(originalTexts);
      }
    }
  });
  it('choiceOrder maps displayed index back to the authored index', () => {
    for (const p of prepareAttempt(quiz, 1)) {
      if (!p.choiceOrder) continue;
      if (p.question.type !== 'mcq' && p.question.type !== 'multi') continue;
      if (p.original.type !== 'mcq' && p.original.type !== 'multi') continue;
      p.question.choices.forEach((choice, displayed) => {
        if (p.original.type !== 'mcq' && p.original.type !== 'multi') return;
        expect(p.original.choices[toOriginalChoiceIndex(p, displayed)]).toBe(choice);
      });
    }
  });
  it('actually reorders choices for some question (sanity)', () => {
    const all = [1, 2, 3, 4, 5].flatMap((n) => prepareAttempt(quiz, n));
    const reordered = all.some(
      (p) =>
        p.question.type === 'mcq' &&
        p.original.type === 'mcq' &&
        p.question.choices.join() !== p.original.choices.join(),
    );
    expect(reordered).toBe(true);
  });
  it('shuffleChoices: false keeps choices and answers untouched', () => {
    const prepared = prepareAttempt({ ...quiz, shuffleChoices: false }, 1);
    for (const p of prepared) {
      expect(p.question).toBe(p.original);
      expect(p.choiceOrder).toBeUndefined();
    }
  });
  it('numeric and text questions are never given a choiceOrder', () => {
    for (const p of prepareAttempt(quiz, 1)) {
      if (p.question.type === 'numeric' || p.question.type === 'text') {
        expect(p.choiceOrder).toBeUndefined();
        expect(p.question).toBe(p.original);
      }
    }
  });
});
