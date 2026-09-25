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

export type { Achievement, EngagementEvent, EngagementState } from './engagement-types';

export { ACHIEVEMENTS, pointsForEvent } from './engagement';

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
  recordEngagementEvent,
  recordCalibration,
  recordReview,
  removeReviewItem,
  scheduleReview,
  seedReviewItem,
  setItemState,
  getItemState,
  touchLesson,
  type ModuleMeta,
  type WriteErrorListener,
} from './db';

export {
  forecastReviews,
  useAllReviewItems,
  useCalibration,
  useLastLessonActivity,
  useReviewForecast,
  useAttempts,
  useBestAttempt,
  useCourseProgress,
  useDueReviewCount,
  useDueReviewItems,
  useEngagement,
  useKv,
  useLessonProgressList,
  useModuleState,
  useOverallProgress,
  type CourseProgress,
  type ModuleMemory,
  type ReviewForecast,
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
  MS_PER_DAY,
  flashcardReviewItemId,
  quizReviewItemId,
  screenReviewItemId,
  sm2Step,
  sm2StepLite,
  type ReviewGrade,
  type Sm2State,
} from './srs';

export {
  DESIRED_RETENTION,
  GRADE_RATING,
  nextIntervalDays,
  retrievability,
  type FsrsMemory,
} from './fsrs';

export {
  CALIBRATION_MIN_SAMPLE,
  CONFIDENCE_LABELS,
  CONFIDENCE_LEVELS,
  EMPTY_CALIBRATION,
  accuracy,
  calibrationInsight,
  gradeForAnswer,
  isConfidentError,
  type CalibrationBucket,
  type CalibrationState,
  type Confidence,
} from './calibration';
