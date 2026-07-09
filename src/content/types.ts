// Content model types — normative per SRS §4.2–§4.4.
// Pinned by the orchestrator (T0.C). Do not add fields not present in the SRS.

export type SubjectId = 'maths' | 'physics' | 'cs' | 'ai';
export type CourseLevel = 'gcse' | 'as' | 'a2' | 'alevel' | 'foundation';

// §4.2 content/index.json (generated — never hand-edited)
export interface ContentIndex {
  schemaVersion: 1;
  generatedAt: string; // ISO 8601
  subjects: Subject[];
}
export interface Subject {
  id: SubjectId;
  title: string;
  courses: CourseRef[];
}
export interface CourseRef {
  id: string;
  path: string; // e.g. "maths/alevel-pure", relative to content/
  title: string;
  level: CourseLevel;
  moduleCount: number;
  totalEstMinutes: number;
}

// §4.3 course.json
export interface Course {
  schemaVersion: 1;
  id: string;
  title: string;
  subject: SubjectId;
  level: CourseLevel;
  description: string;
  accent?: string;
  modules: ModuleRef[];
}
export interface ModuleRef {
  id: string;
  dir: string;
}

// §4.4 module.json
export interface Module {
  schemaVersion: 1;
  id: string;
  title: string;
  description: string;
  estMinutes: number;
  prerequisites: string[];
  objectives: string[];
  tags?: string[];
  lessons: LessonMeta[];
  assessment?: { file: string; passMark: number };
  version: string;
  authors: string[];
}
export interface LessonMeta {
  id: string;
  title: string;
  file: string;
  /**
   * `"screens"` (Brilliant rewrite, docs/BRILLIANT_REWRITE_PLAN.md): `file`
   * points to a `*.screens.json` gated interactive sequence instead of
   * Markdown. Additive alongside `"markdown"`/`"python"` — existing lessons
   * are unaffected.
   */
  kind?: 'markdown' | 'python' | 'screens';
  estMinutes: number;
}
