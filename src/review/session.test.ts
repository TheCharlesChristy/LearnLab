import { describe, expect, it } from 'vitest';

import type { ReviewState } from '../progress';

import {
  MIXED_REVIEW_SESSION_MAX_ITEMS,
  planMixedReviewGrade,
  resumeMixedReviewSession,
  selectMixedReviewSession,
  skipMixedReviewItem,
} from './session';

const row = (moduleId: string, itemId: string, dueAt: number): ReviewState => ({
  moduleId, itemId, dueAt, easinessFactor: 2.5, intervalDays: 0, repetitions: 0,
  lastReviewedAt: dueAt, lastQuality: 2, updatedAt: dueAt,
});

describe('mixed review session selection (#60)', () => {
  it('is deterministic, bounded, and interleaves owners where possible', () => {
    const due = [row('v2:a', 'a1', 1), row('v2:a', 'a2', 2), row('v2:b', 'b1', 3), row('v2:b', 'b2', 4), row('v2:c', 'c1', 5)];
    const first = selectMixedReviewSession(due, undefined, 4);
    expect(first).toEqual(selectMixedReviewSession([...due].reverse(), undefined, 4));
    expect(first.items).toHaveLength(4);
    expect(first.items[0]?.ownerId).not.toBe(first.items[1]?.ownerId);
    expect(MIXED_REVIEW_SESSION_MAX_ITEMS).toBe(8);
  });

  it('makes a grade plan idempotent before the scheduler is called', () => {
    const session = selectMixedReviewSession([row('v2:a', 'a1', 1)]);
    const first = planMixedReviewGrade(session, 'good');
    expect(first.shouldSchedule).toBe(true);
    const duplicate = planMixedReviewGrade(first.session, 'good');
    expect(duplicate.shouldSchedule).toBe(false);
    expect(first.session.currentIndex).toBe(1);
  });

  it('resumes only a still-relevant session and tolerates already-submitted rows leaving the due queue', () => {
    const due = [row('v2:a', 'a1', 1), row('v2:b', 'b1', 2)];
    const submitted = planMixedReviewGrade(selectMixedReviewSession(due), 'good').session;
    expect(resumeMixedReviewSession([due[1]!], submitted)).toEqual(submitted);
    expect(resumeMixedReviewSession([due[0]!], submitted)).toBeUndefined();
  });

  it('can skip an unavailable activity without creating a scheduler grade plan', () => {
    const session = selectMixedReviewSession([row('v2:a', 'a1', 1)]);
    const skipped = skipMixedReviewItem(session);
    expect(skipped.currentIndex).toBe(1);
    expect(planMixedReviewGrade(skipped, 'good').shouldSchedule).toBe(false);
  });
});
