import { describe, expect, it } from 'vitest';

import {
  ACHIEVEMENTS,
  applyDailyActivity,
  applyEngagementEvent,
  dateKey,
  INITIAL_ENGAGEMENT_STATE,
  pointsForEvent,
} from './engagement';

describe('dateKey', () => {
  it('formats using local calendar fields, zero-padded', () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(dateKey(new Date(2026, 10, 23))).toBe('2026-11-23');
  });
});

describe('applyDailyActivity (streak rollover)', () => {
  it('first-ever activity starts a 1-day streak', () => {
    const next = applyDailyActivity(
      { currentStreak: 0, longestStreak: 0, lastActiveDateKey: '' },
      new Date(2026, 0, 5),
    );
    expect(next).toEqual({ currentStreak: 1, longestStreak: 1, lastActiveDateKey: '2026-01-05' });
  });

  it('same-day activity is a no-op', () => {
    const prev = { currentStreak: 4, longestStreak: 6, lastActiveDateKey: '2026-01-05' };
    const next = applyDailyActivity(prev, new Date(2026, 0, 5, 23, 59));
    expect(next).toEqual(prev);
  });

  it('exactly the next calendar day extends the streak by one', () => {
    const prev = { currentStreak: 4, longestStreak: 6, lastActiveDateKey: '2026-01-05' };
    const next = applyDailyActivity(prev, new Date(2026, 0, 6));
    expect(next).toEqual({ currentStreak: 5, longestStreak: 6, lastActiveDateKey: '2026-01-06' });
  });

  it('extending past the prior longest streak raises longestStreak too', () => {
    const prev = { currentStreak: 6, longestStreak: 6, lastActiveDateKey: '2026-01-05' };
    const next = applyDailyActivity(prev, new Date(2026, 0, 6));
    expect(next.currentStreak).toBe(7);
    expect(next.longestStreak).toBe(7);
  });

  it('a gap of more than one day resets the streak to 1, keeping the record longestStreak', () => {
    const prev = { currentStreak: 10, longestStreak: 10, lastActiveDateKey: '2026-01-05' };
    const next = applyDailyActivity(prev, new Date(2026, 0, 8)); // 3-day gap
    expect(next).toEqual({ currentStreak: 1, longestStreak: 10, lastActiveDateKey: '2026-01-08' });
  });

  it('a gap spanning a month boundary still resets correctly', () => {
    const prev = { currentStreak: 3, longestStreak: 3, lastActiveDateKey: '2026-01-31' };
    const next = applyDailyActivity(prev, new Date(2026, 2, 1)); // Jan 31 -> Mar 1, not consecutive
    expect(next.currentStreak).toBe(1);
  });

  it('Jan 31 -> Feb 1 is treated as consecutive', () => {
    const prev = { currentStreak: 3, longestStreak: 3, lastActiveDateKey: '2026-01-31' };
    const next = applyDailyActivity(prev, new Date(2026, 1, 1));
    expect(next.currentStreak).toBe(4);
  });
});

describe('pointsForEvent', () => {
  it('awards flat points for lesson/deck/game completion', () => {
    expect(pointsForEvent({ kind: 'lesson-complete' })).toBe(10);
    expect(pointsForEvent({ kind: 'flashcards-deck-complete' })).toBe(10);
    expect(pointsForEvent({ kind: 'game-complete' })).toBe(15);
  });

  it('scales inline-quiz points with pass/perfect', () => {
    expect(
      pointsForEvent({ kind: 'quiz-finished', ratio: 1, perfect: true, isAssessment: false }),
    ).toBe(25);
    expect(
      pointsForEvent({ kind: 'quiz-finished', ratio: 0.6, perfect: false, isAssessment: false }),
    ).toBe(15);
    expect(
      pointsForEvent({ kind: 'quiz-finished', ratio: 0.2, perfect: false, isAssessment: false }),
    ).toBe(5);
  });

  it('scales assessment points higher than the equivalent inline quiz', () => {
    expect(
      pointsForEvent({ kind: 'quiz-finished', ratio: 1, perfect: true, isAssessment: true }),
    ).toBe(30);
    expect(
      pointsForEvent({ kind: 'quiz-finished', ratio: 0.6, perfect: false, isAssessment: true }),
    ).toBe(20);
  });
});

describe('applyEngagementEvent (streak + points + achievements combined)', () => {
  it('unlocks first-lesson exactly once', () => {
    const first = applyEngagementEvent(
      INITIAL_ENGAGEMENT_STATE,
      { kind: 'lesson-complete' },
      { totalLessonsCompleted: 1, totalModulesCompleted: 0 },
      new Date(2026, 0, 5),
    );
    expect(first.newlyUnlocked.map((a) => a.id)).toEqual(['first-lesson']);
    expect(first.state.unlockedAchievements).toContain('first-lesson');

    const second = applyEngagementEvent(
      first.state,
      { kind: 'lesson-complete' },
      { totalLessonsCompleted: 2, totalModulesCompleted: 0 },
      new Date(2026, 0, 6),
    );
    expect(second.newlyUnlocked.map((a) => a.id)).not.toContain('first-lesson');
    expect(second.state.points).toBe(first.state.points + 10);
  });

  it('unlocks streak-3 the moment currentStreak reaches 3', () => {
    let state = INITIAL_ENGAGEMENT_STATE;
    const days = [new Date(2026, 0, 5), new Date(2026, 0, 6), new Date(2026, 0, 7)];
    let lastUnlocked: string[] = [];
    for (const day of days) {
      const result = applyEngagementEvent(
        state,
        { kind: 'lesson-complete' },
        { totalLessonsCompleted: 1, totalModulesCompleted: 0 },
        day,
      );
      state = result.state;
      lastUnlocked = result.newlyUnlocked.map((a) => a.id);
    }
    expect(state.currentStreak).toBe(3);
    expect(lastUnlocked).toContain('streak-3');
  });

  it('every declared achievement id has exactly one checkable entry (no dead ids)', () => {
    // Fire one of every event kind so every achievement gets a chance to unlock,
    // guarding against an ACHIEVEMENTS entry with no matching check.
    const events: Parameters<typeof applyEngagementEvent>[1][] = [
      { kind: 'lesson-complete' },
      { kind: 'quiz-finished', ratio: 1, perfect: true, isAssessment: false },
      { kind: 'quiz-finished', ratio: 1, perfect: true, isAssessment: true },
      { kind: 'flashcards-deck-complete' },
      { kind: 'game-complete' },
    ];
    let state = INITIAL_ENGAGEMENT_STATE;
    for (let i = 0; i < 7; i++) {
      // enough iterations to also cross the streak-7 threshold
      for (const event of events) {
        const result = applyEngagementEvent(
          state,
          event,
          { totalLessonsCompleted: 1, totalModulesCompleted: 1 },
          new Date(2026, 0, 1 + i),
        );
        state = result.state;
      }
    }
    expect(new Set(state.unlockedAchievements)).toEqual(new Set(ACHIEVEMENTS.map((a) => a.id)));
  });
});
