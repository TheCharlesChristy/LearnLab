// Progress record shapes — normative per SRS §5.5 (verbatim).
// Pinned by the orchestrator (T0.C). Do not add or rename fields.

export interface ModuleState {
  moduleId: string;
  courseId: string;
  subject: string;
  status: 'not-started' | 'in-progress' | 'completed';
  startedAt?: number; // epoch ms
  completedAt?: number;
  updatedAt: number;
  lessonsDone: number;
  lessonsTotal: number;
  assessmentBest?: { score: number; maxScore: number; at: number };
}

export interface LessonProgress {
  moduleId: string;
  lessonId: string;
  status: 'not-started' | 'in-progress' | 'completed';
  completedAt?: number;
  updatedAt: number;
  timeSpentSec: number; // accumulated, 30 s heartbeat while visible
}

// One per finished quiz run (native or Python QuizItem).
export interface Attempt {
  attemptId?: number; // auto-increment
  moduleId: string;
  itemId: string; // quiz id or python item id
  kind: 'assessment' | 'inline-quiz' | 'python-item';
  score: number;
  maxScore: number;
  startedAt: number;
  finishedAt: number;
  answers: unknown; // engine-defined echo of given answers (JSON-safe)
}

export interface ItemState {
  moduleId: string;
  itemId: string;
  state: unknown; // JSON-safe, ≤ 64 KB enforced on write
  updatedAt: number;
}

export interface KV {
  key: string;
  value: unknown; // 'theme', 'pyodideConsent', 'lastRoute', …
}

// SM-2-lite spaced-repetition state (§13 roadmap), one row per reviewable
// item: a flashcard (`flashcards:${src}:${cardIndex}`) or a missed
// assessment/quiz question (`quiz:${itemId}:${questionId}`). D-021: a
// 2-grade "lite" quality scale (again/good), not full SM-2's 0-5, matching
// flashcards' existing 2-button grading UX exactly — see src/progress/srs.ts.
export interface ReviewState {
  moduleId: string;
  itemId: string;
  easinessFactor: number; // SM-2 EF; floor 1.3, starts 2.5
  intervalDays: number;
  repetitions: number; // consecutive "good" grades; resets to 0 on "again"
  dueAt: number; // epoch ms
  lastReviewedAt: number;
  lastQuality: number; // 2 ("again") or 4 ("good") — see GRADE_QUALITY in srs.ts
  updatedAt: number;
}

// §5.5 export file shape (FR-PROG-003). exportVersion 2 adds `reviewState`
// (D-021, NFR-MAINT-002): new exports always include it; importing an older
// version-1 file (which has no reviewState key) treats it as empty — see
// validateExport in export.ts, the system-boundary parser for this.
export interface ProgressExport {
  app: 'learnlab';
  exportVersion: 1 | 2;
  exportedAt: string;
  tables: {
    moduleState: ModuleState[];
    lessonProgress: LessonProgress[];
    attempts: Attempt[];
    itemState: ItemState[];
    kv: KV[];
    reviewState: ReviewState[];
  };
}
