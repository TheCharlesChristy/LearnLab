// Export / import / erase of the progress database.
// FR-PROG-003 (export file shape), FR-PROG-004 (merge policy),
// FR-PROG-005 (erase), NFR-MAINT-002 (version compatibility rule).

import { db } from './db';
import type { EngagementState } from './engagement-types';
import type {
  Attempt,
  ItemState,
  KV,
  LessonProgress,
  ModuleState,
  ProgressExport,
  ReviewState,
} from './types';

export interface ImportSummary {
  imported: number;
  skipped: number;
}

/** Snapshot all tables into the §5.5 / FR-PROG-003 export shape (D-021: v2 adds reviewState; D-027: v3 adds engagement). */
export async function exportProgress(): Promise<ProgressExport> {
  const [moduleState, lessonProgress, attempts, itemState, kv, reviewState, engagement] =
    await db.transaction(
      'r',
      [db.moduleState, db.lessonProgress, db.attempts, db.itemState, db.kv, db.reviewState, db.engagement],
      () =>
        Promise.all([
          db.moduleState.toArray(),
          db.lessonProgress.toArray(),
          db.attempts.toArray(),
          db.itemState.toArray(),
          db.kv.toArray(),
          db.reviewState.toArray(),
          db.engagement.toArray(),
        ]),
    );
  return {
    app: 'learnlab',
    exportVersion: 3,
    exportedAt: new Date().toISOString(),
    tables: { moduleState, lessonProgress, attempts, itemState, kv, reviewState, engagement },
  };
}

/** Trigger a download of `learnlab-progress-YYYYMMDD.json` (FR-PROG-003). */
export async function downloadProgress(): Promise<void> {
  const data = await exportProgress();
  const d = new Date(data.exportedAt);
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `learnlab-progress-${stamp}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Import validation (FR-PROG-004: invalid files rejected with a reason and
// change nothing)
// ---------------------------------------------------------------------------

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

const MODULE_STATUSES = ['not-started', 'in-progress', 'completed'];
const ATTEMPT_KINDS = ['assessment', 'inline-quiz', 'python-item'];

function isModuleState(v: unknown): v is ModuleState {
  return (
    isRecord(v) &&
    typeof v.moduleId === 'string' &&
    typeof v.courseId === 'string' &&
    typeof v.subject === 'string' &&
    typeof v.status === 'string' &&
    MODULE_STATUSES.includes(v.status) &&
    typeof v.updatedAt === 'number' &&
    typeof v.lessonsDone === 'number' &&
    typeof v.lessonsTotal === 'number'
  );
}

function isLessonProgress(v: unknown): v is LessonProgress {
  return (
    isRecord(v) &&
    typeof v.moduleId === 'string' &&
    typeof v.lessonId === 'string' &&
    typeof v.status === 'string' &&
    MODULE_STATUSES.includes(v.status) &&
    typeof v.updatedAt === 'number' &&
    typeof v.timeSpentSec === 'number'
  );
}

function isAttempt(v: unknown): v is Attempt {
  return (
    isRecord(v) &&
    typeof v.moduleId === 'string' &&
    typeof v.itemId === 'string' &&
    typeof v.kind === 'string' &&
    ATTEMPT_KINDS.includes(v.kind) &&
    typeof v.score === 'number' &&
    typeof v.maxScore === 'number' &&
    typeof v.startedAt === 'number' &&
    typeof v.finishedAt === 'number'
  );
}

function isItemState(v: unknown): v is ItemState {
  return (
    isRecord(v) &&
    typeof v.moduleId === 'string' &&
    typeof v.itemId === 'string' &&
    typeof v.updatedAt === 'number' &&
    'state' in v
  );
}

function isKv(v: unknown): v is KV {
  return isRecord(v) && typeof v.key === 'string' && 'value' in v;
}

function isReviewState(v: unknown): v is ReviewState {
  return (
    isRecord(v) &&
    typeof v.moduleId === 'string' &&
    typeof v.itemId === 'string' &&
    typeof v.easinessFactor === 'number' &&
    typeof v.intervalDays === 'number' &&
    typeof v.repetitions === 'number' &&
    typeof v.dueAt === 'number' &&
    typeof v.updatedAt === 'number'
  );
}

function isEngagementState(v: unknown): v is EngagementState {
  return (
    isRecord(v) &&
    v.id === 'me' &&
    typeof v.points === 'number' &&
    typeof v.currentStreak === 'number' &&
    typeof v.longestStreak === 'number' &&
    typeof v.lastActiveDateKey === 'string' &&
    Array.isArray(v.unlockedAchievements) &&
    v.unlockedAchievements.every((a) => typeof a === 'string') &&
    typeof v.updatedAt === 'number'
  );
}

/**
 * Validate an unknown parsed JSON value as a ProgressExport. Throws an Error
 * with a human-readable reason on any problem; touches nothing. D-021/D-027
 * (NFR-MAINT-002): version 1 files (no `reviewState`) and version 1/2 files
 * (no `engagement`) are accepted — they simply import with an empty review
 * queue / zeroed engagement, since those versions predate those tables.
 */
function validateExport(data: unknown): ProgressExport {
  if (!isRecord(data)) {
    throw new Error('Import rejected: file is not a JSON object.');
  }
  if (data.app !== 'learnlab') {
    throw new Error('Import rejected: this file is not a LearnLab progress export.');
  }
  const version = data.exportVersion;
  if (typeof version !== 'number') {
    throw new Error('Import rejected: missing or invalid exportVersion.');
  }
  if (version > 3) {
    // NFR-MAINT-002: fail loudly and actionably on unknown newer versions.
    throw new Error(
      `Import rejected: this file was exported by a newer version of LearnLab ` +
        `(exportVersion ${version}, this app understands up to version 3). ` +
        `Update LearnLab and try again.`,
    );
  }
  if (version !== 1 && version !== 2 && version !== 3) {
    throw new Error(`Import rejected: unsupported exportVersion ${version}.`);
  }
  const tables = data.tables;
  if (!isRecord(tables)) {
    throw new Error('Import rejected: missing tables object.');
  }
  const checks: [string, (v: unknown) => boolean][] = [
    ['moduleState', isModuleState],
    ['lessonProgress', isLessonProgress],
    ['attempts', isAttempt],
    ['itemState', isItemState],
    ['kv', isKv],
  ];
  for (const [name, check] of checks) {
    const rows = tables[name];
    if (!Array.isArray(rows)) {
      throw new Error(`Import rejected: tables.${name} is missing or not an array.`);
    }
    for (let i = 0; i < rows.length; i++) {
      if (!check(rows[i])) {
        throw new Error(`Import rejected: tables.${name}[${i}] is malformed.`);
      }
    }
  }
  // reviewState: absent entirely on v1 files (backfilled to []); when present
  // (v2+), every row must be well-formed.
  let reviewState: ReviewState[] = [];
  if ('reviewState' in tables) {
    const rows = tables.reviewState;
    if (!Array.isArray(rows)) {
      throw new Error('Import rejected: tables.reviewState is not an array.');
    }
    for (let i = 0; i < rows.length; i++) {
      if (!isReviewState(rows[i])) {
        throw new Error(`Import rejected: tables.reviewState[${i}] is malformed.`);
      }
    }
    reviewState = rows as ReviewState[];
  }
  // engagement: absent entirely on v1/v2 files (backfilled to []); when
  // present (v3), every row must be well-formed.
  let engagement: EngagementState[] = [];
  if ('engagement' in tables) {
    const rows = tables.engagement;
    if (!Array.isArray(rows)) {
      throw new Error('Import rejected: tables.engagement is not an array.');
    }
    for (let i = 0; i < rows.length; i++) {
      if (!isEngagementState(rows[i])) {
        throw new Error(`Import rejected: tables.engagement[${i}] is malformed.`);
      }
    }
    engagement = rows as EngagementState[];
  }
  return {
    ...(data as object),
    tables: { ...tables, reviewState, engagement },
  } as unknown as ProgressExport;
}

/**
 * Import a progress export (FR-PROG-004). Merge policy: per primary key the
 * record with the newer `updatedAt` (`finishedAt` for attempts) wins;
 * attempts are unioned, deduped on (moduleId, itemId, startedAt). For `kv`
 * (no timestamp) an existing local value wins. Invalid input rejects with a
 * reason and changes nothing; the merge runs in one transaction so a failure
 * rolls back entirely.
 */
export async function importProgress(data: unknown): Promise<ImportSummary> {
  const parsed = validateExport(data);
  const t = parsed.tables;

  return db.transaction(
    'rw',
    [db.moduleState, db.lessonProgress, db.attempts, db.itemState, db.kv, db.reviewState, db.engagement],
    async () => {
      let imported = 0;
      let skipped = 0;

      for (const incoming of t.moduleState) {
        const existing = await db.moduleState.get(incoming.moduleId);
        if (!existing || incoming.updatedAt > existing.updatedAt) {
          await db.moduleState.put(incoming);
          imported++;
        } else {
          skipped++;
        }
      }

      for (const incoming of t.lessonProgress) {
        const existing = await db.lessonProgress.get([incoming.moduleId, incoming.lessonId]);
        if (!existing || incoming.updatedAt > existing.updatedAt) {
          await db.lessonProgress.put(incoming);
          imported++;
        } else {
          skipped++;
        }
      }

      for (const incoming of t.itemState) {
        const existing = await db.itemState.get([incoming.moduleId, incoming.itemId]);
        if (!existing || incoming.updatedAt > existing.updatedAt) {
          await db.itemState.put(incoming);
          imported++;
        } else {
          skipped++;
        }
      }

      for (const incoming of t.kv) {
        const existing = await db.kv.get(incoming.key);
        if (!existing) {
          await db.kv.put(incoming);
          imported++;
        } else {
          skipped++;
        }
      }

      for (const incoming of t.reviewState) {
        const existing = await db.reviewState.get([incoming.moduleId, incoming.itemId]);
        if (!existing || incoming.updatedAt > existing.updatedAt) {
          await db.reviewState.put(incoming);
          imported++;
        } else {
          skipped++;
        }
      }

      for (const incoming of t.engagement) {
        const existing = await db.engagement.get(incoming.id);
        if (!existing || incoming.updatedAt > existing.updatedAt) {
          await db.engagement.put(incoming);
          imported++;
        } else {
          skipped++;
        }
      }

      // Attempts: union, deduped on (moduleId, itemId, startedAt).
      const attemptKey = (a: Attempt) => `${a.moduleId}\x00${a.itemId}\x00${a.startedAt}`;
      const seen = new Set((await db.attempts.toArray()).map(attemptKey));
      for (const incoming of t.attempts) {
        const key = attemptKey(incoming);
        if (seen.has(key)) {
          skipped++;
          continue;
        }
        seen.add(key);
        const row: Attempt = { ...incoming };
        delete row.attemptId; // let auto-increment assign a local id
        await db.attempts.add(row);
        imported++;
      }

      return { imported, skipped };
    },
  );
}

/**
 * Delete the whole Dexie database and recreate it empty (FR-PROG-005). The
 * typed-confirmation dialog and the subsequent reload are the app shell's
 * job; this only performs the destruction.
 */
export async function eraseAll(): Promise<void> {
  await db.delete();
  await db.open();
}
