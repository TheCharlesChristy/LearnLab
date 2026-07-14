// Catalogue (#/): renders from content/index.json alone (FR-CONT-001),
// grouped by subject with per-course stats + percent complete (FR-SHELL-002).

import { Link } from 'react-router';

import { useDueReviewCount, useOverallProgress } from '../../progress';
import type { ModuleState } from '../../progress';
import { Badge, Card, ProgressBar, Spinner } from '../../ui';
import { loadContentIndex } from '../content-api';
import type { CourseRef } from '../content-api';
import { LEVEL_LABELS, RetryCard } from '../shared';
import { useAsyncData } from '../useAsyncData';
import { HomeActions } from '../HomeActions';

function coursePercent(course: CourseRef, moduleStates: ModuleState[] | undefined): number {
  if (!moduleStates || course.moduleCount === 0) return 0;
  const completed = moduleStates.filter(
    (m) => m.courseId === course.id && m.status === 'completed',
  ).length;
  return Math.round((completed / course.moduleCount) * 100);
}

function CourseCard({ course, percent }: { course: CourseRef; percent: number }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold">
          <Link
            to={`/course/${course.id}`}
            className="rounded underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-indigo-600"
          >
            {course.title}
          </Link>
        </h3>
        <Badge tone="accent">{LEVEL_LABELS[course.level] ?? course.level}</Badge>
      </div>
      {/* §4.2 CourseRef carries no description; the index alone drives this
          page (FR-CONT-001) — the description lives on the course page. */}
      <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
        {course.moduleCount} {course.moduleCount === 1 ? 'module' : 'modules'} · ~
        {course.totalEstMinutes} min
      </p>
      <ProgressBar
        className="mt-3"
        value={percent}
        showPercent
        label={`${course.title}: ${percent}% complete`}
      />
    </Card>
  );
}

export default function CataloguePage() {
  const index = useAsyncData(loadContentIndex, 'content-index');
  const moduleStates = useOverallProgress();
  const dueReviewCount = useDueReviewCount();
  const fallback = <HomeActions states={moduleStates ?? []} dueReviewCount={dueReviewCount ?? 0} />;

  if (index.status === 'loading') return <div>{fallback}<Spinner label="Loading catalogue…" /></div>;
  if (index.status === 'error') {
    return <div>{fallback}<RetryCard what="the course catalogue" error={index.error} onRetry={index.retry} /></div>;
  }

  const subjects = index.data.subjects.filter((s) => s.courses.length > 0);

  if (subjects.length === 0) {
    return (
      <div><HomeActions states={moduleStates ?? []} dueReviewCount={dueReviewCount ?? 0} /><section className="mx-auto max-w-xl py-16 text-center">
        <h1 className="text-2xl font-bold">No courses yet</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          The first courses are on their way. Once content lands in this build, the catalogue will
          appear here — no update needed on your side beyond a refresh.
        </p>
      </section></div>
    );
  }

  return (
    <div>
      <HomeActions states={moduleStates ?? []} firstCourseId={subjects[0]?.courses[0]?.id} dueReviewCount={dueReviewCount ?? 0} />
      <h1 className="sr-only">Course catalogue</h1>
      {subjects.map((subject) => (
        <section key={subject.id} aria-labelledby={`subject-${subject.id}`} className="mb-8">
          <h2 id={`subject-${subject.id}`} className="mb-3 text-xl font-bold">
            {subject.title}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {subject.courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                percent={coursePercent(course, moduleStates)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
