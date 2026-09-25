import { describe, expect, it } from 'vitest';

import {
  EMPTY_CALIBRATION,
  accuracy,
  addCalibration,
  calibrationInsight,
  gradeForAnswer,
  isConfidentError,
  toCalibrationState,
} from './calibration';
import type { CalibrationState } from './calibration';
import { forecastReviews } from './hooks';
import type { ReviewState } from './types';

function repeat(state: CalibrationState, n: number, conf: 'guess' | 'unsure' | 'sure', correct: boolean) {
  let s = state;
  for (let i = 0; i < n; i++) s = addCalibration(s, conf, correct);
  return s;
}

describe('calibration (D-033)', () => {
  it('maps answers to scheduling grades: a correct guess is only "hard"', () => {
    expect(gradeForAnswer(false, 'sure')).toBe('again');
    expect(gradeForAnswer(true, 'guess')).toBe('hard');
    expect(gradeForAnswer(true, 'unsure')).toBe('good');
    expect(gradeForAnswer(true, 'sure')).toBe('good');
  });

  it('flags only wrong-and-sure answers as confident errors', () => {
    expect(isConfidentError(false, 'sure')).toBe(true);
    expect(isConfidentError(false, 'guess')).toBe(false);
    expect(isConfidentError(true, 'sure')).toBe(false);
  });

  it('withholds accuracy below the minimum sample', () => {
    const s = repeat(EMPTY_CALIBRATION, 4, 'sure', true);
    expect(accuracy(s.sure)).toBeNull();
    expect(calibrationInsight(s)).toBeNull();
    expect(accuracy(addCalibration(s, 'sure', false).sure)).toBeCloseTo(0.8);
  });

  it('warns about overconfidence, encourages under-confidence, praises calibration', () => {
    const over = repeat(repeat(EMPTY_CALIBRATION, 3, 'sure', true), 3, 'sure', false);
    expect(calibrationInsight(over)).toMatch(/second look/);
    const under = repeat(EMPTY_CALIBRATION, 6, 'guess', true);
    expect(calibrationInsight(under)).toMatch(/know more than you think/);
    const good = repeat(EMPTY_CALIBRATION, 10, 'sure', true);
    expect(calibrationInsight(good)).toMatch(/well calibrated/);
  });

  it('reads malformed kv values defensively', () => {
    expect(toCalibrationState(undefined)).toEqual(EMPTY_CALIBRATION);
    expect(toCalibrationState({ sure: { answered: 'x' } })).toEqual(EMPTY_CALIBRATION);
  });
});

describe('forecastReviews', () => {
  const DAY = 86_400_000;
  const now = 1_800_000_000_000;
  function row(itemId: string, moduleId: string, dueIn: number, reviewedAgo: number, stability: number): ReviewState {
    return {
      moduleId,
      itemId,
      easinessFactor: 2.5,
      intervalDays: Math.round(stability),
      repetitions: 1,
      dueAt: now + dueIn * DAY,
      lastReviewedAt: now - reviewedAgo * DAY,
      lastQuality: 4,
      updatedAt: now,
      stability,
      difficulty: 5,
    };
  }

  it('buckets due items and computes predicted recall per module, weakest first', () => {
    const f = forecastReviews(
      [
        row('a', 'm1', -1, 3, 2), // due now, weak
        row('b', 'm1', 0.5, 1, 2), // due within a day
        row('c', 'm2', 5, 1, 6), // due this week, strong
      ],
      now,
    );
    expect(f.total).toBe(3);
    expect(f.dueNow).toBe(1);
    expect(f.dueTomorrow).toBe(1);
    expect(f.dueThisWeek).toBe(2);
    expect(f.nextDueAt).toBe(now + 0.5 * DAY);
    expect(f.byModule.map((m) => m.moduleId)).toEqual(['m1', 'm2']);
    expect(f.byModule[0]!.dueNow).toBe(1);
    expect(f.recall!).toBeGreaterThan(0.8);
    expect(f.recall!).toBeLessThan(1);
  });

  it('is empty-safe', () => {
    const f = forecastReviews([], now);
    expect(f.recall).toBeNull();
    expect(f.nextDueAt).toBeNull();
  });
});
