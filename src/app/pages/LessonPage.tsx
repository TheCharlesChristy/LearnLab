// Lesson page (FR-SHELL-004): markdown content with retry card (FR-CONT-007),
// Previous/Next nav, manual + scroll-sentinel completion, persistent module
// progress bar, time heartbeat, LessonContext for inline quizzes/widgets.

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';

import {
  addLessonTime,
  getItemState,
  markLessonComplete,
  recordAttempt,
  recordEngagementEvent,
  recordReview,
  requestPersistentStorage,
  seedReviewItem,
  setItemState,
  touchLesson,
  useLessonProgressList,
  useModuleState,
} from '../../progress';
import type { ModuleMeta } from '../../progress';
import { Button, ProgressBar, Spinner, celebrate } from '../../ui';
import { ReadAloudControl } from '../../tts';
import { describeEngagementEvent } from '../engagement-copy';
import { LessonContext, loadLessonMarkdown, loadScreenSequence, moduleBaseUrl } from '../content-api';
import type { LessonContextValue, ModuleLocation } from '../content-api';
import { findModule } from '../content-api';
import { PyItemHost } from '../py-item-host';
import {
  Breadcrumb,
  LazyMarkdownLesson,
  LazyScreenSequenceEngine,
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
  const isScreens = lesson?.kind === 'screens';
  const markdown = useAsyncData(
    () =>
      lesson && !isPython && !isScreens
        ? loadLessonMarkdown(coursePath, moduleRef.dir, lesson.file)
        : Promise.resolve(''),
    `lesson-md:${moduleId}:${lessonId}:${lesson?.file ?? ''}`,
  );
  // Lesson.kind: "screens" (docs/BRILLIANT_REWRITE_PLAN.md) — a gated
  // interactive sequence instead of Markdown.
  const screenSeq = useAsyncData(
    () =>
      lesson && isScreens
        ? loadScreenSequence(coursePath, moduleRef.dir, lesson.file)
        : Promise.resolve(null),
    `lesson-screens:${moduleId}:${lessonId}:${lesson?.file ?? ''}`,
  );

  // Was this lesson already completed before *this* render (a prior visit,
  // or earlier in this same session)? Read via a ref so `complete()` below
  // always sees the latest value without needing to be recreated on every
  // lessonProgress change (engagement points must only ever be awarded on
  // the FIRST genuine completion, never on a revisit).
  const wasAlreadyComplete =
    completedNow ||
    (lessonProgress ?? []).some((lp) => lp.lessonId === lessonId && lp.status === 'completed');
  const wasAlreadyCompleteRef = useRef(wasAlreadyComplete);
  useEffect(() => {
    wasAlreadyCompleteRef.current = wasAlreadyComplete;
  });

  const complete = useMemo(
    () => async () => {
      const alreadyComplete = wasAlreadyCompleteRef.current;
      await markLessonComplete(moduleId, lessonId, meta);
      setCompletedNow(true);
      await requestPersistentStorage();
      // FR-PROG-002 / D-027: award lesson-complete points/streak/achievement
      // progress exactly once per lesson, the first time it's genuinely
      // completed. Re-completing an already-completed lesson (e.g. the
      // scroll sentinel firing again on a revisit) must not re-award points.
      if (!alreadyComplete) {
        const event = { kind: 'lesson-complete' as const };
        const result = await recordEngagementEvent(event);
        if (result) celebrate({ message: describeEngagementEvent(event, result) });
      }
    },
    [moduleId, lessonId, meta],
  );

  // Auto-complete via a scroll sentinel at the end of the content
  // (FR-SHELL-004 — works alongside the manual button).
  const sentinelRef = useRef<HTMLDivElement>(null);
  const legacyBodyRef = useRef<HTMLDivElement>(null);
  const completeRef = useRef(complete);
  useEffect(() => {
    completeRef.current = complete;
  });
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    let fired = false;
    // IntersectionObserver reports the CURRENT intersection state as its
    // first callback, immediately on observe() — for a short lesson (or a
    // tall viewport), the sentinel can already be in view the instant the
    // page loads, which would otherwise auto-complete the lesson (and award
    // points) from merely opening it, before the learner has read anything.
    // Ignore that first, baseline report; only a later, genuine transition
    // into view (an actual scroll) counts.
    let sawFirstReport = false;
    const io = new IntersectionObserver((entries) => {
      if (!sawFirstReport) {
        sawFirstReport = true;
        return;
      }
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
      getItemState: (itemId) => getItemState(moduleId, itemId),
      setItemState: (itemId, state) => setItemState(moduleId, itemId, state),
      recordReview: (itemId, grade) => recordReview(moduleId, itemId, grade),
      seedReviewItem: (itemId) => seedReviewItem(moduleId, itemId),
      notifyEngagement: (event) => {
        void (async () => {
          const result = await recordEngagementEvent(event);
          if (result) {
            // Per-screen completion (docs/BRILLIANT_REWRITE_PLAN.md) is
            // frequent within one lesson — a small toast per screen matches
            // "immediate feedback on every interaction", but a confetti
            // burst every 20-30s would be noise; confetti stays reserved
            // for whole-artifact milestones (lesson/quiz/deck/game).
            celebrate({
              message: describeEngagementEvent(event, result),
              confetti: event.kind !== 'screen-complete',
            });
          }
        })();
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
  const isComplete = wasAlreadyComplete;

  return (
    <LessonContext.Provider value={lessonCtx}>
      <div className="print:hidden">
        <Breadcrumb
          crumbs={[
            { label: 'Catalogue', to: '/' },
            { label: SUBJECT_LABELS[course.subject] ?? subjectId },
            { label: course.title, to: `/course/${course.id}` },
            { label: mod.title, to: `/module/${moduleId}` },
            { label: lesson.title },
          ]}
        />
      </div>

      {/* Persistent module progress bar (FR-SHELL-004). Hidden on paper: it's
          a live-progress affordance with no meaning on a static printout. */}
      <div className="sticky top-0 z-10 -mx-4 mb-4 border-b border-slate-200 bg-surface/95 px-4 py-2 backdrop-blur dark:border-slate-700 dark:bg-surface-dark/95 print:hidden">
        <ProgressBar
          value={lessonsTotal > 0 ? (lessonsDone / lessonsTotal) * 100 : 0}
          label={`Module progress: ${lessonsDone} of ${lessonsTotal} lessons complete`}
        />
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
          {lessonsDone}/{lessonsTotal} lessons complete
        </p>
      </div>

      <article className="lesson-article">
        <h1 className="mb-4 text-2xl font-bold">{lesson.title}</h1>
        {/* Read-aloud (docs/BRILLIANT_REWRITE_PLAN.md): legacy Markdown
            lessons only — the screens format gets its own control per
            screen (src/screens/ScreenShell.tsx), and Python full-page items
            are arbitrary interactive React, not simple prose. resetKey is
            lessonId because LessonPage's component instance persists across
            a Prev/Next navigation (same route pattern, only params change),
            so an unmount-only cleanup wouldn't stop speech when switching
            lessons. */}
        {!isPython && !isScreens && (
          <ReadAloudControl targetRef={legacyBodyRef} resetKey={lessonId} className="mb-4 print:hidden" />
        )}
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
        ) : isScreens ? (
          // Lesson.kind === "screens" (docs/BRILLIANT_REWRITE_PLAN.md): a
          // gated interactive sequence. Completion is driven exclusively by
          // finishing the sequence (below) — the scroll sentinel and manual
          // "Mark lesson complete" button are suppressed for this kind so
          // there is no path to completion that skips the interaction.
          screenSeq.status === 'loading' ? (
            <Spinner label="Loading lesson…" />
          ) : screenSeq.status === 'error' ? (
            <RetryCard what="this lesson" error={screenSeq.error} onRetry={screenSeq.retry} />
          ) : screenSeq.data ? (
            <Suspense fallback={<Spinner label="Preparing lesson…" />}>
              <LazyScreenSequenceEngine
                sequence={screenSeq.data}
                lessonId={lessonId}
                onSequenceComplete={() => void complete()}
              />
            </Suspense>
          ) : null
        ) : markdown.status === 'loading' ? (
          <Spinner label="Loading lesson…" />
        ) : markdown.status === 'error' ? (
          <RetryCard what="this lesson" error={markdown.error} onRetry={markdown.retry} />
        ) : (
          <div ref={legacyBodyRef}>
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
          </div>
        )}
      </article>

      {/* End-of-content scroll sentinel (auto-complete) — not for screens-kind
          lessons, which complete only via the sequence engine above. */}
      {!isScreens && (
        <div ref={sentinelRef} data-testid="lesson-end-sentinel" aria-hidden className="h-px" />
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 print:hidden dark:border-slate-700">
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
        {isScreens ? (
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {isComplete ? 'Lesson completed' : 'Complete every screen above to continue'}
          </p>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => window.print()}>
              Print this lesson
            </Button>
            <Button onClick={() => void complete()} disabled={isComplete}>
              {isComplete ? 'Lesson completed' : 'Mark lesson complete'}
            </Button>
          </div>
        )}
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
