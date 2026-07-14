import 'fake-indexeddb/auto';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  db,
  kvSet,
  markLessonComplete,
  recordAttempt,
  recordEngagementEvent,
  recordReview,
  setItemState,
  type ModuleMeta,
} from './db';
import type { EngagementState } from './engagement-types';
import { downloadProgress, eraseAll, exportProgress, importProgress } from './export';
import type {
  Attempt,
  ItemState,
  LessonProgress,
  ModuleState,
  ProgressExport,
  ReviewState,
} from './types';

const META: ModuleMeta = {
  courseId: 'course-1',
  subject: 'math',
  lessonsTotal: 2,
  hasAssessment: true,
  lessonIds: ['l1', 'l2'],
};

function moduleStateRow(over: Partial<ModuleState> = {}): ModuleState {
  return {
    moduleId: 'm1',
    courseId: 'course-1',
    subject: 'math',
    status: 'in-progress',
    updatedAt: 2000,
    lessonsDone: 1,
    lessonsTotal: 2,
    ...over,
  };
}

function lessonRow(over: Partial<LessonProgress> = {}): LessonProgress {
  return {
    moduleId: 'm1',
    lessonId: 'l1',
    status: 'completed',
    updatedAt: 2000,
    timeSpentSec: 60,
    ...over,
  };
}

function itemRow(over: Partial<ItemState> = {}): ItemState {
  return { moduleId: 'm1', itemId: 'i1', state: { a: 1 }, updatedAt: 2000, ...over };
}

function attemptRow(over: Partial<Attempt> = {}): Attempt {
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

function reviewRow(over: Partial<ReviewState> = {}): ReviewState {
  return {
    moduleId: 'm1',
    itemId: 'flashcards:deck:0',
    easinessFactor: 2.5,
    intervalDays: 1,
    repetitions: 1,
    dueAt: 5000,
    lastReviewedAt: 2000,
    lastQuality: 4,
    updatedAt: 2000,
    ...over,
  };
}

function engagementRow(over: Partial<EngagementState> = {}): EngagementState {
  return {
    id: 'me',
    points: 10,
    currentStreak: 1,
    longestStreak: 1,
    lastActiveDateKey: '2026-01-01',
    unlockedAchievements: ['first-lesson'],
    updatedAt: 2000,
    ...over,
  };
}

function validExport(tables: Partial<ProgressExport['tables']> = {}): ProgressExport {
  return {
    app: 'learnlab',
    exportVersion: 3,
    exportedAt: new Date().toISOString(),
    tables: {
      moduleState: [],
      lessonProgress: [],
      attempts: [],
      itemState: [],
      kv: [],
      reviewState: [],
      engagement: [],
      experienceRuns: [],
      experienceEvents: [],
      ...tables,
    },
  };
}

async function snapshotAllTables() {
  return {
    moduleState: await db.moduleState.toArray(),
    lessonProgress: await db.lessonProgress.toArray(),
    attempts: await db.attempts.toArray(),
    itemState: await db.itemState.toArray(),
    kv: await db.kv.toArray(),
    reviewState: await db.reviewState.toArray(),
    engagement: await db.engagement.toArray(),
  };
}

beforeEach(async () => {
  await db.open();
  await Promise.all(db.tables.map((t) => t.clear()));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('exportProgress (FR-PROG-003)', () => {
  it('produces the §5.5 export shape with all seven tables (D-021: v2 adds reviewState; D-027: v3 adds engagement)', async () => {
    await db.moduleState.put(moduleStateRow());
    await db.kv.put({ key: 'theme', value: 'dark' });
    await db.reviewState.put(reviewRow());
    await db.engagement.put(engagementRow());
    const out = await exportProgress();
    expect(out.app).toBe('learnlab');
    expect(out.exportVersion).toBe(4);
    expect(new Date(out.exportedAt).toISOString()).toBe(out.exportedAt);
    expect(Object.keys(out.tables).sort()).toEqual([
      'attempts',
      'engagement',
      'experienceEvents',
      'experienceRuns',
      'itemState',
      'kv',
      'lessonProgress',
      'moduleState',
      'reviewState',
    ]);
    expect(out.tables.moduleState).toEqual([moduleStateRow()]);
    expect(out.tables.kv).toEqual([{ key: 'theme', value: 'dark' }]);
    expect(out.tables.reviewState).toEqual([reviewRow()]);
    expect(out.tables.engagement).toEqual([engagementRow()]);
  });
});

describe('downloadProgress', () => {
  it('downloads learnlab-progress-YYYYMMDD.json via an anchor click', async () => {
    const createObjectURL = vi.fn(() => 'blob:fake');
    const revokeObjectURL = vi.fn();
    // jsdom does not implement object URLs; provide them for this test.
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      expect(this.download).toMatch(/^learnlab-progress-\d{8}\.json$/);
      expect(this.href).toContain('blob:fake');
    });
    await downloadProgress();
    expect(click).toHaveBeenCalledOnce();
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake');
  });
});

describe('importProgress validation (FR-PROG-004, NFR-MAINT-002)', () => {
  it('rejects a non-object with a reason and changes nothing', async () => {
    await db.kv.put({ key: 'a', value: 1 });
    const before = await snapshotAllTables();
    await expect(importProgress('nope')).rejects.toThrow(/not a JSON object/);
    expect(await snapshotAllTables()).toEqual(before);
  });

  it('rejects a wrong app field', async () => {
    const file = { ...validExport(), app: 'otherapp' };
    await expect(importProgress(file)).rejects.toThrow(/not a LearnLab progress export/);
  });

  it('rejects an unknown NEWER exportVersion loudly and actionably', async () => {
    const file = { ...validExport(), exportVersion: 5 };
    await expect(importProgress(file)).rejects.toThrow(/newer version of LearnLab/);
    await expect(importProgress(file)).rejects.toThrow(/Update LearnLab/);
  });

  it('accepts a version-1 file with no reviewState/engagement tables, importing both empty (D-021/D-027)', async () => {
    const v1File = {
      app: 'learnlab',
      exportVersion: 1,
      exportedAt: new Date().toISOString(),
      tables: { moduleState: [], lessonProgress: [], attempts: [], itemState: [], kv: [] },
    };
    const result = await importProgress(v1File);
    expect(result).toEqual({ imported: 0, skipped: 0 });
    expect(await db.reviewState.count()).toBe(0);
    expect(await db.engagement.count()).toBe(0);
  });

  it('accepts a version-2 file with no engagement table, importing an empty engagement row set (D-027)', async () => {
    const v2File = {
      app: 'learnlab',
      exportVersion: 2,
      exportedAt: new Date().toISOString(),
      tables: {
        moduleState: [],
        lessonProgress: [],
        attempts: [],
        itemState: [],
        kv: [],
        reviewState: [reviewRow()],
      },
    };
    const result = await importProgress(v2File);
    expect(result).toEqual({ imported: 1, skipped: 0 });
    expect(await db.engagement.count()).toBe(0);
  });

  it('rejects a malformed reviewState row when present (v2+ files)', async () => {
    const file = validExport({ reviewState: [{ moduleId: 'm1' } as unknown as ReviewState] });
    await expect(importProgress(file)).rejects.toThrow(/tables\.reviewState\[0\]/);
  });

  it('rejects a malformed engagement row when present (v3 files)', async () => {
    const file = validExport({
      engagement: [{ id: 'me' } as unknown as EngagementState],
    });
    await expect(importProgress(file)).rejects.toThrow(/tables\.engagement\[0\]/);
  });

  it('rejects a missing or non-numeric exportVersion', async () => {
    await expect(importProgress({ app: 'learnlab', tables: {} })).rejects.toThrow(/exportVersion/);
  });

  it('rejects malformed tables and leaves the db untouched', async () => {
    await db.moduleState.put(moduleStateRow());
    const before = await snapshotAllTables();

    const missingTable = validExport() as unknown as Record<string, unknown>;
    delete (missingTable.tables as Record<string, unknown>).attempts;
    await expect(importProgress(missingTable)).rejects.toThrow(/tables\.attempts/);

    const badRow = validExport({
      moduleState: [{ moduleId: 'x' } as unknown as ModuleState],
    });
    await expect(importProgress(badRow)).rejects.toThrow(/tables\.moduleState\[0\]/);

    const noTables = { app: 'learnlab', exportVersion: 1, exportedAt: 'x' };
    await expect(importProgress(noTables)).rejects.toThrow(/missing tables/);

    expect(await snapshotAllTables()).toEqual(before);
  });
});

describe('importProgress merge policy (FR-PROG-004)', () => {
  it('newer updatedAt wins per primary key for moduleState, lessonProgress, itemState', async () => {
    await db.moduleState.put(moduleStateRow({ updatedAt: 2000, lessonsDone: 1 }));
    await db.lessonProgress.put(lessonRow({ updatedAt: 2000, timeSpentSec: 60 }));
    await db.itemState.put(itemRow({ updatedAt: 2000, state: { a: 1 } }));

    const result = await importProgress(
      validExport({
        // newer -> wins
        moduleState: [moduleStateRow({ updatedAt: 3000, lessonsDone: 2 })],
        // older -> skipped
        lessonProgress: [lessonRow({ updatedAt: 1000, timeSpentSec: 5 })],
        // newer -> wins
        itemState: [itemRow({ updatedAt: 3000, state: { a: 9 } })],
      }),
    );

    expect(result).toEqual({ imported: 2, skipped: 1 });
    expect((await db.moduleState.get('m1'))!.lessonsDone).toBe(2);
    expect((await db.lessonProgress.get(['m1', 'l1']))!.timeSpentSec).toBe(60);
    expect((await db.itemState.get(['m1', 'i1']))!.state).toEqual({ a: 9 });
  });

  it('equal updatedAt keeps the existing record (only strictly newer wins)', async () => {
    await db.moduleState.put(moduleStateRow({ updatedAt: 2000, lessonsDone: 1 }));
    const result = await importProgress(
      validExport({ moduleState: [moduleStateRow({ updatedAt: 2000, lessonsDone: 2 })] }),
    );
    expect(result).toEqual({ imported: 0, skipped: 1 });
    expect((await db.moduleState.get('m1'))!.lessonsDone).toBe(1);
  });

  it('imports records with no local counterpart', async () => {
    const result = await importProgress(
      validExport({
        moduleState: [moduleStateRow()],
        lessonProgress: [lessonRow()],
        itemState: [itemRow()],
        kv: [{ key: 'theme', value: 'dark' }],
      }),
    );
    expect(result).toEqual({ imported: 4, skipped: 0 });
  });

  it('keeps existing kv values (no timestamp to compare)', async () => {
    await db.kv.put({ key: 'theme', value: 'light' });
    const result = await importProgress(
      validExport({
        kv: [
          { key: 'theme', value: 'dark' },
          { key: 'lastRoute', value: '#/x' },
        ],
      }),
    );
    expect(result).toEqual({ imported: 1, skipped: 1 });
    expect((await db.kv.get('theme'))!.value).toBe('light');
    expect((await db.kv.get('lastRoute'))!.value).toBe('#/x');
  });

  it('newer updatedAt wins for reviewState too (D-021)', async () => {
    await db.reviewState.put(reviewRow({ updatedAt: 2000, repetitions: 1 }));
    const result = await importProgress(
      validExport({ reviewState: [reviewRow({ updatedAt: 3000, repetitions: 2 })] }),
    );
    expect(result).toEqual({ imported: 1, skipped: 0 });
    expect((await db.reviewState.get(['m1', 'flashcards:deck:0']))!.repetitions).toBe(2);
  });

  it('newer updatedAt wins for engagement too (D-027)', async () => {
    await db.engagement.put(engagementRow({ updatedAt: 2000, points: 10 }));
    const result = await importProgress(
      validExport({ engagement: [engagementRow({ updatedAt: 3000, points: 50 })] }),
    );
    expect(result).toEqual({ imported: 1, skipped: 0 });
    expect((await db.engagement.get('me'))!.points).toBe(50);
  });

  it('unions attempts, deduping on (moduleId, itemId, startedAt)', async () => {
    await db.attempts.add(attemptRow({ startedAt: 100 }));
    const result = await importProgress(
      validExport({
        attempts: [
          attemptRow({ startedAt: 100, score: 9, attemptId: 42 }), // dupe -> skipped
          attemptRow({ startedAt: 300, attemptId: 42 }), // new, foreign attemptId dropped
          attemptRow({ startedAt: 300, itemId: 'q2' }), // new (different itemId)
        ],
      }),
    );
    expect(result).toEqual({ imported: 2, skipped: 1 });
    const rows = await db.attempts.toArray();
    expect(rows).toHaveLength(3);
    // The duplicate did not overwrite the local row.
    expect(rows.find((r) => r.startedAt === 100)!.score).toBe(5);
    // Auto-increment assigned fresh local ids (no clash on imported id 42).
    expect(new Set(rows.map((r) => r.attemptId)).size).toBe(3);
  });
});

describe('eraseAll + round-trip (FR-PROG-005, AC-03 unit half)', () => {
  it('eraseAll empties every table and leaves a usable db', async () => {
    await db.moduleState.put(moduleStateRow());
    await db.kv.put({ key: 'a', value: 1 });
    await eraseAll();
    for (const table of db.tables) {
      expect(await table.count()).toBe(0);
    }
    // Still usable after recreate.
    await kvSet('b', 2);
    expect(await db.kv.count()).toBe(1);
  });

  it('export -> erase -> import restores tables deep-equal (modulo attemptId)', async () => {
    // Build real progress through the write API: two lessons + an assessment.
    await markLessonComplete('m1', 'l1', META);
    await markLessonComplete('m1', 'l2', META);
    await recordAttempt(
      {
        moduleId: 'm1',
        itemId: 'assessment-1',
        kind: 'assessment',
        score: 8,
        maxScore: 10,
        startedAt: 1000,
        finishedAt: 2000,
        answers: { q1: 'a' },
      },
      { passMark: 0.7, isAssessment: true },
    );
    await setItemState('m1', 'widget-1', { value: 42 });
    await kvSet('theme', 'dark');
    await recordReview('m1', 'flashcards:deck:0', 'good');
    await recordEngagementEvent({ kind: 'lesson-complete' });

    const exported = await exportProgress();
    const before = await snapshotAllTables();

    await eraseAll();
    for (const table of db.tables) {
      expect(await table.count()).toBe(0);
    }

    const result = await importProgress(JSON.parse(JSON.stringify(exported)));
    expect(result.skipped).toBe(0);
    expect(result.imported).toBe(
      before.moduleState.length +
        before.lessonProgress.length +
        before.attempts.length +
        before.itemState.length +
        before.kv.length +
        before.reviewState.length +
        before.engagement.length,
    );

    const after = await snapshotAllTables();
    const stripIds = (rows: Attempt[]) =>
      rows.map((r) => {
        const copy = { ...r };
        delete copy.attemptId;
        return copy;
      });
    expect(after.moduleState).toEqual(before.moduleState);
    expect(after.lessonProgress).toEqual(before.lessonProgress);
    expect(after.itemState).toEqual(before.itemState);
    expect(after.kv).toEqual(before.kv);
    expect(after.reviewState).toEqual(before.reviewState);
    expect(after.engagement).toEqual(before.engagement);
    expect(stripIds(after.attempts)).toEqual(stripIds(before.attempts));
    expect((await db.moduleState.get('m1'))!.status).toBe('completed');
  });
});
