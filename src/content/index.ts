// Public API of the content subsystem (SRS §3.5 — import-isolated; other
// subsystems import only from this barrel). Frozen contract with the app shell.

export * from './types';
export { LessonContext, useLessonContext, type LessonContextValue } from './lesson-context';
export {
  contentUrl,
  moduleBaseUrl,
  loadContentIndex,
  loadCourse,
  loadModule,
  loadLessonMarkdown,
  loadQuiz,
  loadScreenSequence,
  findModule,
  findCourse,
  ContentLoadError,
  clearContentCache,
  type ModuleLocation,
} from './loaders';
