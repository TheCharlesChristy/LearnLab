// FSRS-6 spaced-repetition scheduler (D-033) — supersedes SM-2-lite (D-021)
// as the review queue's scheduling model. Pure: no Dexie/IO, so the UI can
// preview outcomes and tests can pin the maths.
//
// FSRS models each item's memory with three quantities (the DSR model):
//   - Stability S: days until recall probability decays from 100% to 90%.
//   - Difficulty D: 1 (easy) … 10 (hard); controls how fast S grows.
//   - Retrievability R: probability of recall right now, R(t, S).
// A review with a rating (Again/Hard/Good/Easy) updates S and D; the next
// interval is the time until R falls to the desired retention (0.9).
//
// Formulas and the 21 default parameters are transcribed from the reference
// implementation (open-spaced-repetition/py-fsrs, FSRS-6), whose defaults
// are fitted on hundreds of millions of real reviews. The open benchmark
// (open-spaced-repetition/srs-benchmark) shows FSRS predicting recall
// markedly better than SM-2, which translates into fewer reviews for the
// same retention. We run it with no intra-day "learning steps": LearnLab
// sessions are day-granular, and same-day re-reviews (a missed item re-asked
// at the end of a review session) use FSRS's own short-term stability rule.

export type ReviewGrade = 'again' | 'hard' | 'good' | 'easy';

/** FSRS's 1–4 rating scale. */
export type FsrsRating = 1 | 2 | 3 | 4;

export const GRADE_RATING: Record<ReviewGrade, FsrsRating> = {
  again: 1,
  hard: 2,
  good: 3,
  easy: 4,
};

/** FSRS-6 default parameters w0…w20 (py-fsrs DEFAULT_PARAMETERS). */
export const FSRS6_DEFAULT_PARAMETERS: readonly number[] = [
  0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001, 1.8722, 0.1666, 0.796, 1.4835,
  0.0614, 0.2629, 1.6483, 0.6014, 1.8729, 0.5425, 0.0912, 0.0658, 0.1542,
];

/** Target probability of recall at the moment an item comes due. */
export const DESIRED_RETENTION = 0.9;
export const MAX_INTERVAL_DAYS = 36_500;

const STABILITY_MIN = 0.001;
const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 10;

export interface FsrsMemory {
  stability: number;
  difficulty: number;
}

const w = FSRS6_DEFAULT_PARAMETERS;
const DECAY = -w[20]!;
const FACTOR = 0.9 ** (1 / DECAY) - 1;

const clampDifficulty = (d: number) => Math.min(MAX_DIFFICULTY, Math.max(MIN_DIFFICULTY, d));
const clampStability = (s: number) => Math.max(STABILITY_MIN, s);

/** Probability of recall after `elapsedDays` for an item with stability `stability`. */
export function retrievability(elapsedDays: number, stability: number): number {
  const t = Math.max(0, elapsedDays);
  return (1 + (FACTOR * t) / clampStability(stability)) ** DECAY;
}

function initialDifficulty(rating: FsrsRating, clamp = true): number {
  const d = w[4]! - Math.exp(w[5]! * (rating - 1)) + 1;
  return clamp ? clampDifficulty(d) : d;
}

/** Memory state after an item's very first rating. */
export function initialMemory(rating: FsrsRating): FsrsMemory {
  return { stability: clampStability(w[rating - 1]!), difficulty: initialDifficulty(rating) };
}

function nextDifficulty(difficulty: number, rating: FsrsRating): number {
  const delta = -(w[6]! * (rating - 3));
  const damped = difficulty + ((10 - difficulty) * delta) / 9; // linear damping
  const reverted = w[7]! * initialDifficulty(4, false) + (1 - w[7]!) * damped; // mean reversion
  return clampDifficulty(reverted);
}

function recallStability(d: number, s: number, r: number, rating: FsrsRating): number {
  const hardPenalty = rating === 2 ? w[15]! : 1;
  const easyBonus = rating === 4 ? w[16]! : 1;
  return (
    s *
    (1 +
      Math.exp(w[8]!) *
        (11 - d) *
        s ** -w[9]! *
        (Math.exp((1 - r) * w[10]!) - 1) *
        hardPenalty *
        easyBonus)
  );
}

function forgetStability(d: number, s: number, r: number): number {
  const longTerm = w[11]! * d ** -w[12]! * ((s + 1) ** w[13]! - 1) * Math.exp((1 - r) * w[14]!);
  const shortTerm = s / Math.exp(w[17]! * w[18]!);
  return Math.min(longTerm, shortTerm);
}

function shortTermStability(s: number, rating: FsrsRating): number {
  let increase = Math.exp(w[17]! * (rating - 3 + w[18]!)) * s ** -w[19]!;
  if (rating >= 2) increase = Math.max(increase, 1);
  return clampStability(s * increase);
}

/**
 * Memory state after rating an item that was last reviewed `elapsedDays`
 * ago. Reviews less than a day apart use FSRS's short-term stability rule
 * (a same-session relearning pass shouldn't count as a spaced success).
 */
export function nextMemory(prev: FsrsMemory, elapsedDays: number, rating: FsrsRating): FsrsMemory {
  const difficulty = nextDifficulty(prev.difficulty, rating);
  if (elapsedDays < 1) {
    return { stability: shortTermStability(prev.stability, rating), difficulty };
  }
  const r = retrievability(elapsedDays, prev.stability);
  const stability =
    rating === 1
      ? forgetStability(prev.difficulty, prev.stability, r)
      : recallStability(prev.difficulty, prev.stability, r, rating);
  return { stability: clampStability(stability), difficulty };
}

/** Whole days until retrievability falls to `desiredRetention` (≥ 1). */
export function nextIntervalDays(stability: number, desiredRetention = DESIRED_RETENTION): number {
  const raw = (stability / FACTOR) * (desiredRetention ** (1 / DECAY) - 1);
  return Math.min(MAX_INTERVAL_DAYS, Math.max(1, Math.round(raw)));
}

/**
 * Best-effort FSRS memory for a row scheduled by the old SM-2-lite model
 * (D-021), which stored no stability/difficulty: its current interval is
 * the best available stability estimate (an SM-2 interval targets roughly
 * the same ~90% recall point), and its easiness factor maps inversely onto
 * difficulty (EF 2.5 ≈ D 5, the EF floor 1.3 ≈ D 9).
 */
export function memoryFromLegacy(intervalDays: number, easinessFactor: number): FsrsMemory {
  return {
    stability: Math.max(0.5, intervalDays),
    difficulty: clampDifficulty(5 + ((2.5 - easinessFactor) * 4) / 1.2),
  };
}
