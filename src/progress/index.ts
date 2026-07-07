// Public API of the progress subsystem (SRS §3.5: import-isolated leaf
// package — other code imports only from this barrel).

export type {
  Attempt,
  ItemState,
  KV,
  LessonProgress,
  ModuleState,
  ProgressExport,
  ReviewState,
} from './types';

export {
  ITEM_STATE_MAX_BYTES,
  addLessonTime,
  db,
  dueReviewItems,
  kvGet,
  kvSet,
  markLessonComplete,
  onWriteError,
  recordAttempt,
  recordReview,
  seedReviewItem,
  setItemState,
  getItemState,
  touchLesson,
  type ModuleMeta,
  type WriteErrorListener,
} from './db';

export {
  useAllReviewItems,
  useAttempts,
  useBestAttempt,
  useCourseProgress,
  useDueReviewCount,
  useDueReviewItems,
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

export {
  GRADE_QUALITY,
  INITIAL_SM2_STATE,
  flashcardReviewItemId,
  quizReviewItemId,
  sm2Step,
  sm2StepLite,
  type ReviewGrade,
  type Sm2State,
} from './srs';
