// SM-2-lite spaced-repetition algorithm (SRS §13 roadmap item, D-021).
// Pure — no Dexie/IO here, so it's trivially unit-testable and reusable by
// UI that wants to preview "what happens if I grade this Again/Good" before
// committing via recordReview() in ./db.

/**
 * Grading scale shared with the FSRS scheduler (./fsrs.ts, D-033). The
 * original D-021 "lite" scale was two buttons (again/good, matching the
 * flashcards widget); `hard` and `easy` were added so auto-marked review
 * items can report a lucky guess or an effortless recall. The two original
 * grades keep their meaning.
 */
export type { ReviewGrade } from './fsrs';
import type { ReviewGrade } from './fsrs';

/**
 * Fixed SM-2 quality values per grade. Still written to
 * `ReviewState.lastQuality` so older readers of an export see a sensible
 * value (D-021: again 2, good 4; D-033 adds hard 3, easy 5).
 */
export const GRADE_QUALITY: Record<ReviewGrade, number> = { again: 2, hard: 3, good: 4, easy: 5 };

export interface Sm2State {
  easinessFactor: number;
  intervalDays: number;
  repetitions: number;
}

/** A fresh item's starting state, before its first review. */
export const INITIAL_SM2_STATE: Sm2State = {
  easinessFactor: 2.5,
  intervalDays: 0,
  repetitions: 0,
};

/**
 * One SM-2 step from `state` given a quality grade (0-5; below 3 resets the
 * streak to a 1-day interval). Standard SuperMemo-2 EF update, floored at 1.3.
 */
export function sm2Step(state: Sm2State, quality: number): Sm2State {
  const q = Math.max(0, Math.min(5, quality));
  let { easinessFactor, intervalDays, repetitions } = state;
  if (q < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * easinessFactor);
  }
  easinessFactor = Math.max(1.3, easinessFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  return { easinessFactor, intervalDays, repetitions };
}

/** `sm2Step` specialised to the lite 2-button grade scale. */
export function sm2StepLite(state: Sm2State, grade: 'again' | 'good'): Sm2State {
  return sm2Step(state, GRADE_QUALITY[grade]);
}

export const MS_PER_DAY = 86_400_000;

/** The `flashcards` item-id namespace for a given deck `src` and card index. */
export function flashcardReviewItemId(src: string, cardIndex: number): string {
  return `flashcards:${src}:${cardIndex}`;
}

/**
 * The quiz item-id namespace for a question within a given quiz/assessment.
 * Matches what QuizEngine has always seeded (`${quizId}:${questionId}`, no
 * prefix); the review resolver (src/review) treats any id without a known
 * prefix as a quiz item.
 */
export function quizReviewItemId(quizId: string, questionId: string): string {
  return `${quizId}:${questionId}`;
}

/** The screen-lesson item-id namespace (D-033): one checkpoint screen in one lesson. */
export function screenReviewItemId(lessonId: string, screenId: string): string {
  return `screen:${lessonId}:${screenId}`;
}
