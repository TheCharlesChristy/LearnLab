// Course page (#/course/:courseId, D-005 resolution): ordered module list
// with per-module status and estimated minutes.

import { Link, useParams } from 'react-router';

import { useOverallProgress } from '../../progress';
import { Badge, Card, Spinner } from '../../ui';
import { findCourse, loadCourse, loadModule } from '../content-api';
import type { Module } from '../content-api';
import { Breadcrumb, LEVEL_LABELS, MissingContent, RetryCard, SUBJECT_LABELS } from '../shared';
import { useAsyncData } from '../useAsyncData';

interface CourseData {
  subjectId: string;
  course: Awaited<ReturnType<typeof loadCourse>>;
  modules: Module[];
}

async function loadCourseData(courseId: string): Promise<CourseData | null> {
  const found = await findCourse(courseId);
  if (!found) return null;
  const course = await loadCourse(found.ref.path);
  const modules = await Promise.all(course.modules.map((m) => loadModule(found.ref.path, m.dir)));
  return { subjectId: found.subjectId, course, modules };
}

function statusBadge(status: 'not-started' | 'in-progress' | 'completed' | undefined) {
  if (status === 'completed') return <Badge tone="success">Completed</Badge>;
  if (status === 'in-progress') return <Badge tone="accent">In progress</Badge>;
  return <Badge>Not started</Badge>;
}

export default function CoursePage() {
  const { courseId = '' } = useParams();
  const data = useAsyncData(() => loadCourseData(courseId), `course:${courseId}`);
  const moduleStates = useOverallProgress();

  if (data.status === 'loading') return <Spinner label="Loading course…" />;
  if (data.status === 'error') {
    return <RetryCard what="this course" error={data.error} onRetry={data.retry} />;
  }
  if (data.data === null) return <MissingContent what={`Course “${courseId}”`} />;

  const { subjectId, course, modules } = data.data;
  const stateById = new Map((moduleStates ?? []).map((m) => [m.moduleId, m]));

  return (
    <div>
      <Breadcrumb
        crumbs={[
          { label: 'Catalogue', to: '/' },
          { label: SUBJECT_LABELS[course.subject] ?? subjectId },
          { label: course.title },
        ]}
      />
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">{course.description}</p>
        </div>
        <Badge tone="accent">{LEVEL_LABELS[course.level] ?? course.level}</Badge>
      </div>
      <h2 className="mb-3 text-lg font-semibold">Modules</h2>
      <ol className="space-y-3">
        {modules.map((mod, i) => {
          const state = stateById.get(mod.id);
          return (
            <li key={mod.id}>
              <Card className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-medium">
                    <Link
                      to={`/module/${mod.id}`}
                      className="rounded underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-indigo-600"
                    >
                      {i + 1}. {mod.title}
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    ~{mod.estMinutes} min
                    {state && state.lessonsTotal > 0
                      ? ` · ${state.lessonsDone}/${state.lessonsTotal} lessons done`
                      : ''}
                  </p>
                </div>
                {statusBadge(state?.status)}
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
