// Assessment page (#/module/:moduleId/assessment): lazy QuizEngine with
// attempt numbering from prior attempts (FR-QUIZ-002), passMarkInfo wiring
// (FR-QUIZ-003) and a clearly-labelled practice mode (FR-QUIZ-006).

import { Suspense, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useParams } from 'react-router';

import {
  getItemState,
  recordAttempt,
  recordEngagementEvent,
  recordReview,
  requestPersistentStorage,
  seedReviewItem,
  setItemState,
  useAttempts,
} from '../../progress';
import { Card, Spinner, celebrate } from '../../ui';
import { LessonContext, findModule, loadQuiz, moduleBaseUrl } from '../content-api';
import type { LessonContextValue, ModuleLocation } from '../content-api';
import { describeEngagementEvent } from '../engagement-copy';
import {
  Breadcrumb,
  LazyMarkdownInline,
  LazyQuizEngine,
  MissingContent,
  RetryCard,
  SUBJECT_LABELS,
} from '../shared';
import { useAsyncData } from '../useAsyncData';

function renderQuizMarkdown(md: string): ReactNode {
  return (
    <Suspense fallback={<span>{md}</span>}>
      <LazyMarkdownInline markdown={md} />
    </Suspense>
  );
}

function AssessmentBody({ loc }: { loc: ModuleLocation }) {
  const { course, module: mod, coursePath, moduleRef, subjectId } = loc;
  const moduleId = mod.id;
  const assessment = mod.assessment;

  const quiz = useAsyncData(
    () =>
      assessment
        ? loadQuiz(coursePath, moduleRef.dir, assessment.file)
        : Promise.reject(new Error('This module has no assessment.')),
    `quiz:${moduleId}:${assessment?.file ?? ''}`,
  );

  const quizId = quiz.status === 'ready' ? quiz.data.id : '';
  const priorAttempts = useAttempts(moduleId, quizId);

  // Attempt number = prior recorded attempts + 1, fixed when the page loads
  // so finishing a run does not remount the engine; Retry bumps it.
  const [attemptNumber, setAttemptNumber] = useState<number | null>(null);
  useEffect(() => {
    if (attemptNumber === null && quizId && priorAttempts !== undefined) {
      setAttemptNumber(priorAttempts.length + 1);
    }
  }, [attemptNumber, quizId, priorAttempts]);

  const [practiceMode, setPracticeMode] = useState(false);

  const lessonCtx: LessonContextValue = useMemo(
    () => ({
      moduleId,
      moduleBaseUrl: moduleBaseUrl(coursePath, moduleRef.dir),
      // FR-QUIZ-003: assessments record WITH passMarkInfo.
      recordAttempt: async (attempt) => {
        await recordAttempt(
          attempt,
          assessment ? { passMark: assessment.passMark, isAssessment: true } : undefined,
        );
        await requestPersistentStorage();
      },
      getItemState: (itemId) => getItemState(moduleId, itemId),
      setItemState: (itemId, state) => setItemState(moduleId, itemId, state),
      recordReview: (itemId, grade) => recordReview(moduleId, itemId, grade),
      seedReviewItem: (itemId) => seedReviewItem(moduleId, itemId),
      notifyEngagement: (event) => {
        void (async () => {
          const result = await recordEngagementEvent(event);
          if (result) celebrate({ message: describeEngagementEvent(event, result) });
        })();
      },
    }),
    [moduleId, coursePath, moduleRef.dir, assessment],
  );

  if (!assessment) return <MissingContent what={`An assessment for “${moduleId}”`} />;
  if (quiz.status === 'loading') return <Spinner label="Loading assessment…" />;
  if (quiz.status === 'error') {
    return <RetryCard what="this assessment" error={quiz.error} onRetry={quiz.retry} />;
  }

  return (
    <LessonContext.Provider value={lessonCtx}>
      <Breadcrumb
        crumbs={[
          { label: 'Catalogue', to: '/' },
          { label: SUBJECT_LABELS[course.subject] ?? subjectId },
          { label: course.title, to: `/course/${course.id}` },
          { label: mod.title, to: `/module/${moduleId}` },
          { label: 'Assessment' },
        ]}
      />
      <h1 className="text-2xl font-bold">{quiz.data.title}</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        Pass mark: {Math.round(assessment.passMark * 100)}%
      </p>

      <Card className="mt-4 flex items-center gap-3 py-3">
        <input
          id="practice-mode"
          type="checkbox"
          checked={practiceMode}
          onChange={(e) => setPracticeMode(e.target.checked)}
          className="h-4 w-4 accent-indigo-700"
        />
        <label htmlFor="practice-mode" className="text-sm">
          <span className="font-medium">Practice mode</span>: this attempt will{' '}
          <strong>not</strong> be recorded
        </label>
      </Card>

      <div className="mt-6">
        {attemptNumber === null ? (
          <Spinner label="Preparing attempt…" />
        ) : (
          <Suspense fallback={<Spinner label="Loading quiz engine…" />}>
            <LazyQuizEngine
              quiz={quiz.data}
              attemptNumber={attemptNumber}
              kind="assessment"
              practiceMode={practiceMode}
              onRetry={() => setAttemptNumber((n) => (n ?? 1) + 1)}
              renderMarkdown={renderQuizMarkdown}
            />
          </Suspense>
        )}
      </div>
    </LessonContext.Provider>
  );
}

export default function AssessmentPage() {
  const { moduleId = '' } = useParams();
  const loc = useAsyncData(() => findModule(moduleId), `module:${moduleId}`);

  if (loc.status === 'loading') return <Spinner label="Loading module…" />;
  if (loc.status === 'error') {
    return <RetryCard what="this module" error={loc.error} onRetry={loc.retry} />;
  }
  if (loc.data === null) return <MissingContent what={`Module “${moduleId}”`} />;
  return <AssessmentBody loc={loc.data} />;
}
