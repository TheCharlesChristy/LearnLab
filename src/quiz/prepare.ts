// Attempt preparation — applies `pick` and shuffling per FR-QUIZ-001/002.
// Pure: same (quiz, attemptNumber, pickOverride) → same prepared attempt.

import type { Question, Quiz } from './types';
import { attemptSeed, mulberry32, pickN, shuffle } from './seeded';

export interface PreparedQuestion {
  /**
   * The question as displayed: for mcq/multi with choice shuffling on, the
   * `choices` are reordered and `answer`/`answers` indices are remapped to
   * match, so marking functions work directly on this object.
   */
  question: Question;
  /** The question as authored (original choice indices). */
  original: Question;
  /** mcq/multi only: displayed choice index → original choice index. */
  choiceOrder?: number[];
}

/** Map a displayed choice index back to the authored index (for the answers echo). */
export function toOriginalChoiceIndex(prepared: PreparedQuestion, displayedIndex: number): number {
  return prepared.choiceOrder?.[displayedIndex] ?? displayedIndex;
}

/**
 * Build the question list for one attempt. Seeded with
 * hash(quizId + ':' + attemptNumber) so attempts are reproducible (FR-QUIZ-002).
 * `shuffleQuestions` / `shuffleChoices` default to true (§4.6).
 */
export function prepareAttempt(
  quiz: Quiz,
  attemptNumber: number,
  pickOverride?: number,
): PreparedQuestion[] {
  const rng = mulberry32(attemptSeed(quiz.id, attemptNumber));

  let selected: Question[] = [...quiz.questions];
  const pick = pickOverride ?? quiz.pick;
  if (pick !== undefined) {
    const n = Math.max(1, Math.min(Math.floor(pick), selected.length));
    if (n < selected.length) selected = pickN(selected, n, rng);
  }

  if (quiz.shuffleQuestions !== false) selected = shuffle(selected, rng);

  const shuffleChoices = quiz.shuffleChoices !== false;
  return selected.map((q): PreparedQuestion => {
    if (!shuffleChoices || (q.type !== 'mcq' && q.type !== 'multi')) {
      return { question: q, original: q };
    }
    const order = shuffle(
      q.choices.map((_, i) => i),
      rng,
    );
    const choices = order.map((i) => q.choices[i] ?? '');
    if (q.type === 'mcq') {
      return {
        question: { ...q, choices, answer: order.indexOf(q.answer) },
        original: q,
        choiceOrder: order,
      };
    }
    return {
      question: {
        ...q,
        choices,
        answers: q.answers.map((a) => order.indexOf(a)).sort((a, b) => a - b),
      },
      original: q,
      choiceOrder: order,
    };
  });
}
