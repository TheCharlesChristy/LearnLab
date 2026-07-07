// Module page (FR-SHELL-003): description, objectives, advisory prerequisite
// chips (FR-CONT-008 — never blocks), lesson list with completion, assessment
// entry with best score.

import { CheckCircle2, Circle } from 'lucide-react';
import { Link, useParams } from 'react-router';

import {
  useLessonProgressList,
  useModuleState,
  useOverallProgress,
} from '../../progress';
import { Badge, Card, Spinner } from '../../ui';
import { findModule } from '../content-api';
import { Breadcrumb, MissingContent, RetryCard, SUBJECT_LABELS } from '../shared';
import { useAsyncData } from '../useAsyncData';

function PrereqChip({ moduleId, done }: { moduleId: string; done: boolean }) {
  return (
    <Link
      to={`/module/${moduleId}`}
      className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:border-slate-600 dark:hover:bg-slate-700"
    >
      {done ? (
        <CheckCircle2 aria-hidden className="h-4 w-4 text-green-700 dark:text-green-400" />
      ) : (
        <Circle aria-hidden className="h-4 w-4 text-slate-400" />
      )}
      {moduleId}
      <span className="sr-only">{done ? '(done)' : '(not done)'}</span>
    </Link>
  );
}

export default function ModulePage() {
  const { moduleId = '' } = useParams();
  const loc = useAsyncData(() => findModule(moduleId), `module:${moduleId}`);
  const moduleState = useModuleState(moduleId);
  const lessonProgress = useLessonProgressList(moduleId);
  const allModuleStates = useOverallProgress();

  if (loc.status === 'loading') return <Spinner label="Loading module…" />;
  if (loc.status === 'error') {
    return <RetryCard what="this module" error={loc.error} onRetry={loc.retry} />;
  }
  if (loc.data === null) return <MissingContent what={`Module “${moduleId}”`} />;

  const { course, module: mod, subjectId } = loc.data;
  const doneLessons = new Set(
    (lessonProgress ?? []).filter((lp) => lp.status === 'completed').map((lp) => lp.lessonId),
  );
  const completedModules = new Set(
    (allModuleStates ?? []).filter((m) => m.status === 'completed').map((m) => m.moduleId),
  );
  const unmet = mod.prerequisites.filter((p) => !completedModules.has(p));
  const best = moduleState?.assessmentBest;

  return (
    <div>
      <Breadcrumb
        crumbs={[
          { label: 'Catalogue', to: '/' },
          { label: SUBJECT_LABELS[course.subject] ?? subjectId },
          { label: course.title, to: `/course/${course.id}` },
          { label: mod.title },
        ]}
      />
      <h1 className="text-2xl font-bold">{mod.title}</h1>
      <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">{mod.description}</p>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">~{mod.estMinutes} min</p>

      {mod.prerequisites.length > 0 && (
        <section className="mt-5" aria-label="Prerequisites">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            Prerequisites
          </h2>
          <div className="flex flex-wrap gap-2">
            {mod.prerequisites.map((p) => (
              <PrereqChip key={p} moduleId={p} done={completedModules.has(p)} />
            ))}
          </div>
          {unmet.length > 0 && (
            <p
              role="note"
              className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
            >
              Recommended first: {unmet.join(', ')}. You can still continue — prerequisites never
              block access.
            </p>
          )}
        </section>
      )}

      <section className="mt-5" aria-label="Objectives">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
          You will learn to
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {mod.objectives.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
      </section>

      <section className="mt-6" aria-label="Lessons">
        <h2 className="mb-3 text-lg font-semibold">Lessons</h2>
        <ol className="space-y-2">
          {mod.lessons.map((lesson, i) => {
            const done = doneLessons.has(lesson.id);
            return (
              <li key={lesson.id}>
                <Card className="flex items-center gap-3 py-3">
                  {done ? (
                    <CheckCircle2
                      aria-hidden
                      className="h-5 w-5 shrink-0 text-green-700 dark:text-green-400"
                    />
                  ) : (
                    <Circle aria-hidden className="h-5 w-5 shrink-0 text-slate-400" />
                  )}
                  <div className="flex-1">
                    <Link
                      to={`/module/${mod.id}/lesson/${lesson.id}`}
                      className="rounded font-medium underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-indigo-600"
                    >
                      {i + 1}. {lesson.title}
                    </Link>
                    <span className="ml-2 text-xs text-slate-600 dark:text-slate-300">
                      ~{lesson.estMinutes} min
                    </span>
                  </div>
                  {done && <span className="sr-only">Lesson complete</span>}
                </Card>
              </li>
            );
          })}
        </ol>
      </section>

      {mod.assessment && (
        <section className="mt-6" aria-label="Assessment">
          <h2 className="mb-3 text-lg font-semibold">End-of-module assessment</h2>
          <Card className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Pass mark: {Math.round(mod.assessment.passMark * 100)}%
              </p>
              <p className="mt-1 text-sm">
                {best
                  ? `Best score: ${best.score}/${best.maxScore}`
                  : 'Not attempted yet'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {moduleState?.status === 'completed' && <Badge tone="success">Module complete</Badge>}
              <Link
                to={`/module/${mod.id}/assessment`}
                className="rounded-md bg-indigo-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                Start assessment
              </Link>
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}
