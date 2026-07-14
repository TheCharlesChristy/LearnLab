// LearnLab progress store — Dexie database and the single write API.
// SRS §5.5 (normative schema), FR-PROG-001/002/007, FR-QUIZ-003, NFR-REL-001.
//
// FR-PROG-001: ALL writes flow through the exported functions in this module.
// Components never touch `db` tables directly; they read via the hooks in
// ./hooks.ts. Every write is awaited (NFR-REL-001); on failure we
// console.error and notify onWriteError subscribers so the app shell can
// toast — a failed write is never silently dropped.

import Dexie, { type Table } from 'dexie';

import { assertRegisteredEffect } from '../experience/run-state/effects';
import {
  assertWithinRunStorageCap,
  RUN_EVENT_MAX_BYTES,
  RUN_EVENT_MAX_PER_RUN,
  RUN_EVENT_MAX_TOTAL,
  RUN_PROJECTION_MAX_BYTES,
} from '../experience/run-state/limits';
import {
  createRunEvent,
  projectRunBoundary,
  projectRunStart,
  replayExperienceEvents,
} from '../experience/run-state/projection';
import type {
  ExperienceEvent,
  ExperienceRun,
  RunBoundaryInput,
  StartExperienceRunInput,
} from '../experience/run-state/types';
import type { Effect } from '../experience/types';
import { applyEngagementEvent, INITIAL_ENGAGEMENT_STATE } from './engagement';
import type { Achievement, EngagementEvent, EngagementState } from './engagement-types';
import { GRADE_QUALITY, INITIAL_SM2_STATE, MS_PER_DAY, sm2Step } from './srs';
import type { ReviewGrade } from './srs';
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
  experienceRuns!: Table<ExperienceRun, string>;
  experienceEvents!: Table<ExperienceEvent, [string, number]>;

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
    // Experience Runtime v2/B4: additive local-first diagnostic event log
    // plus its materialised resume projection. The log's compound primary key
    // fixes append order per run; event idempotency is guarded in the write API.
    this.version(4).stores({
      experienceRuns: 'runId, packId, experienceId, updatedAt',
      experienceEvents: '[runId+sequence], runId, occurredAt, eventId',
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
// Experience Runtime v2/B4 run projection and append-only event log
// ---------------------------------------------------------------------------

function assertRunBoundaryInput(
  input: RunBoundaryInput,
): asserts input is RunBoundaryInput & { effects: Effect[] } {
  if (!input.eventId || !input.nodeId || !Array.isArray(input.effects)) {
    throw new Error('A run boundary needs an event id, node id, and effects array.');
  }
  input.effects.forEach(assertRegisteredEffect);
  if (input.telemetry) {
    for (const value of Object.values(input.telemetry)) {
      if (value !== undefined && typeof value !== 'number' && typeof value !== 'string') {
        throw new Error('Run telemetry is malformed.');
      }
    }
  }
}

/** Start a v2 run at sequence 0 through the sole progress write boundary. */
export async function startExperienceRun(input: StartExperienceRunInput): Promise<ExperienceRun> {
  if (!input.runId || !input.eventId || !input.packId || !input.experienceId || !input.entryNodeId) {
    throw new Error('A run needs stable ids for the run, event, pack, experience, and entry node.');
  }
  const run = projectRunStart(input);
  const event = createRunEvent(input, run);
  assertWithinRunStorageCap(run, RUN_PROJECTION_MAX_BYTES, 'Run projection');
  assertWithinRunStorageCap(event, RUN_EVENT_MAX_BYTES, 'Run event');
  try {
    return await db.transaction('rw', [db.experienceRuns, db.experienceEvents], async () => {
      const existing = await db.experienceRuns.get(input.runId);
      if (existing) return existing;
      if ((await db.experienceEvents.count()) >= RUN_EVENT_MAX_TOTAL) {
        throw new Error(`Experience event log has reached its ${RUN_EVENT_MAX_TOTAL} event cap.`);
      }
      await db.experienceRuns.add(run);
      await db.experienceEvents.add(event);
      return run;
    });
  } catch (error) {
    reportWriteError('startExperienceRun', error);
    throw error;
  }
}

/** Atomically append one progress boundary and its materialised projection. */
export async function appendExperienceRunBoundary(
  runId: string,
  input: RunBoundaryInput,
): Promise<ExperienceRun> {
  assertRunBoundaryInput(input);
  try {
    return await db.transaction('rw', [db.experienceRuns, db.experienceEvents], async () => {
      const current = await db.experienceRuns.get(runId);
      if (!current) throw new Error(`Unknown experience run ${runId}.`);
      const existingEvents = await db.experienceEvents.where('runId').equals(runId).toArray();
      if (existingEvents.some((event) => event.eventId === input.eventId)) return current;
      if (existingEvents.length >= RUN_EVENT_MAX_PER_RUN) {
        throw new Error(`Experience run ${runId} has reached its ${RUN_EVENT_MAX_PER_RUN} event cap.`);
      }
      if ((await db.experienceEvents.count()) >= RUN_EVENT_MAX_TOTAL) {
        throw new Error(`Experience event log has reached its ${RUN_EVENT_MAX_TOTAL} event cap.`);
      }
      const event: ExperienceEvent = {
        runId,
        schemaVersion: 1,
        sequence: current.eventCount,
        eventId: input.eventId,
        occurredAt: input.occurredAt ?? Date.now(),
        kind: 'boundary-applied',
        nodeId: input.nodeId,
        effects: input.effects,
        ...(input.nextNodeId ? { nextNodeId: input.nextNodeId } : {}),
        ...(input.ending ? { ending: input.ending } : {}),
        ...(input.telemetry ? { telemetry: input.telemetry } : {}),
      };
      assertWithinRunStorageCap(event, RUN_EVENT_MAX_BYTES, 'Run event');
      const next = projectRunBoundary(current, event);
      assertWithinRunStorageCap(next, RUN_PROJECTION_MAX_BYTES, 'Run projection');
      await db.experienceEvents.add(event);
      await db.experienceRuns.put(next);
      return next;
    });
  } catch (error) {
    reportWriteError('appendExperienceRunBoundary', error);
    throw error;
  }
}

/** Read/replay helper which detects corrupted materialised state. */
export async function replayExperienceRun(runId: string): Promise<ExperienceRun> {
  const [run, events] = await Promise.all([
    db.experienceRuns.get(runId),
    db.experienceEvents.where('runId').equals(runId).toArray(),
  ]);
  if (!run) throw new Error(`Unknown experience run ${runId}.`);
  const replayed = replayExperienceEvents(events);
  if (JSON.stringify(replayed) !== JSON.stringify(run)) {
    throw new Error(`Run ${runId} is corrupt: its projection does not match its event log.`);
  }
  return replayed;
}

/** Explicitly erase v2 diagnostic state; app-wide erase also clears these tables. */
export async function eraseExperienceRunData(): Promise<void> {
  try {
    await db.transaction('rw', [db.experienceRuns, db.experienceEvents], async () => {
      await db.experienceRuns.clear();
      await db.experienceEvents.clear();
    });
  } catch (error) {
    reportWriteError('eraseExperienceRunData', error);
    throw error;
  }
}

/** Read-only diagnostic helpers; components still use hooks rather than tables. */
export async function experienceRunEventCount(runId: string): Promise<number> {
  return db.experienceEvents.where('runId').equals(runId).count();
}

export async function getExperienceRun(runId: string): Promise<ExperienceRun | undefined> {
  return db.experienceRuns.get(runId);
}

// ---------------------------------------------------------------------------
// Spaced-repetition review queue (SM-2-lite, §13 roadmap, D-021)
// ---------------------------------------------------------------------------

/**
 * Grade one reviewable item (a flashcard or a missed quiz question — see
 * `flashcardReviewItemId`/`quizReviewItemId` in ./srs) and schedule its next
 * due date via SM-2-lite. Creates the row on first grade.
 */
export async function recordReview(
  moduleId: string,
  itemId: string,
  grade: ReviewGrade,
): Promise<void> {
  await guardedWrite('recordReview', () =>
    db.transaction('rw', db.reviewState, async () => {
      const now = Date.now();
      const existing = await db.reviewState.get([moduleId, itemId]);
      const prev = existing ?? INITIAL_SM2_STATE;
      const quality = GRADE_QUALITY[grade];
      const next = sm2Step(prev, quality);
      const row: ReviewState = {
        moduleId,
        itemId,
        easinessFactor: next.easinessFactor,
        intervalDays: next.intervalDays,
        repetitions: next.repetitions,
        dueAt: now + next.intervalDays * MS_PER_DAY,
        lastReviewedAt: now,
        lastQuality: quality,
        updatedAt: now,
      };
      await db.reviewState.put(row);
    }),
  );
}

/**
 * Seed a reviewable item into the queue without grading it yet — used when a
 * quiz/assessment question is answered wrong for the first time, so it joins
 * the queue as due-tomorrow (same effect as an explicit "Again" grade)
 * without requiring the learner to visit the review page first.
 */
export async function seedReviewItem(moduleId: string, itemId: string): Promise<void> {
  const existing = await db.reviewState.get([moduleId, itemId]);
  if (existing) return; // already tracked; leave its real schedule alone
  await recordReview(moduleId, itemId, 'again');
}

/** All review items due at or before `now` (default: this instant), oldest-due first. */
export async function dueReviewItems(now: number = Date.now()): Promise<ReviewState[]> {
  const rows = await db.reviewState.where('dueAt').belowOrEqual(now).toArray();
  return rows.sort((a, b) => a.dueAt - b.dueAt);
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
