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

// §5.5 export file shape (FR-PROG-003)
export interface ProgressExport {
  app: 'learnlab';
  exportVersion: 1;
  exportedAt: string;
  tables: {
    moduleState: ModuleState[];
    lessonProgress: LessonProgress[];
    attempts: Attempt[];
    itemState: ItemState[];
    kv: KV[];
  };
}
