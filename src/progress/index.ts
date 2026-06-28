// Public API of the progress subsystem (SRS §3.5: import-isolated leaf
// package — other code imports only from this barrel).

export type {
  Attempt,
  ItemState,
  KV,
  LessonProgress,
  ModuleState,
  ProgressExport,
} from './types';

export {
  ITEM_STATE_MAX_BYTES,
  addLessonTime,
  db,
  kvGet,
  kvSet,
  markLessonComplete,
  onWriteError,
  recordAttempt,
  setItemState,
  getItemState,
  touchLesson,
  type ModuleMeta,
  type WriteErrorListener,
} from './db';

export {
  useAttempts,
  useBestAttempt,
  useCourseProgress,
  useKv,
  useLessonProgressList,
  useModuleState,
  useOverallProgress,
  type CourseProgress,
} from './hooks';

export {
  downloadProgress,
  eraseAll,
  exportProgress,
  importProgress,
  type ImportSummary,
} from './export';

export { requestPersistentStorage, KV_PERSISTENT, KV_PERSIST_REQUESTED } from './persistence';
