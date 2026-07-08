// Progress page (FR-PROG-006): per-course completion bars + a flat table of
// in-progress modules with resume links.

import { Link } from 'react-router';

import { useOverallProgress } from '../../progress';
import { Card, ProgressBar, Spinner } from '../../ui';
import { loadContentIndex } from '../content-api';
import { EngagementSummary } from '../EngagementSummary';
import { RetryCard } from '../shared';
import { useAsyncData } from '../useAsyncData';

export default function ProgressPage() {
  const index = useAsyncData(loadContentIndex, 'content-index');
  const moduleStates = useOverallProgress();

  if (index.status === 'loading' || moduleStates === undefined) {
    return <Spinner label="Loading progress…" />;
  }
  if (index.status === 'error') {
    return <RetryCard what="your progress overview" error={index.error} onRetry={index.retry} />;
  }

  const courses = index.data.subjects.flatMap((s) => s.courses);
  const inProgress = moduleStates
    .filter((m) => m.status === 'in-progress')
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div>
      <h1 className="text-2xl font-bold">Your progress</h1>

      <EngagementSummary />

      <section className="mt-5" aria-label="Course completion">
        <h2 className="mb-3 text-lg font-semibold">Courses</h2>
        {courses.length === 0 ? (
          <p className="text-slate-600 dark:text-slate-300">
            No courses in this content build yet.
          </p>
        ) : (
          <div className="space-y-3">
            {courses.map((course) => {
              const completed = moduleStates.filter(
                (m) => m.courseId === course.id && m.status === 'completed',
              ).length;
              const percent =
                course.moduleCount > 0 ? (completed / course.moduleCount) * 100 : 0;
              return (
                <Card key={course.id}>
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <Link
                      to={`/course/${course.id}`}
                      className="rounded font-medium underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-indigo-600"
                    >
                      {course.title}
                    </Link>
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                      {completed}/{course.moduleCount} modules
                    </span>
                  </div>
                  <ProgressBar
                    value={percent}
                    showPercent
                    label={`${course.title}: ${Math.round(percent)}% complete`}
                  />
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-8" aria-label="Modules in progress">
        <h2 className="mb-3 text-lg font-semibold">In progress</h2>
        {inProgress.length === 0 ? (
          <p className="text-slate-600 dark:text-slate-300">Nothing in progress right now.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-300 text-left dark:border-slate-600">
                <th scope="col" className="py-2 pr-4 font-semibold">
                  Module
                </th>
                <th scope="col" className="py-2 pr-4 font-semibold">
                  Course
                </th>
                <th scope="col" className="py-2 pr-4 font-semibold">
                  Lessons
                </th>
                <th scope="col" className="py-2 font-semibold">
                  <span className="sr-only">Resume</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {inProgress.map((m) => (
                <tr
                  key={m.moduleId}
                  className="border-b border-slate-200 dark:border-slate-700"
                >
                  <td className="py-2 pr-4">{m.moduleId}</td>
                  <td className="py-2 pr-4">{m.courseId}</td>
                  <td className="py-2 pr-4 tabular-nums">
                    {m.lessonsDone}/{m.lessonsTotal}
                  </td>
                  <td className="py-2">
                    <Link
                      to={`/module/${m.moduleId}`}
                      className="rounded font-medium text-indigo-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-indigo-600 dark:text-indigo-300"
                    >
                      Resume
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
