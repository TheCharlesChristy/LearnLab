// Home "Today" panel (D-033; ADR-001 epic E1 "Continue, Quick Review,
// Recommended Next"). The catalogue alone made every visit start with a
// choice; this puts the next valuable action first:
//
//   - Review, when items are due — spaced retrieval is where durable
//     learning happens, and it's the easiest thing to skip when it's buried
//     behind a nav badge.
//   - Continue the lesson in progress, or Next up after a completed one.
//   - The streak, only while it's intact. Highlighting an intact streak
//     raises re-engagement; highlighting a broken one lowers it (Silverman &
//     Barasch 2023), so a broken streak is simply not shown.
//
// Deliberately light: it reads progress hooks and the cached content index
// only, so the catalogue's entry chunk stays free of markdown/quiz code.

import { ArrowRight, BrainCircuit, Flame, PlayCircle } from 'lucide-react';
import { Link } from 'react-router';

import { useEngagement, useLastLessonActivity, useReviewForecast } from '../progress';
import type { LessonProgress } from '../progress';
import { Card } from '../ui';

import { findModule, loadModule } from './content-api';
import { useAsyncData } from './useAsyncData';
import { reviewMinutes, whenDue } from './when-due';

interface NextStep {
  label: 'Continue' | 'Next up';
  title: string;
  subtitle: string;
  href: string;
}

/** Resolve the most recent lesson activity into a Continue / Next up link. */
export async function resolveNextStep(lp: LessonProgress): Promise<NextStep | null> {
  const loc = await findModule(lp.moduleId);
  if (!loc) return null;
  const { module: mod, course, coursePath } = loc;
  const i = mod.lessons.findIndex((l) => l.id === lp.lessonId);
  if (i < 0) return null;
  const lessonHref = (id: string) => `/module/${mod.id}/lesson/${id}`;

  if (lp.status !== 'completed') {
    return { label: 'Continue', title: mod.lessons[i]!.title, subtitle: mod.title, href: lessonHref(lp.lessonId) };
  }
  const nextLesson = mod.lessons[i + 1];
  if (nextLesson) {
    return { label: 'Next up', title: nextLesson.title, subtitle: mod.title, href: lessonHref(nextLesson.id) };
  }
  if (mod.assessment) {
    return {
      label: 'Next up',
      title: `${mod.title}: check yourself`,
      subtitle: 'Module assessment',
      href: `/module/${mod.id}/assessment`,
    };
  }
  const m = course.modules.findIndex((r) => r.id === mod.id);
  const nextRef = course.modules[m + 1];
  if (!nextRef) return null;
  const nextMod = await loadModule(coursePath, nextRef.dir);
  return { label: 'Next up', title: nextMod.title, subtitle: course.title, href: `/module/${nextMod.id}` };
}

/** Local YYYY-MM-DD, matching how the engagement layer keys streak days. */
function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isStreakIntact(lastActiveDateKey: string, now = new Date()): boolean {
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  return lastActiveDateKey === localDateKey(now) || lastActiveDateKey === localDateKey(yesterday);
}

function NextStepCard({ lp }: { lp: LessonProgress }) {
  const next = useAsyncData(() => resolveNextStep(lp), `next:${lp.moduleId}:${lp.lessonId}:${lp.status}`);
  if (next.status !== 'ready' || !next.data) return null;
  const step = next.data;
  return (
    <Link
      to={step.href}
      className="group flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 hover:border-indigo-400 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:border-slate-700 dark:bg-surface-dark-muted"
    >
      <PlayCircle aria-hidden className="h-8 w-8 shrink-0 text-indigo-600 dark:text-indigo-300" />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {step.label}
        </span>
        <span className="block truncate font-semibold">{step.title}</span>
        <span className="block truncate text-sm text-slate-600 dark:text-slate-300">{step.subtitle}</span>
      </span>
      <ArrowRight aria-hidden className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-indigo-600" />
    </Link>
  );
}

export function TodayPanel() {
  const last = useLastLessonActivity();
  const forecast = useReviewForecast();
  const engagement = useEngagement();

  if (last === undefined || forecast === undefined) return null;

  const isNewLearner = last === null && forecast.total === 0;
  if (isNewLearner) {
    return (
      <section aria-label="Getting started" className="mb-8">
        <Card>
          <h2 className="text-lg font-semibold">Welcome to LearnLab</h2>
          <p className="mt-1 text-slate-700 dark:text-slate-300">
            Pick any course below. Lessons are short and hands-on: you&rsquo;ll predict, try and
            explain before you&rsquo;re told. Everything you answer comes back later for a quick
            review, timed for just before you&rsquo;d forget it.
          </p>
        </Card>
      </section>
    );
  }

  const streak =
    engagement && engagement.currentStreak > 0 && isStreakIntact(engagement.lastActiveDateKey)
      ? engagement
      : null;
  const doneToday = streak?.lastActiveDateKey === localDateKey(new Date());

  return (
    <section aria-labelledby="today-heading" className="mb-8">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="today-heading" className="text-xl font-bold">
          Today
        </h2>
        {streak && (
          <p className="flex items-center gap-1 text-sm text-slate-700 dark:text-slate-300">
            <Flame aria-hidden className="h-4 w-4 text-orange-500" />
            {streak.currentStreak}-day streak
            {doneToday ? ' — today counts ✓' : ' — keep it going today'}
          </p>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {forecast.dueNow > 0 ? (
          <Link
            to="/review?start=1"
            className="group flex min-w-0 items-center gap-3 rounded-lg border border-indigo-300 bg-indigo-50 p-4 hover:border-indigo-500 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:border-indigo-700 dark:bg-indigo-950/40"
          >
            <BrainCircuit aria-hidden className="h-8 w-8 shrink-0 text-indigo-700 dark:text-indigo-300" />
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold uppercase tracking-wide text-indigo-800 dark:text-indigo-300">
                Review
              </span>
              <span className="block font-semibold">
                {forecast.dueNow} {forecast.dueNow === 1 ? 'item' : 'items'} ready · ~
                {reviewMinutes(Math.min(forecast.dueNow, 12))} min
              </span>
              <span className="block text-sm text-slate-700 dark:text-slate-300">
                Recall them now, while it still takes effort.
              </span>
            </span>
            <ArrowRight aria-hidden className="h-5 w-5 shrink-0 text-indigo-500" />
          </Link>
        ) : forecast.total > 0 ? (
          <div className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
            <BrainCircuit aria-hidden className="h-8 w-8 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>
              <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Review
              </span>
              <span className="block font-semibold">All caught up</span>
              {forecast.nextDueAt !== null && (
                <span className="block text-sm text-slate-600 dark:text-slate-300">
                  Next items due {whenDue(forecast.nextDueAt)}
                </span>
              )}
            </span>
          </div>
        ) : null}
        {last && <NextStepCard lp={last} />}
      </div>
    </section>
  );
}

