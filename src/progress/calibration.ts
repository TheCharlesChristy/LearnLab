// Confidence calibration (D-033) — pure. During review, every auto-marked
// answer is locked in with a confidence level (guessing / think so / sure).
// That rating does three jobs:
//
// 1. Scheduling: a correct *guess* isn't real retrieval, so it's graded
//    `hard` (sooner review) rather than `good`.
// 2. Hypercorrection: errors made with high confidence are corrected more
//    durably when the learner is shown the right answer (Butterfield &
//    Metcalfe 2001; replicated in classrooms, Metcalfe 2017) — the review UI
//    flags these for deliberate attention instead of a bare "incorrect".
// 3. Calibration feedback: learners chronically overestimate what they know;
//    repeatedly predicting, testing and comparing improves the accuracy of
//    those judgements — the stats below feed that comparison back.

import type { ReviewGrade } from './fsrs';

export type Confidence = 'guess' | 'unsure' | 'sure';

export const CONFIDENCE_LEVELS: readonly Confidence[] = ['guess', 'unsure', 'sure'];

export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  guess: 'Guessing',
  unsure: 'Think so',
  sure: 'Sure',
};

export interface CalibrationBucket {
  answered: number;
  correct: number;
}

/** Persisted in kv under KV_CALIBRATION — lifetime totals per confidence level. */
export type CalibrationState = Record<Confidence, CalibrationBucket>;

export const KV_CALIBRATION = 'calibration';

export const EMPTY_CALIBRATION: CalibrationState = {
  guess: { answered: 0, correct: 0 },
  unsure: { answered: 0, correct: 0 },
  sure: { answered: 0, correct: 0 },
};

function isBucket(v: unknown): v is CalibrationBucket {
  return (
    typeof v === 'object' &&
    v !== null &&
    typeof (v as CalibrationBucket).answered === 'number' &&
    typeof (v as CalibrationBucket).correct === 'number'
  );
}

/** Defensive read of a kv value (imports and older builds may hold anything). */
export function toCalibrationState(v: unknown): CalibrationState {
  if (typeof v !== 'object' || v === null) return EMPTY_CALIBRATION;
  const rec = v as Record<string, unknown>;
  return {
    guess: isBucket(rec.guess) ? rec.guess : EMPTY_CALIBRATION.guess,
    unsure: isBucket(rec.unsure) ? rec.unsure : EMPTY_CALIBRATION.unsure,
    sure: isBucket(rec.sure) ? rec.sure : EMPTY_CALIBRATION.sure,
  };
}

export function addCalibration(
  state: CalibrationState,
  confidence: Confidence,
  correct: boolean,
): CalibrationState {
  const bucket = state[confidence];
  return {
    ...state,
    [confidence]: {
      answered: bucket.answered + 1,
      correct: bucket.correct + (correct ? 1 : 0),
    },
  };
}

/** Scheduling grade for an auto-marked review answer (see job 1 above). */
export function gradeForAnswer(correct: boolean, confidence: Confidence): ReviewGrade {
  if (!correct) return 'again';
  return confidence === 'guess' ? 'hard' : 'good';
}

/** A wrong answer the learner was sure about — the hypercorrection moment. */
export function isConfidentError(correct: boolean, confidence: Confidence): boolean {
  return !correct && confidence === 'sure';
}

/** Minimum answers at a level before we'll quote an accuracy for it. */
export const CALIBRATION_MIN_SAMPLE = 5;

export function accuracy(bucket: CalibrationBucket): number | null {
  return bucket.answered >= CALIBRATION_MIN_SAMPLE ? bucket.correct / bucket.answered : null;
}

/**
 * One plain-language takeaway from the learner's calibration record, or null
 * when there isn't enough data yet. Deliberately descriptive, not judgmental:
 * the goal is an accurate self-model, not a score.
 */
export function calibrationInsight(state: CalibrationState): string | null {
  const sure = accuracy(state.sure);
  const guess = accuracy(state.guess);
  if (sure !== null && sure < 0.75) {
    return `When you feel sure, you're right ${Math.round(sure * 100)}% of the time — worth a second look before locking in.`;
  }
  if (guess !== null && guess > 0.6) {
    return `Your "guesses" are right ${Math.round(guess * 100)}% of the time — you know more than you think.`;
  }
  if (sure !== null) {
    return `When you feel sure, you're right ${Math.round(sure * 100)}% of the time — well calibrated.`;
  }
  return null;
}
