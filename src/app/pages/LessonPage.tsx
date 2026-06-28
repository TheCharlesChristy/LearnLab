// Lesson page (FR-SHELL-004): markdown content with retry card (FR-CONT-007),
// Previous/Next nav, manual + scroll-sentinel completion, persistent module
// progress bar, time heartbeat, LessonContext for inline quizzes/widgets.

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';

import {
  addLessonTime,
  markLessonComplete,
  recordAttempt,
  requestPersistentStorage,
  touchLesson,
  useLessonProgressList,
  useModuleState,
} from '../../progress';
import type { ModuleMeta } from '../../progress';
import { Button, ProgressBar, Spinner } from '../../ui';
import { LessonContext, loadLessonMarkdown, moduleBaseUrl } from '../content-api';
import type { LessonContextValue, ModuleLocation } from '../content-api';
import { findModule } from '../content-api';
import { PyItemHost } from '../py-item-host';
import {
  Breadcrumb,
  LazyMarkdownLesson,
  MissingContent,
  RetryCard,
  SUBJECT_LABELS,
  toModuleMeta,
} from '../shared';
import { useAsyncData } from '../useAsyncData';

const HEARTBEAT_SECONDS = 30;

/** touchLesson on mount + 30 s addLessonTime heartbeat while visible (§5.5). */
function useLessonActivity(moduleId: string, lessonId: string, meta: ModuleMeta | null) {
  const metaRef = useRef(meta);
  useEffect(() => {
    metaRef.current = meta;
  });

  useEffect(() => {
    if (!meta) return;
    // FR-PROG-007: request persistent storage once after the first
    // meaningful progress write (guarded internally).
    void touchLesson(moduleId, lessonId, meta).then(() => requestPersistentStorage());

    let interval: number | null = null;
    const start = () => {
      if (interval === null) {
        interval = window.setInterval(() => {
          void addLessonTime(moduleId, lessonId, HEARTBEAT_SECONDS);
        }, HEARTBEAT_SECONDS * 1000);
      }
    };
    const stop = () => {
      if (interval !== null) {
        window.clearInterval(interval);
        interval = null;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') start();
      else stop();
    };
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // meta is stable per (moduleId, lessonId) resolution; key on ids.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId, lessonId, meta === null]);
}

function LessonBody({ loc, lessonId }: { loc: ModuleLocation; lessonId: string }) {
  const { coursePath, course, module: mod, moduleRef, subjectId } = loc;
  const moduleId = mod.id;
  const lessonIndex = mod.lessons.findIndex((l) => l.id === lessonId);
  const lesson = lessonIndex >= 0 ? mod.lessons[lessonIndex] : undefined;
  const meta = useMemo(() => toModuleMeta(loc), [loc]);

  const moduleState = useModuleState(moduleId);
  const lessonProgress = useLessonProgressList(moduleId);
  const [completedNow, setCompletedNow] = useState(false);

  useLessonActivity(moduleId, lessonId, lesson ? meta : null);

  const isPython = lesson?.kind === 'python';
  const markdown = useAsyncData(
    () =>
      lesson && !isPython
        ? loadLessonMarkdown(coursePath, moduleRef.dir, lesson.file)
        : Promise.resolve(''),
    `lesson-md:${moduleId}:${lessonId}:${lesson?.file ?? ''}`,
  );

  const complete = useMemo(
    () => async () => {
      setCompletedNow(true);
      await markLessonComplete(moduleId, lessonId, meta);
      await requestPersistentStorage();
    },
    [moduleId, lessonId, meta],
  );

  // Auto-complete via a scroll sentinel at the end of the content
  // (FR-SHELL-004 — works alongside the manual button).
  const sentinelRef = useRef<HTMLDivElement>(null);
  const completeRef = useRef(complete);
  useEffect(() => {
    completeRef.current = complete;
  });
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    let fired = false;
    const io = new IntersectionObserver((entries) => {
      if (!fired && entries.some((e) => e.isIntersecting)) {
        fired = true;
        void completeRef.current();
        io.disconnect();
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [moduleId, lessonId]);

  const lessonCtx: LessonContextValue = useMemo(
    () => ({
      moduleId,
      moduleBaseUrl: moduleBaseUrl(coursePath, moduleRef.dir),
      // Inline quizzes record without passMarkInfo (FR-QUIZ-003).
      recordAttempt: async (attempt) => {
        await recordAttempt(attempt);
        await requestPersistentStorage();
      },
    }),
    [moduleId, coursePath, moduleRef.dir],
  );

  if (!lesson) return <MissingContent what={`Lesson “${lessonId}”`} />;

  const baseUrl = moduleBaseUrl(coursePath, moduleRef.dir);
  const prev = lessonIndex > 0 ? mod.lessons[lessonIndex - 1] : undefined;
  const next = lessonIndex < mod.lessons.length - 1 ? mod.lessons[lessonIndex + 1] : undefined;
  const lessonsDone = moduleState?.lessonsDone ?? 0;
  const lessonsTotal = moduleState?.lessonsTotal ?? mod.lessons.length;
  const isComplete =
    completedNow ||
    (lessonProgress ?? []).some((lp) => lp.lessonId === lessonId && lp.status === 'completed');

  return (
    <LessonContext.Provider value={lessonCtx}>
      <Breadcrumb
        crumbs={[
          { label: 'Catalogue', to: '/' },
          { label: SUBJECT_LABELS[course.subject] ?? subjectId },
          { label: course.title, to: `/course/${course.id}` },
          { label: mod.title, to: `/module/${moduleId}` },
          { label: lesson.title },
        ]}
      />

      {/* Persistent module progress bar (FR-SHELL-004). */}
      <div className="sticky top-0 z-10 -mx-4 mb-4 border-b border-slate-200 bg-surface/95 px-4 py-2 backdrop-blur dark:border-slate-700 dark:bg-surface-dark/95">
        <ProgressBar
          value={lessonsTotal > 0 ? (lessonsDone / lessonsTotal) * 100 : 0}
          label={`Module progress: ${lessonsDone} of ${lessonsTotal} lessons complete`}
        />
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
          {lessonsDone}/{lessonsTotal} lessons complete
        </p>
      </div>

      <article>
        <h1 className="mb-4 text-2xl font-bold">{lesson.title}</h1>
        {isPython ? (
          // Full-page Python lesson (Lesson.kind === 'python', §4.4): render the
          // item full-width instead of fetching markdown. Prev/Next, the
          // mark-complete action and the progress bar all live outside this.
          <PyItemHost
            moduleId={moduleId}
            sourceUrl={baseUrl + lesson.file}
            src={lesson.file}
            title={lesson.title}
          />
        ) : markdown.status === 'loading' ? (
          <Spinner label="Loading lesson…" />
        ) : markdown.status === 'error' ? (
          <RetryCard what="this lesson" error={markdown.error} onRetry={markdown.retry} />
        ) : (
          <Suspense fallback={<Spinner label="Preparing renderer…" />}>
            <LazyMarkdownLesson
              markdown={markdown.data}
              pyItemRenderer={(p) => (
                <PyItemHost
                  moduleId={moduleId}
                  sourceUrl={baseUrl + p.src}
                  src={p.src}
                  params={p.params}
                  height={p.height}
                />
              )}
            />
          </Suspense>
        )}
      </article>

      {/* End-of-content scroll sentinel (auto-complete). */}
      <div ref={sentinelRef} data-testid="lesson-end-sentinel" aria-hidden className="h-px" />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
        {prev ? (
          <Link
            to={`/module/${moduleId}/lesson/${prev.id}`}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-indigo-800 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:text-indigo-300 dark:hover:bg-slate-700"
          >
            ← Previous: {prev.title}
          </Link>
        ) : (
          <span />
        )}
        <Button onClick={() => void complete()} disabled={isComplete}>
          {isComplete ? 'Lesson completed' : 'Mark lesson complete'}
        </Button>
        {next ? (
          <Link
            to={`/module/${moduleId}/lesson/${next.id}`}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-indigo-800 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:text-indigo-300 dark:hover:bg-slate-700"
          >
            Next: {next.title} →
          </Link>
        ) : mod.assessment ? (
          <Link
            to={`/module/${moduleId}/assessment`}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-indigo-800 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:text-indigo-300 dark:hover:bg-slate-700"
          >
            Take the assessment →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </LessonContext.Provider>
  );
}

export default function LessonPage() {
  const { moduleId = '', lessonId = '' } = useParams();
  const loc = useAsyncData(() => findModule(moduleId), `module:${moduleId}`);

  if (loc.status === 'loading') return <Spinner label="Loading module…" />;
  if (loc.status === 'error') {
    return <RetryCard what="this module" error={loc.error} onRetry={loc.retry} />;
  }
  if (loc.data === null) return <MissingContent what={`Module “${moduleId}”`} />;
  return <LessonBody loc={loc.data} lessonId={lessonId} />;
}
