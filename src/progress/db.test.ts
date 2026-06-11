import 'fake-indexeddb/auto';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ITEM_STATE_MAX_BYTES,
  addLessonTime,
  db,
  kvGet,
  kvSet,
  markLessonComplete,
  onWriteError,
  recordAttempt,
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
  it('uses database name learnlab, version 1, with the five §5.5 stores', () => {
    expect(db.name).toBe('learnlab');
    expect(db.verno).toBe(1);
    expect(db.tables.map((t) => t.name).sort()).toEqual([
      'attempts',
      'itemState',
      'kv',
      'lessonProgress',
      'moduleState',
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
