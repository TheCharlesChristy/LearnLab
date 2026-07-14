import { useEffect } from 'react';
import { Link } from 'react-router';
import type { ModuleState } from '../progress';
import { buildLocalRecommendationPlan, logLocalRecommendationPlan } from '../experience/recommendations';

export function HomeActions({ states, firstCourseId, dueReviewCount = 0 }: { states: readonly ModuleState[]; firstCourseId?: string; dueReviewCount?: number }) {
  const plan = buildLocalRecommendationPlan({ moduleStates: states, firstCourseId, dueReviewCount });
  const actions = plan.actions.filter((action) => action.available).map((action) => ({ ...action, id: action.id === 'next' ? 'recommended' : action.id }));
  useEffect(() => logLocalRecommendationPlan(plan), [plan]);
  return <section aria-labelledby="home-actions-heading" className="mb-8 rounded-2xl bg-slate-100 p-4 dark:bg-slate-800"><h1 id="home-actions-heading" className="text-2xl font-bold">Your next step</h1><div className="mt-4 grid gap-3 sm:grid-cols-3">{actions.map((action) => <Link key={action.id} to={action.href} className="min-h-11 rounded-lg border border-slate-300 bg-white p-4 font-semibold focus-visible:outline-2 focus-visible:outline-indigo-600 dark:border-slate-600 dark:bg-slate-900"><span className="block">{action.title}</span><span className="mt-1 block text-sm font-normal">{action.reason}</span></Link>)}</div><Link to="/search" className="mt-4 inline-block underline">Browse all courses</Link></section>;
}
