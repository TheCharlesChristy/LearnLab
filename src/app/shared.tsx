// Small shared pieces used across route pages.

import { lazy } from 'react';
import { Link } from 'react-router';

import type { ModuleMeta } from '../progress';
import { Button, Card } from '../ui';

import type { ModuleLocation, SubjectId } from './content-api';
import { describeError } from './useAsyncData';

/** Display labels for the fixed subjects (§4.1). */
export const SUBJECT_LABELS: Record<SubjectId, string> = {
  maths: 'Mathematics',
  physics: 'Physics',
  cs: 'Computer Science',
  ai: 'AI',
  signals: 'Signal Processing',
};

export const LEVEL_LABELS: Record<string, string> = {
  gcse: 'GCSE',
  as: 'AS',
  a2: 'A2',
  alevel: 'A-level',
  foundation: 'Foundation',
  postgrad: 'Postgrad',
};

/** Build the ModuleMeta the progress write API needs (FR-PROG-002). */
export function toModuleMeta(loc: ModuleLocation): ModuleMeta {
  return {
    courseId: loc.course.id,
    subject: loc.subjectId,
    lessonsTotal: loc.module.lessons.length,
    hasAssessment: Boolean(loc.module.assessment),
    lessonIds: loc.module.lessons.map((l) => l.id),
  };
}

/** Lazy markdown components — KaTeX stays out of the entry chunk (NFR-PERF-001). */
export const LazyMarkdownLesson = lazy(() =>
  import('../markdown').then((m) => ({ default: m.MarkdownLesson })),
);
export const LazyMarkdownInline = lazy(() =>
  import('../markdown').then((m) => ({ default: m.MarkdownInline })),
);
/** Lazy quiz engine. */
export const LazyQuizEngine = lazy(() =>
  import('../quiz').then((m) => ({ default: m.QuizEngine })),
);
/** Lazy screen-sequence engine (docs/BRILLIANT_REWRITE_PLAN.md). */
export const LazyScreenSequenceEngine = lazy(() =>
  import('../screens').then((m) => ({ default: m.ScreenSequenceEngine })),
);

/** Retry card for content fetch failures (FR-CONT-007). */
export function RetryCard({
  error,
  onRetry,
  what,
}: {
  error: unknown;
  onRetry: () => void;
  what: string;
}) {
  return (
    <Card role="alert" className="border-amber-300 dark:border-amber-700">
      <h2 className="font-semibold">Could not load {what}</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{describeError(error)}</p>
      <Button variant="secondary" className="mt-3" onClick={onRetry}>
        Retry
      </Button>
    </Card>
  );
}

/** Friendly not-found body used by pages when an id does not resolve. */
export function MissingContent({ what }: { what: string }) {
  return (
    <Card role="alert">
      <h2 className="font-semibold">Not found</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        {what} does not exist in the current content build.
      </p>
      <p className="mt-3 text-sm">
        <Link className="font-medium text-indigo-700 underline dark:text-indigo-300" to="/">
          Back to the catalogue
        </Link>
      </p>
    </Card>
  );
}

export interface Crumb {
  label: string;
  to?: string;
}

/** Breadcrumb on content routes (FR-SHELL-007). */
export function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm">
      <ol className="flex flex-wrap items-center gap-1 text-slate-600 dark:text-slate-300">
        {crumbs.map((c, i) => (
          <li key={`${c.label}-${i}`} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden>/</span>}
            {c.to ? (
              <Link
                to={c.to}
                className="rounded underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-indigo-600"
              >
                {c.label}
              </Link>
            ) : (
              <span aria-current={i === crumbs.length - 1 ? 'page' : undefined}>{c.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
