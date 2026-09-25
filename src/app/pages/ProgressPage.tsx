// Progress page (FR-PROG-006): per-course completion bars + a flat table of
// in-progress modules with resume links. D-033 adds "Memory": what the
// learner is likely to still remember (FSRS predicted recall), what's due,
// and how well their confidence tracks their accuracy — completion says what
// was *covered*; memory says what was *kept*.

import { Link } from 'react-router';

import {
  CALIBRATION_MIN_SAMPLE,
  CONFIDENCE_LABELS,
  CONFIDENCE_LEVELS,
  accuracy,
  calibrationInsight,
  useCalibration,
  useOverallProgress,
  useReviewForecast,
} from '../../progress';
import { Card, ProgressBar, Spinner } from '../../ui';
import { findModule, loadContentIndex } from '../content-api';
import { EngagementSummary } from '../EngagementSummary';
import { RetryCard } from '../shared';
import { useAsyncData } from '../useAsyncData';

/** Module id → title, resolved through the cached content loaders (falls back to the id). */
function useModuleTitles(ids: string[]): Map<string, string> {
  const key = [...ids].sort().join(' ');
  const titles = useAsyncData(
    async () =>
      new Map(
        await Promise.all(
          ids.map(async (id) => [id, (await findModule(id))?.module.title ?? id] as const),
        ),
      ),
    `module-titles:${key}`,
  );
  return titles.status === 'ready' ? titles.data : new Map();
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-slate-600 dark:text-slate-300">{label}</p>
    </div>
  );
}

function MemorySection() {
  const forecast = useReviewForecast();
  const calibration = useCalibration();
  const titles = useModuleTitles(forecast?.byModule.map((m) => m.moduleId) ?? []);
  if (!forecast || forecast.total === 0) return null;
  const insight = calibration ? calibrationInsight(calibration) : null;

  return (
    <section className="mt-8" aria-labelledby="memory-heading">
      <h2 id="memory-heading" className="mb-3 text-lg font-semibold">
        Memory
      </h2>
      <Card className="flex flex-wrap items-center gap-6 py-4">
        <Stat label="items tracked" value={forecast.total} />
        <Stat label="predicted recall now" value={`${Math.round((forecast.recall ?? 0) * 100)}%`} />
        <Stat label="due now" value={forecast.dueNow} />
        <Stat label="due in the next 7 days" value={forecast.dueThisWeek} />
        {forecast.dueNow > 0 && (
          <Link
            to="/review?start=1"
            className="ml-auto rounded-md bg-indigo-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-800 dark:bg-indigo-500"
          >
            Review now
          </Link>
        )}
      </Card>

      <h3 className="mt-5 mb-2 font-semibold">By module, weakest first</h3>
      <ul className="space-y-3">
        {forecast.byModule.slice(0, 8).map((m) => {
          const pct = Math.round(m.recall * 100);
          const title = titles.get(m.moduleId) ?? m.moduleId;
          return (
            <li key={m.moduleId}>
              <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                <Link
                  to={`/module/${m.moduleId}`}
                  className="rounded font-medium underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-indigo-600"
                >
                  {title}
                </Link>
                <span className="text-slate-600 tabular-nums dark:text-slate-300">
                  {m.items} {m.items === 1 ? 'item' : 'items'}
                  {m.dueNow > 0 ? ` · ${m.dueNow} due` : ''}
                </span>
              </div>
              <ProgressBar value={pct} showPercent label={`${title}: predicted recall ${pct}%`} />
            </li>
          );
        })}
      </ul>

      {calibration && (
        <>
          <h3 className="mt-6 mb-2 font-semibold">Confidence vs. accuracy</h3>
          <p className="mb-2 text-sm text-slate-600 dark:text-slate-300">
            In review you lock each answer in as Guessing, Think so or Sure. Well-calibrated learners
            are right most of the time when sure — and know when they&rsquo;re guessing.
          </p>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-300 text-left dark:border-slate-600">
                <th scope="col" className="py-2 pr-4 font-semibold">When you said</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Answers</th>
                <th scope="col" className="py-2 font-semibold">Right</th>
              </tr>
            </thead>
            <tbody>
              {[...CONFIDENCE_LEVELS].reverse().map((c) => {
                const bucket = calibration[c];
                const acc = accuracy(bucket);
                return (
                  <tr key={c} className="border-b border-slate-200 dark:border-slate-700">
                    <td className="py-2 pr-4">{CONFIDENCE_LABELS[c]}</td>
                    <td className="py-2 pr-4 tabular-nums">{bucket.answered}</td>
                    <td className="py-2 tabular-nums">
                      {acc === null
                        ? `need ${CALIBRATION_MIN_SAMPLE - bucket.answered} more`
                        : `${Math.round(acc * 100)}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {insight && <p className="mt-2 text-sm">{insight}</p>}
        </>
      )}
    </section>
  );
}

export default function ProgressPage() {
  const index = useAsyncData(loadContentIndex, 'content-index');
  const moduleStates = useOverallProgress();
  const moduleTitles = useModuleTitles(
    (moduleStates ?? []).filter((m) => m.status === 'in-progress').map((m) => m.moduleId),
  );

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
  const courseTitles = new Map(courses.map((c) => [c.id, c.title]));

  return (
    <div>
      <h1 className="text-2xl font-bold">Your progress</h1>

      <EngagementSummary />

      <MemorySection />

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
                  <td className="py-2 pr-4">{moduleTitles.get(m.moduleId) ?? m.moduleId}</td>
                  <td className="py-2 pr-4">{courseTitles.get(m.courseId) ?? m.courseId}</td>
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
