import 'fake-indexeddb/auto';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ITEM_STATE_MAX_BYTES,
  addLessonTime,
  db,
  dueReviewItems,
  kvGet,
  kvSet,
  markLessonComplete,
  onWriteError,
  recordAttempt,
  recordEngagementEvent,
  recordReview,
  seedReviewItem,
  setItemState,
  touchLesson,
  type ModuleMeta,
} from './db';
import type { Attempt } from './types';

const META: ModuleMeta = {
  courseId: 'course-1',
  subject: 'math',
  lessonsTotal: 2,
  hasAssessment: true,
  lessonIds: ['l1', 'l2'],
};

const META_NO_ASSESSMENT: ModuleMeta = { ...META, hasAssessment: false };

function makeAttempt(over: Partial<Attempt> = {}): Omit<Attempt, 'attemptId'> {
  return {
    moduleId: 'm1',
    itemId: 'assessment-1',
    kind: 'assessment',
    score: 8,
    maxScore: 10,
    startedAt: 1000,
    finishedAt: 2000,
    answers: { q1: 'a' },
    ...over,
  };
}

beforeEach(async () => {
  await db.open();
  await Promise.all(db.tables.map((t) => t.clear()));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('schema', () => {
  it('uses database name learnlab, version 3, with the five §5.5 stores + reviewState (D-021) + engagement (D-027)', () => {
    expect(db.name).toBe('learnlab');
    expect(db.verno).toBe(3);
    expect(db.tables.map((t) => t.name).sort()).toEqual([
      'attempts',
      'engagement',
      'itemState',
      'kv',
      'lessonProgress',
      'moduleState',
      'reviewState',
    ]);
  });
});

describe('markLessonComplete / touchLesson (FR-PROG-002)', () => {
  it('transitions not-started -> in-progress with startedAt on first completion', async () => {
    await markLessonComplete('m1', 'l1', META);
    const ms = await db.moduleState.get('m1');
    expect(ms).toBeDefined();
    expect(ms!.status).toBe('in-progress');
    expect(ms!.startedAt).toBeTypeOf('number');
    expect(ms!.lessonsDone).toBe(1);
    expect(ms!.lessonsTotal).toBe(2);
    const lp = await db.lessonProgress.get(['m1', 'l1']);
    expect(lp!.status).toBe('completed');
    expect(lp!.completedAt).toBeTypeOf('number');
  });

  it('does not complete a module with an assessment on lessons alone', async () => {
    await markLessonComplete('m1', 'l1', META);
    await markLessonComplete('m1', 'l2', META);
    const ms = await db.moduleState.get('m1');
    expect(ms!.lessonsDone).toBe(2);
    expect(ms!.status).toBe('in-progress');
    expect(ms!.completedAt).toBeUndefined();
  });

  it('completes a no-assessment module when all lessons are done', async () => {
    await markLessonComplete('m1', 'l1', META_NO_ASSESSMENT);
    expect((await db.moduleState.get('m1'))!.status).toBe('in-progress');
    await markLessonComplete('m1', 'l2', META_NO_ASSESSMENT);
    const ms = await db.moduleState.get('m1');
    expect(ms!.status).toBe('completed');
    expect(ms!.completedAt).toBeTypeOf('number');
  });

  it('is idempotent: re-completing a lesson keeps lessonsDone correct', async () => {
    await markLessonComplete('m1', 'l1', META);
    await markLessonComplete('m1', 'l1', META);
    expect((await db.moduleState.get('m1'))!.lessonsDone).toBe(1);
  });

  it('touchLesson creates in-progress module and lesson rows', async () => {
    await touchLesson('m1', 'l1', META);
    const ms = await db.moduleState.get('m1');
    expect(ms!.status).toBe('in-progress');
    expect(ms!.startedAt).toBeTypeOf('number');
    expect(ms!.lessonsDone).toBe(0);
    expect((await db.lessonProgress.get(['m1', 'l1']))!.status).toBe('in-progress');
  });

  it('touchLesson never downgrades a completed lesson or module', async () => {
    await markLessonComplete('m1', 'l1', META_NO_ASSESSMENT);
    await markLessonComplete('m1', 'l2', META_NO_ASSESSMENT);
    await touchLesson('m1', 'l1', META_NO_ASSESSMENT);
    expect((await db.lessonProgress.get(['m1', 'l1']))!.status).toBe('completed');
    expect((await db.moduleState.get('m1'))!.status).toBe('completed');
  });
});

describe('recordAttempt (FR-QUIZ-003)', () => {
  it('inserts an attempts row and returns its id', async () => {
    const id = await recordAttempt(makeAttempt({ kind: 'inline-quiz' }));
    expect(id).toBeTypeOf('number');
    const rows = await db.attempts.toArray();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.kind).toBe('inline-quiz');
  });

  it('non-assessment attempts do not touch moduleState', async () => {
    await markLessonComplete('m1', 'l1', META);
    const before = await db.moduleState.get('m1');
    await recordAttempt(makeAttempt({ kind: 'inline-quiz' }));
    expect(await db.moduleState.get('m1')).toEqual(before);
  });

  it('updates assessmentBest only when improved', async () => {
    await markLessonComplete('m1', 'l1', META);
    await recordAttempt(makeAttempt({ score: 8, finishedAt: 2000 }), {
      passMark: 0.7,
      isAssessment: true,
    });
    let ms = await db.moduleState.get('m1');
    expect(ms!.assessmentBest).toEqual({ score: 8, maxScore: 10, at: 2000 });

    // Worse run: best unchanged.
    await recordAttempt(makeAttempt({ score: 6, finishedAt: 3000 }), {
      passMark: 0.7,
      isAssessment: true,
    });
    ms = await db.moduleState.get('m1');
    expect(ms!.assessmentBest).toEqual({ score: 8, maxScore: 10, at: 2000 });

    // Equal ratio: not an improvement.
    await recordAttempt(makeAttempt({ score: 8, finishedAt: 4000 }), {
      passMark: 0.7,
      isAssessment: true,
    });
    ms = await db.moduleState.get('m1');
    expect(ms!.assessmentBest!.at).toBe(2000);
  });

  it('does not complete the module when passMark is met but lessons remain', async () => {
    await markLessonComplete('m1', 'l1', META); // 1 of 2 lessons
    await recordAttempt(makeAttempt({ score: 10 }), { passMark: 0.7, isAssessment: true });
    expect((await db.moduleState.get('m1'))!.status).toBe('in-progress');
  });

  it('does not complete the module when lessons are done but passMark missed', async () => {
    await markLessonComplete('m1', 'l1', META);
    await markLessonComplete('m1', 'l2', META);
    await recordAttempt(makeAttempt({ score: 6 }), { passMark: 0.7, isAssessment: true });
    expect((await db.moduleState.get('m1'))!.status).toBe('in-progress');
  });

  it('completes the module when passMark met AND all lessons done', async () => {
    await markLessonComplete('m1', 'l1', META);
    await markLessonComplete('m1', 'l2', META);
    await recordAttempt(makeAttempt({ score: 7 }), { passMark: 0.7, isAssessment: true });
    const ms = await db.moduleState.get('m1');
    expect(ms!.status).toBe('completed');
    expect(ms!.completedAt).toBeTypeOf('number');
    expect(ms!.assessmentBest).toEqual({ score: 7, maxScore: 10, at: 2000 });
  });
});

describe('addLessonTime', () => {
  it('accumulates timeSpentSec across calls', async () => {
    await addLessonTime('m1', 'l1', 30);
    await addLessonTime('m1', 'l1', 30);
    const lp = await db.lessonProgress.get(['m1', 'l1']);
    expect(lp!.timeSpentSec).toBe(60);
    expect(lp!.status).toBe('in-progress');
  });

  it('preserves completed status while accumulating', async () => {
    await markLessonComplete('m1', 'l1', META);
    await addLessonTime('m1', 'l1', 30);
    const lp = await db.lessonProgress.get(['m1', 'l1']);
    expect(lp!.status).toBe('completed');
    expect(lp!.timeSpentSec).toBe(30);
  });
});

describe('setItemState (§6.3 PERSIST rule)', () => {
  it('writes JSON-safe state under the cap', async () => {
    await setItemState('m1', 'item-1', { sliders: [1, 2, 3] });
    const row = await db.itemState.get(['m1', 'item-1']);
    expect(row!.state).toEqual({ sliders: [1, 2, 3] });
    expect(row!.updatedAt).toBeTypeOf('number');
  });

  it('drops payloads over 64 KB with a warn, without throwing or writing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await setItemState('m1', 'item-1', { keep: true });
    const oversized = { blob: 'x'.repeat(ITEM_STATE_MAX_BYTES + 1) };
    await expect(setItemState('m1', 'item-1', oversized)).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledOnce();
    // Previous state untouched.
    expect((await db.itemState.get(['m1', 'item-1']))!.state).toEqual({ keep: true });
  });
});

describe('kv', () => {
  it('kvSet / kvGet round-trip; missing keys read as undefined', async () => {
    expect(await kvGet('theme')).toBeUndefined();
    await kvSet('theme', 'dark');
    expect(await kvGet<string>('theme')).toBe('dark');
    await kvSet('theme', 'light');
    expect(await kvGet<string>('theme')).toBe('light');
  });
});

describe('recordReview / dueReviewItems / seedReviewItem (§13 roadmap, D-021)', () => {
  it('creates a row on first grade with SM-2-lite state, due in the future', async () => {
    const before = Date.now();
    await recordReview('m1', 'flashcards:deck:0', 'good');
    const row = await db.reviewState.get(['m1', 'flashcards:deck:0']);
    expect(row).toBeDefined();
    expect(row!.repetitions).toBe(1);
    expect(row!.intervalDays).toBe(1);
    expect(row!.easinessFactor).toBeCloseTo(2.5, 5); // q=4 leaves EF at 2.5 (delta 0)
    expect(row!.dueAt).toBeGreaterThanOrEqual(before + 1 * 86_400_000);
  });

  it('"again" resets repetitions to 0 and schedules a 1-day interval', async () => {
    await recordReview('m1', 'quiz:a:q1', 'good');
    await recordReview('m1', 'quiz:a:q1', 'good'); // repetitions=2, interval=6
    await recordReview('m1', 'quiz:a:q1', 'again');
    const row = await db.reviewState.get(['m1', 'quiz:a:q1']);
    expect(row!.repetitions).toBe(0);
    expect(row!.intervalDays).toBe(1);
  });

  it('grows the interval by the easiness factor from the third repetition onward', async () => {
    await recordReview('m1', 'flashcards:d:1', 'good'); // rep1 -> interval 1
    await recordReview('m1', 'flashcards:d:1', 'good'); // rep2 -> interval 6
    await recordReview('m1', 'flashcards:d:1', 'good'); // rep3 -> interval round(6*EF)
    const row = await db.reviewState.get(['m1', 'flashcards:d:1']);
    expect(row!.repetitions).toBe(3);
    expect(row!.intervalDays).toBe(Math.round(6 * row!.easinessFactor));
  });

  it('dueReviewItems returns only items due at/before now, oldest first', async () => {
    await recordReview('m1', 'a', 'again'); // due tomorrow, not due now
    // Manually backdate one row to be already due, and another further out.
    await db.reviewState.put({
      moduleId: 'm1',
      itemId: 'b',
      easinessFactor: 2.5,
      intervalDays: 0,
      repetitions: 0,
      dueAt: Date.now() - 1000,
      lastReviewedAt: Date.now() - 1000,
      lastQuality: 2,
      updatedAt: Date.now() - 1000,
    });
    await db.reviewState.put({
      moduleId: 'm1',
      itemId: 'c',
      easinessFactor: 2.5,
      intervalDays: 0,
      repetitions: 0,
      dueAt: Date.now() - 500,
      lastReviewedAt: Date.now() - 500,
      lastQuality: 2,
      updatedAt: Date.now() - 500,
    });
    const due = await dueReviewItems();
    expect(due.map((r) => r.itemId)).toEqual(['b', 'c']); // oldest-due first, 'a' excluded
  });

  it('seedReviewItem creates an "again"-equivalent row only if none already exists', async () => {
    await seedReviewItem('m1', 'quiz:a:q2');
    const first = await db.reviewState.get(['m1', 'quiz:a:q2']);
    expect(first!.repetitions).toBe(0);
    expect(first!.intervalDays).toBe(1);

    // Advance it, then seeding again must be a no-op (real schedule preserved).
    await recordReview('m1', 'quiz:a:q2', 'good');
    await seedReviewItem('m1', 'quiz:a:q2');
    const after = await db.reviewState.get(['m1', 'quiz:a:q2']);
    expect(after!.repetitions).toBe(1); // unchanged by the second seed call
  });
});

describe('recordEngagementEvent (D-027)', () => {
  it('creates the singleton row on first event, awarding points and a 1-day streak', async () => {
    await markLessonComplete('m1', 'l1', META);
    const result = await recordEngagementEvent({ kind: 'lesson-complete' });
    expect(result!.state.id).toBe('me');
    expect(result!.state.points).toBe(10);
    expect(result!.state.currentStreak).toBe(1);
    expect(result!.newlyUnlocked.map((a) => a.id)).toContain('first-lesson');
    expect(await db.engagement.get('me')).toEqual(result!.state);
  });

  it('accumulates points across events without re-unlocking the same achievement', async () => {
    await markLessonComplete('m1', 'l1', META);
    const first = await recordEngagementEvent({ kind: 'lesson-complete' });
    await markLessonComplete('m1', 'l2', META);
    const second = await recordEngagementEvent({ kind: 'lesson-complete' });
    expect(second!.state.points).toBe(first!.state.points + 10);
    expect(second!.newlyUnlocked.map((a) => a.id)).not.toContain('first-lesson');
  });

  it('unlocks first-module only once a module actually completes', async () => {
    await markLessonComplete('m1', 'l1', META_NO_ASSESSMENT);
    await markLessonComplete('m1', 'l2', META_NO_ASSESSMENT); // completes the module
    const result = await recordEngagementEvent({ kind: 'lesson-complete' });
    expect(result!.newlyUnlocked.map((a) => a.id)).toContain('first-module');
  });

  it('unlocks perfect-assessment only for a perfect, isAssessment quiz-finished event', async () => {
    const inline = await recordEngagementEvent({
      kind: 'quiz-finished',
      ratio: 1,
      perfect: true,
      isAssessment: false,
    });
    expect(inline!.newlyUnlocked.map((a) => a.id)).toContain('perfect-quiz');
    expect(inline!.newlyUnlocked.map((a) => a.id)).not.toContain('perfect-assessment');

    const assessment = await recordEngagementEvent({
      kind: 'quiz-finished',
      ratio: 1,
      perfect: true,
      isAssessment: true,
    });
    expect(assessment!.newlyUnlocked.map((a) => a.id)).toContain('perfect-assessment');
  });
});

describe('onWriteError (NFR-REL-001)', () => {
  it('console.errors and notifies subscribers on a failed write, then resolves', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const listener = vi.fn();
    const off = onWriteError(listener);
    // Functions are not structured-cloneable -> the IndexedDB write fails.
    await expect(kvSet('bad', () => {})).resolves.toBeUndefined();
    expect(error).toHaveBeenCalled();
    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0]![1]).toBe('kvSet');
    off();
    await kvSet('bad2', () => {});
    expect(listener).toHaveBeenCalledOnce(); // unsubscribed
  });
});
