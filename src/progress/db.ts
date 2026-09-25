// LearnLab progress store — Dexie database and the single write API.
// SRS §5.5 (normative schema), FR-PROG-001/002/007, FR-QUIZ-003, NFR-REL-001.
//
// FR-PROG-001: ALL writes flow through the exported functions in this module.
// Components never touch `db` tables directly; they read via the hooks in
// ./hooks.ts. Every write is awaited (NFR-REL-001); on failure we
// console.error and notify onWriteError subscribers so the app shell can
// toast — a failed write is never silently dropped.

import Dexie, { type Table } from 'dexie';

import { applyEngagementEvent, INITIAL_ENGAGEMENT_STATE } from './engagement';
import type { Achievement, EngagementEvent, EngagementState } from './engagement-types';
import { addCalibration, KV_CALIBRATION, toCalibrationState } from './calibration';
import type { Confidence } from './calibration';
import { GRADE_RATING, initialMemory, memoryFromLegacy, nextIntervalDays, nextMemory } from './fsrs';
import type { FsrsMemory, ReviewGrade } from './fsrs';
import { GRADE_QUALITY, INITIAL_SM2_STATE, MS_PER_DAY } from './srs';
import type { Attempt, ItemState, KV, LessonProgress, ModuleState, ReviewState } from './types';

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
  reviewState!: Table<ReviewState, [string, string]>;
  engagement!: Table<EngagementState, string>;

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
    // D-021 (§13 roadmap): additive Dexie schema upgrade for the
    // spaced-repetition review queue. Unrelated to ProgressExport's own
    // `exportVersion` field (which happens to also become 2) — this is
    // Dexie's independent on-disk schema version counter.
    this.version(2).stores({
      reviewState: '[moduleId+itemId], dueAt',
    });
    // D-027: additive Dexie schema upgrade for the engagement (streaks/
    // points/achievements) singleton row. Same non-normative-addition
    // pattern as version 2 — see engagement-types.ts.
    this.version(3).stores({
      engagement: 'id',
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

// ---------------------------------------------------------------------------
// Spaced-repetition review queue (FSRS-6, D-033; originally SM-2-lite, D-021)
// ---------------------------------------------------------------------------

/**
 * Pure: the next ReviewState for one grade. Uses the row's FSRS memory when
 * present, converts a pre-D-033 SM-2 row via memoryFromLegacy(), or starts a
 * fresh memory for a first-ever grade. The SM-2 fields stay populated
 * (interval, repetitions, EF unchanged) so older readers see a valid row.
 */
export function scheduleReview(
  existing: ReviewState | undefined,
  moduleId: string,
  itemId: string,
  grade: ReviewGrade,
  now: number,
): ReviewState {
  const rating = GRADE_RATING[grade];
  let memory: FsrsMemory;
  if (!existing) {
    memory = initialMemory(rating);
  } else {
    const prev =
      existing.stability !== undefined && existing.difficulty !== undefined
        ? { stability: existing.stability, difficulty: existing.difficulty }
        : memoryFromLegacy(existing.intervalDays, existing.easinessFactor);
    const elapsedDays = Math.max(0, (now - existing.lastReviewedAt) / MS_PER_DAY);
    memory = nextMemory(prev, elapsedDays, rating);
  }
  const intervalDays = nextIntervalDays(memory.stability);
  const wasRemembered = (existing?.repetitions ?? 0) > 0;
  return {
    moduleId,
    itemId,
    easinessFactor: existing?.easinessFactor ?? INITIAL_SM2_STATE.easinessFactor,
    intervalDays,
    repetitions: grade === 'again' ? 0 : (existing?.repetitions ?? 0) + 1,
    dueAt: now + intervalDays * MS_PER_DAY,
    lastReviewedAt: now,
    lastQuality: GRADE_QUALITY[grade],
    updatedAt: now,
    stability: memory.stability,
    difficulty: memory.difficulty,
    lapses: (existing?.lapses ?? 0) + (grade === 'again' && wasRemembered ? 1 : 0),
  };
}

/**
 * Grade one reviewable item (a flashcard, a quiz question, or a screen
 * checkpoint — see the item-id helpers in ./srs) and schedule its next due
 * date via FSRS. Creates the row on first grade. Resolves to the new row, or
 * undefined if the write failed.
 */
export async function recordReview(
  moduleId: string,
  itemId: string,
  grade: ReviewGrade,
): Promise<ReviewState | undefined> {
  return guardedWrite('recordReview', () =>
    db.transaction('rw', db.reviewState, async () => {
      const existing = await db.reviewState.get([moduleId, itemId]);
      const row = scheduleReview(existing, moduleId, itemId, grade, Date.now());
      await db.reviewState.put(row);
      return row;
    }),
  );
}

/**
 * Seed a reviewable item into the queue the first time the learner meets it
 * (a quiz question, a lesson checkpoint), graded by how that first encounter
 * went — `again` for a miss (due tomorrow), `good`/`hard` for a first-try
 * success. No-op for an item that's already tracked, so a retry or a lesson
 * revisit never disturbs a real in-progress schedule.
 */
export async function seedReviewItem(
  moduleId: string,
  itemId: string,
  grade: ReviewGrade = 'again',
): Promise<void> {
  const existing = await db.reviewState.get([moduleId, itemId]);
  if (existing) return;
  await recordReview(moduleId, itemId, grade);
}

/** Drop an item from the queue — e.g. its content was removed from the course. */
export async function removeReviewItem(moduleId: string, itemId: string): Promise<void> {
  await guardedWrite('removeReviewItem', () => db.reviewState.delete([moduleId, itemId]));
}

/** All review items due at or before `now` (default: this instant), oldest-due first. */
export async function dueReviewItems(now: number = Date.now()): Promise<ReviewState[]> {
  const rows = await db.reviewState.where('dueAt').belowOrEqual(now).toArray();
  return rows.sort((a, b) => a.dueAt - b.dueAt);
}

/** Add one confidence-tagged review answer to the lifetime calibration record (kv). */
export async function recordCalibration(confidence: Confidence, correct: boolean): Promise<void> {
  await guardedWrite('recordCalibration', () =>
    db.transaction('rw', db.kv, async () => {
      const row = await db.kv.get(KV_CALIBRATION);
      const next = addCalibration(toCalibrationState(row?.value), confidence, correct);
      await db.kv.put({ key: KV_CALIBRATION, value: next });
    }),
  );
}

// ---------------------------------------------------------------------------
// Engagement (streaks/points/achievements, D-027) — additive, non-normative
// ---------------------------------------------------------------------------

/**
 * Apply one engagement event (lesson/quiz/deck/game completion): rolls the
 * daily streak, adds points, and unlocks any newly-earned achievements — see
 * ./engagement.ts for the pure rules. Never throws into the caller; on
 * failure (like every other write here) it reports via onWriteError and
 * resolves undefined, so a broken write never blocks the completion it rides
 * alongside (marking a lesson/attempt complete always succeeds independently
 * of this).
 */
export async function recordEngagementEvent(
  event: EngagementEvent,
): Promise<{ state: EngagementState; newlyUnlocked: Achievement[] } | undefined> {
  return guardedWrite('recordEngagementEvent', () =>
    db.transaction(
      'rw',
      [db.engagement, db.lessonProgress, db.moduleState],
      async () => {
        const prev = (await db.engagement.get('me')) ?? INITIAL_ENGAGEMENT_STATE;
        // lessonProgress has no 'status' index (SRS §5.5 schema is fixed to
        // version 1's strings) — filter() runs a full-table scan instead of
        // requiring one, which is fine at this table's size.
        const [totalLessonsCompleted, totalModulesCompleted] = await Promise.all([
          db.lessonProgress.filter((r) => r.status === 'completed').count(),
          db.moduleState.where('status').equals('completed').count(),
        ]);
        const result = applyEngagementEvent(prev, event, {
          totalLessonsCompleted,
          totalModulesCompleted,
        });
        await db.engagement.put(result.state);
        return result;
      },
    ),
  );
}
