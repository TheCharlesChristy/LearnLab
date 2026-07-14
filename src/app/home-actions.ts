import type { ModuleState } from '../progress';
import { buildLocalRecommendationPlan } from '../experience/recommendations';

export interface HomeAction { id: 'continue' | 'review' | 'recommended'; href: string; title: string; reason: string }
/** Transparent local-only home choices; browse is always separate and never blocked. */
export function chooseHomeActions(moduleStates: readonly ModuleState[], firstCourseId?: string, dueReviewCount = 0): HomeAction[] {
  return buildLocalRecommendationPlan({ moduleStates, firstCourseId, dueReviewCount }).actions
    .filter((action) => action.available)
    .map((action) => ({
      id: action.id === 'next' ? 'recommended' : action.id,
      href: action.href, title: action.title, reason: action.reason,
    }));
}
