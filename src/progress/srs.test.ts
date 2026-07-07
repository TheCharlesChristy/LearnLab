import { describe, expect, it } from 'vitest';

import {
  GRADE_QUALITY,
  INITIAL_SM2_STATE,
  flashcardReviewItemId,
  quizReviewItemId,
  sm2Step,
  sm2StepLite,
} from './srs';

describe('sm2Step (pure SM-2 algorithm)', () => {
  it('quality < 3 resets repetitions to 0 and sets a 1-day interval', () => {
    const next = sm2Step({ easinessFactor: 2.5, intervalDays: 30, repetitions: 5 }, 2);
    expect(next.repetitions).toBe(0);
    expect(next.intervalDays).toBe(1);
  });

  it('first successful repetition sets interval to 1 day', () => {
    const next = sm2Step(INITIAL_SM2_STATE, 4);
    expect(next.repetitions).toBe(1);
    expect(next.intervalDays).toBe(1);
  });

  it('second successful repetition sets interval to 6 days', () => {
    const r1 = sm2Step(INITIAL_SM2_STATE, 4);
    const r2 = sm2Step(r1, 4);
    expect(r2.repetitions).toBe(2);
    expect(r2.intervalDays).toBe(6);
  });

  it('third+ repetition multiplies the previous interval by the easiness factor, rounded', () => {
    const r1 = sm2Step(INITIAL_SM2_STATE, 4);
    const r2 = sm2Step(r1, 4);
    const r3 = sm2Step(r2, 4);
    expect(r3.repetitions).toBe(3);
    expect(r3.intervalDays).toBe(Math.round(6 * r2.easinessFactor));
  });

  it('easiness factor is floored at 1.3 even with repeated low-quality grades', () => {
    let state = INITIAL_SM2_STATE;
    for (let i = 0; i < 50; i++) state = sm2Step(state, 0);
    expect(state.easinessFactor).toBeGreaterThanOrEqual(1.3);
    expect(state.easinessFactor).toBeCloseTo(1.3, 5);
  });

  it('quality 5 (perfect) increases the easiness factor above the 2.5 default', () => {
    const next = sm2Step(INITIAL_SM2_STATE, 5);
    expect(next.easinessFactor).toBeGreaterThan(2.5);
  });

  it('quality 4 leaves the easiness factor exactly unchanged (the SM-2 zero-delta quality)', () => {
    const next = sm2Step(INITIAL_SM2_STATE, 4);
    expect(next.easinessFactor).toBeCloseTo(2.5, 10);
  });

  it('clamps out-of-range quality inputs into [0, 5]', () => {
    const tooHigh = sm2Step(INITIAL_SM2_STATE, 99);
    const cappedAt5 = sm2Step(INITIAL_SM2_STATE, 5);
    expect(tooHigh).toEqual(cappedAt5);

    const tooLow = sm2Step(INITIAL_SM2_STATE, -10);
    const cappedAt0 = sm2Step(INITIAL_SM2_STATE, 0);
    expect(tooLow).toEqual(cappedAt0);
  });
});

describe('sm2StepLite (D-021 2-button grade scale)', () => {
  it('"again" behaves exactly like sm2Step at GRADE_QUALITY.again', () => {
    const viaLite = sm2StepLite(INITIAL_SM2_STATE, 'again');
    const viaFull = sm2Step(INITIAL_SM2_STATE, GRADE_QUALITY.again);
    expect(viaLite).toEqual(viaFull);
    expect(viaLite.repetitions).toBe(0); // again's quality (2) is < 3
  });

  it('"good" behaves exactly like sm2Step at GRADE_QUALITY.good', () => {
    const viaLite = sm2StepLite(INITIAL_SM2_STATE, 'good');
    const viaFull = sm2Step(INITIAL_SM2_STATE, GRADE_QUALITY.good);
    expect(viaLite).toEqual(viaFull);
    expect(viaLite.repetitions).toBe(1); // good's quality (4) is >= 3
  });
});

describe('review item-id helpers', () => {
  it('flashcardReviewItemId namespaces by deck src and card index', () => {
    expect(flashcardReviewItemId('cards/unit1.json', 3)).toBe('flashcards:cards/unit1.json:3');
  });

  it('quizReviewItemId namespaces by quiz/assessment item id and question id', () => {
    expect(quizReviewItemId('assessment-1', 'q4')).toBe('quiz:assessment-1:q4');
  });
});
