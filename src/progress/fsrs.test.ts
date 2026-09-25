// Pins the FSRS-6 port to the reference implementation. Every expected value
// below was produced by py-fsrs (Scheduler(learning_steps=(),
// relearning_steps=(), enable_fuzzing=False)) with the same default
// parameters, then rounded to 4 dp — see D-033.

import { describe, expect, it } from 'vitest';

import {
  GRADE_RATING,
  initialMemory,
  memoryFromLegacy,
  nextIntervalDays,
  nextMemory,
  retrievability,
} from './fsrs';
import type { FsrsMemory, FsrsRating } from './fsrs';

/** Replay (rating, days-since-previous-review) pairs from a fresh item. */
function replay(seq: [FsrsRating, number][]): { s: number; d: number; interval: number }[] {
  let mem: FsrsMemory | null = null;
  return seq.map(([rating, gap]) => {
    mem = mem === null ? initialMemory(rating) : nextMemory(mem, gap, rating);
    return { s: mem.stability, d: mem.difficulty, interval: nextIntervalDays(mem.stability) };
  });
}

function expectClose(
  actual: { s: number; d: number; interval: number }[],
  expected: [number, number, number][],
) {
  expect(actual).toHaveLength(expected.length);
  actual.forEach((step, i) => {
    const [s, d, interval] = expected[i]!;
    expect(step.s).toBeCloseTo(s, 3);
    expect(step.d).toBeCloseTo(d, 3);
    expect(step.interval).toBe(interval);
  });
}

describe('FSRS-6 port (matches py-fsrs reference outputs)', () => {
  it('good → good → good grows stability and intervals', () => {
    expectClose(
      replay([
        [3, 0],
        [3, 2],
        [3, 11],
      ]),
      [
        [2.3065, 2.1181, 2],
        [10.9643, 2.1112, 11],
        [46.2802, 2.1043, 46],
      ],
    );
  });

  it('again → good → hard', () => {
    expectClose(
      replay([
        [1, 0],
        [3, 1],
        [2, 3],
      ]),
      [
        [0.212, 6.4133, 1],
        [1.8868, 6.4021, 2],
        [5.3457, 7.5968, 5],
      ],
    );
  });

  it('easy then a lapse after 20 days', () => {
    expectClose(
      replay([
        [4, 0],
        [1, 20],
      ]),
      [
        [8.2956, 1.0, 8],
        [1.5664, 7.027, 2],
      ],
    );
  });

  it('a lapse on a well-established item collapses stability', () => {
    expectClose(
      replay([
        [3, 0],
        [3, 2],
        [1, 30],
      ]),
      [
        [2.3065, 2.1181, 2],
        [10.9643, 2.1112, 11],
        [1.7606, 7.3922, 2],
      ],
    );
  });

  it('a same-day re-review uses short-term stability (no spaced-success credit)', () => {
    expectClose(
      replay([
        [3, 0],
        [3, 0],
      ]),
      [
        [2.3065, 2.1181, 2],
        [2.3065, 2.1112, 2],
      ],
    );
  });

  it('retrievability matches the reference forgetting curve', () => {
    expect(retrievability(10, 5)).toBeCloseTo(0.8458846, 5);
    expect(retrievability(0, 5)).toBe(1);
  });

  it('the interval at the desired retention equals the stability (R(S, S) = 0.9)', () => {
    expect(retrievability(30, 30)).toBeCloseTo(0.9, 6);
    expect(nextIntervalDays(30)).toBe(30);
    expect(nextIntervalDays(0.01)).toBe(1); // floored at one day
  });

  it('maps grade names onto the 1-4 rating scale', () => {
    expect(GRADE_RATING).toEqual({ again: 1, hard: 2, good: 3, easy: 4 });
  });

  it('memoryFromLegacy converts SM-2 rows into a plausible FSRS memory', () => {
    expect(memoryFromLegacy(6, 2.5)).toEqual({ stability: 6, difficulty: 5 });
    expect(memoryFromLegacy(0, 1.3).stability).toBe(0.5);
    expect(memoryFromLegacy(1, 1.3).difficulty).toBeCloseTo(9, 6);
    expect(memoryFromLegacy(1, 3.5).difficulty).toBeGreaterThanOrEqual(1);
  });
});
