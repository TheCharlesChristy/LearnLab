// Single import point for the content subsystem's public barrel (§3.5).
// All src/app code goes through this module so tests can mock one path
// (the barrel itself is built by a parallel task against a frozen contract).

export {
  contentUrl,
  moduleBaseUrl,
  loadContentIndex,
  loadCourse,
  loadModule,
  loadLessonMarkdown,
  loadQuiz,
  findModule,
  findCourse,
  LessonContext,
  useLessonContext,
} from '../content';

export type {
  ContentIndex,
  Subject,
  SubjectId,
  CourseRef,
  Course,
  Module,
  LessonMeta,
  ModuleLocation,
  LessonContextValue,
} from '../content';
