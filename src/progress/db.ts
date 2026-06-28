// LearnLab progress store — Dexie database and the single write API.
// SRS §5.5 (normative schema), FR-PROG-001/002/007, FR-QUIZ-003, NFR-REL-001.
//
// FR-PROG-001: ALL writes flow through the exported functions in this module.
// Components never touch `db` tables directly; they read via the hooks in
// ./hooks.ts. Every write is awaited (NFR-REL-001); on failure we
// console.error and notify onWriteError subscribers so the app shell can
// toast — a failed write is never silently dropped.

import Dexie, { type Table } from 'dexie';

import type { Attempt, ItemState, KV, LessonProgress, ModuleState } from './types';

/** Module metadata callers pass alongside lesson writes (from the content index). */
export interface ModuleMeta {
  courseId: string;
  subject: string;
  lessonsTotal: number;
  hasAssessment: boolean;
  lessonIds: string[];
}

class LearnLabDB extends Dexie {
  moduleState!: Table<ModuleState, string>;
  lessonProgress!: Table<LessonProgress, [string, string]>;
  attempts!: Table<Attempt, number>;
  itemState!: Table<ItemState, [string, string]>;
  kv!: Table<KV, string>;

  constructor() {
    super('learnlab');
    // SRS §5.5 — schema strings are normative; do not alter.
    this.version(1).stores({
      moduleState: 'moduleId, courseId, status, updatedAt',
      lessonProgress: '[moduleId+lessonId], moduleId, updatedAt',
      attempts: '++attemptId, [moduleId+itemId], itemId, finishedAt',
      itemState: '[moduleId+itemId], updatedAt',
      kv: 'key',
    });
  }
}

export const db = new LearnLabDB();

// ---------------------------------------------------------------------------
// Write-error surfacing (NFR-REL-001)
// ---------------------------------------------------------------------------

export type WriteErrorListener = (error: unknown, context: string) => void;

const writeErrorListeners = new Set<WriteErrorListener>();

/**
 * Subscribe to failed Dexie writes (NFR-REL-001). The app shell uses this to
 * show a toast. Returns an unsubscribe function.
 */
export function onWriteError(cb: WriteErrorListener): () => void {
  writeErrorListeners.add(cb);
  return () => {
    writeErrorListeners.delete(cb);
  };
}

function reportWriteError(context: string, error: unknown): void {
  console.error(`[progress] write failed: ${context}`, error);
  for (const listener of writeErrorListeners) {
    try {
      listener(error, context);
    } catch {
      // A faulty listener must not mask the original failure.
    }
  }
}

/**
 * Run a write, awaiting it fully. On failure: console.error + notify
 * subscribers, then resolve `undefined` (the failure is surfaced via
 * onWriteError, not via an unhandled rejection in a component).
 */
async function guardedWrite<T>(context: string, op: () => Promise<T>): Promise<T | undefined> {
  try {
    return await op();
  } catch (error) {
    reportWriteError(context, error);
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// Write API
// ---------------------------------------------------------------------------

/** ItemState payload cap, enforced on write (SRS §5.5, §6.3 PERSIST rule). */
export const ITEM_STATE_MAX_BYTES = 64 * 1024;

/**
 * Insert one finished quiz/python run (FR-QUIZ-003). If the run is a module
 * assessment: updates `moduleState.assessmentBest` when improved, and marks
 * the module `completed` when score/maxScore >= passMark AND all lessons are
 * done. `passMark` is a fraction in [0, 1].
 * Resolves to the new attemptId, or undefined if the write failed.
 */
export async function recordAttempt(
  attempt: Omit<Attempt, 'attemptId'>,
  passMarkInfo?: { passMark: number; isAssessment: boolean },
): Promise<number | undefined> {
  return guardedWrite('recordAttempt', () =>
    db.transaction('rw', db.attempts, db.moduleState, async () => {
      const attemptId = await db.attempts.add({ ...attempt });
      if (passMarkInfo?.isAssessment) {
        const ms = await db.moduleState.get(attempt.moduleId);
        if (ms) {
          const now = Date.now();
          const ratio = attempt.maxScore > 0 ? attempt.score / attempt.maxScore : 0;
          const best = ms.assessmentBest;
          const bestRatio = best && best.maxScore > 0 ? best.score / best.maxScore : -1;
          const next: ModuleState = { ...ms, updatedAt: now };
          if (ratio > bestRatio) {
            next.assessmentBest = {
              score: attempt.score,
              maxScore: attempt.maxScore,
              at: attempt.finishedAt,
            };
          }
          if (
            ratio >= passMarkInfo.passMark &&
            ms.lessonsDone === ms.lessonsTotal &&
            next.status !== 'completed'
          ) {
            next.status = 'completed';
            next.completedAt = now;
          }
          await db.moduleState.put(next);
        }
      }
      return attemptId;
    }),
  );
}

/**
 * Mark a lesson completed (FR-PROG-002). Upserts the lessonProgress row to
 * `completed`, recomputes `moduleState.lessonsDone` by counting completed
 * lessonProgress rows for the module, and transitions module status:
 * not-started → in-progress on first activity (with startedAt); → completed
 * when all lessons are done and the module has no assessment.
 */
export async function markLessonComplete(
  moduleId: string,
  lessonId: string,
  moduleMeta: ModuleMeta,
): Promise<void> {
  await guardedWrite('markLessonComplete', () =>
    db.transaction('rw', db.lessonProgress, db.moduleState, async () => {
      const now = Date.now();
      const existing = await db.lessonProgress.get([moduleId, lessonId]);
      await db.lessonProgress.put({
        moduleId,
        lessonId,
        status: 'completed',
        completedAt: existing?.completedAt ?? now,
        updatedAt: now,
        timeSpentSec: existing?.timeSpentSec ?? 0,
      });

      const rows = await db.lessonProgress.where('moduleId').equals(moduleId).toArray();
      const lessonsDone = rows.filter(
        (r) => r.status === 'completed' && moduleMeta.lessonIds.includes(r.lessonId),
      ).length;

      const ms = await db.moduleState.get(moduleId);
      const base: ModuleState = ms ?? {
        moduleId,
        courseId: moduleMeta.courseId,
        subject: moduleMeta.subject,
        status: 'not-started',
        updatedAt: now,
        lessonsDone: 0,
        lessonsTotal: moduleMeta.lessonsTotal,
      };
      const next: ModuleState = {
        ...base,
        lessonsDone,
        lessonsTotal: moduleMeta.lessonsTotal,
        updatedAt: now,
      };
      if (next.status === 'not-started') {
        next.status = 'in-progress';
        next.startedAt = base.startedAt ?? now;
      }
      if (
        lessonsDone === moduleMeta.lessonsTotal &&
        !moduleMeta.hasAssessment &&
        next.status !== 'completed'
      ) {
        next.status = 'completed';
        next.completedAt = now;
      }
      await db.moduleState.put(next);
    }),
  );
}

/**
 * Record first activity on a lesson: marks the lessonProgress row
 * in-progress (never downgrades a completed one) and creates the moduleState
 * row if missing, transitioning not-started → in-progress with startedAt.
 */
export async function touchLesson(
  moduleId: string,
  lessonId: string,
  moduleMeta: ModuleMeta,
): Promise<void> {
  await guardedWrite('touchLesson', () =>
    db.transaction('rw', db.lessonProgress, db.moduleState, async () => {
      const now = Date.now();
      const lp = await db.lessonProgress.get([moduleId, lessonId]);
      if (!lp) {
        await db.lessonProgress.put({
          moduleId,
          lessonId,
          status: 'in-progress',
          updatedAt: now,
          timeSpentSec: 0,
        });
      } else if (lp.status === 'not-started') {
        await db.lessonProgress.put({ ...lp, status: 'in-progress', updatedAt: now });
      }

      const ms = await db.moduleState.get(moduleId);
      if (!ms) {
        await db.moduleState.put({
          moduleId,
          courseId: moduleMeta.courseId,
          subject: moduleMeta.subject,
          status: 'in-progress',
          startedAt: now,
          updatedAt: now,
          lessonsDone: 0,
          lessonsTotal: moduleMeta.lessonsTotal,
        });
      } else if (ms.status === 'not-started') {
        await db.moduleState.put({
          ...ms,
          status: 'in-progress',
          startedAt: ms.startedAt ?? now,
          updatedAt: now,
        });
      }
    }),
  );
}

/**
 * Accumulate time spent on a lesson (30 s heartbeat is the caller's job).
 * Creates an in-progress row if none exists yet.
 */
export async function addLessonTime(
  moduleId: string,
  lessonId: string,
  seconds: number,
): Promise<void> {
  await guardedWrite('addLessonTime', () =>
    db.transaction('rw', db.lessonProgress, async () => {
      const now = Date.now();
      const lp = await db.lessonProgress.get([moduleId, lessonId]);
      if (lp) {
        await db.lessonProgress.put({
          ...lp,
          timeSpentSec: lp.timeSpentSec + seconds,
          updatedAt: now,
        });
      } else {
        await db.lessonProgress.put({
          moduleId,
          lessonId,
          status: 'in-progress',
          updatedAt: now,
          timeSpentSec: seconds,
        });
      }
    }),
  );
}

/**
 * Persist arbitrary item state. Payloads over 64 KB (JSON-serialized) are
 * dropped with a console.warn — not an error, not a write (§6.3 PERSIST rule).
 */
export async function setItemState(
  moduleId: string,
  itemId: string,
  state: unknown,
): Promise<void> {
  let size: number;
  try {
    size = JSON.stringify(state)?.length ?? 0;
  } catch (error) {
    console.warn(`[progress] setItemState(${moduleId}/${itemId}) dropped: not JSON-safe`, error);
    return;
  }
  if (size > ITEM_STATE_MAX_BYTES) {
    console.warn(
      `[progress] setItemState(${moduleId}/${itemId}) dropped: payload ${size} B exceeds ${ITEM_STATE_MAX_BYTES} B cap`,
    );
    return;
  }
  await guardedWrite('setItemState', () =>
    db.itemState.put({ moduleId, itemId, state, updatedAt: Date.now() }),
  );
}

/** Read a persisted item state (the JSON-safe `state`), or null if none. */
export async function getItemState(moduleId: string, itemId: string): Promise<unknown> {
  const row = await db.itemState.get([moduleId, itemId]);
  return row ? row.state : null;
}

/** Read a kv value. */
export async function kvGet<T>(key: string): Promise<T | undefined> {
  const row = await db.kv.get(key);
  return row?.value as T | undefined;
}

/** Write a kv value. */
export async function kvSet(key: string, value: unknown): Promise<void> {
  await guardedWrite('kvSet', () => db.kv.put({ key, value }));
}
