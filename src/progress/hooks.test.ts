import 'fake-indexeddb/auto';

import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { db, kvSet, markLessonComplete, recordAttempt, type ModuleMeta } from './db';
import {
  useAttempts,
  useBestAttempt,
  useCourseProgress,
  useKv,
  useLessonProgressList,
  useModuleState,
  useOverallProgress,
} from './hooks';
import type { Attempt } from './types';

const META: ModuleMeta = {
  courseId: 'course-1',
  subject: 'math',
  lessonsTotal: 2,
  hasAssessment: false,
  lessonIds: ['l1', 'l2'],
};

function attempt(over: Partial<Attempt>): Omit<Attempt, 'attemptId'> {
  return {
    moduleId: 'm1',
    itemId: 'q1',
    kind: 'inline-quiz',
    score: 5,
    maxScore: 10,
    startedAt: 100,
    finishedAt: 200,
    answers: null,
    ...over,
  };
}

beforeEach(async () => {
  await db.open();
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe('progress hooks', () => {
  it('useModuleState reflects writes reactively', async () => {
    const { result } = renderHook(() => useModuleState('m1'));
    expect(result.current).toBeUndefined();
    await markLessonComplete('m1', 'l1', META);
    await waitFor(() => expect(result.current?.lessonsDone).toBe(1));
    expect(result.current?.status).toBe('in-progress');
  });

  it('useLessonProgressList returns rows for the module only', async () => {
    await markLessonComplete('m1', 'l1', META);
    await markLessonComplete('m2', 'l1', { ...META, lessonIds: ['l1'] , lessonsTotal: 1 });
    const { result } = renderHook(() => useLessonProgressList('m1'));
    await waitFor(() => expect(result.current).toHaveLength(1));
    expect(result.current![0]!.moduleId).toBe('m1');
  });

  it('useCourseProgress averages per-module completion', async () => {
    await markLessonComplete('m1', 'l1', META); // 1/2 done
    await markLessonComplete('m2', 'l1', { ...META, lessonsTotal: 1, lessonIds: ['l1'] }); // completed
    const { result } = renderHook(() => useCourseProgress('course-1', ['m1', 'm2', 'm3']));
    await waitFor(() => expect(result.current).toBeDefined());
    await waitFor(() =>
      expect(result.current).toEqual({
        courseId: 'course-1',
        percent: 50, // (0.5 + 1 + 0) / 3
        modulesCompleted: 1,
        modulesTotal: 3,
      }),
    );
  });

  it('useAttempts lists attempts for one item sorted by finishedAt', async () => {
    await recordAttempt(attempt({ startedAt: 300, finishedAt: 400, score: 9 }));
    await recordAttempt(attempt({ startedAt: 100, finishedAt: 200, score: 5 }));
    await recordAttempt(attempt({ itemId: 'other', startedAt: 1, finishedAt: 2 }));
    const { result } = renderHook(() => useAttempts('m1', 'q1'));
    await waitFor(() => expect(result.current).toHaveLength(2));
    expect(result.current!.map((a) => a.finishedAt)).toEqual([200, 400]);
  });

  it('useBestAttempt picks the highest ratio', async () => {
    await recordAttempt(attempt({ startedAt: 100, finishedAt: 200, score: 5 }));
    await recordAttempt(attempt({ startedAt: 300, finishedAt: 400, score: 9 }));
    await recordAttempt(attempt({ startedAt: 500, finishedAt: 600, score: 7 }));
    const { result } = renderHook(() => useBestAttempt('m1', 'q1'));
    await waitFor(() => expect(result.current?.score).toBe(9));
  });

  it('useKv reads live kv values', async () => {
    const { result } = renderHook(() => useKv<string>('theme'));
    expect(result.current).toBeUndefined();
    await kvSet('theme', 'dark');
    await waitFor(() => expect(result.current).toBe('dark'));
  });

  it('useOverallProgress returns all moduleState rows', async () => {
    await markLessonComplete('m1', 'l1', META);
    await markLessonComplete('m2', 'l1', { ...META, lessonsTotal: 1, lessonIds: ['l1'] });
    const { result } = renderHook(() => useOverallProgress());
    await waitFor(() => expect(result.current).toHaveLength(2));
  });
});
