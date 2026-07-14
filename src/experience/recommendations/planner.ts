import type { SkillMasterySummary } from '../mastery';

import type {
  LocalRecommendationInput,
  LocalRecommendationPlan,
  RecommendationAction,
  ScaffoldingRecommendation,
} from './types';

function newestInProgress(input: LocalRecommendationInput) {
  return [...input.moduleStates]
    .filter((state) => state.status === 'in-progress')
    .sort((left, right) => right.updatedAt - left.updatedAt || left.moduleId.localeCompare(right.moduleId))[0];
}

/** Conservative support rule: confidence and independent evidence beat completion counts. */
export function chooseScaffolding(summary: SkillMasterySummary): ScaffoldingRecommendation {
  const evidence = summary.evidence;
  if (evidence.confidentWrong > 0) {
    return { skillId: summary.skillId, level: 'fuller', reason: 'A confident unsuccessful response is recorded; begin with fuller support and a fresh check.' };
  }
  if (evidence.opportunities < 2) {
    return { skillId: summary.skillId, level: 'fuller', reason: 'Fewer than two evidence opportunities are recorded; keep the worked support fuller.' };
  }
  if (evidence.independentSuccesses >= 3 && summary.band === 'secure') {
    return { skillId: summary.skillId, level: 'faded', reason: 'Three or more independent successes support trying a more faded next step.' };
  }
  return { skillId: summary.skillId, level: 'standard', reason: 'Evidence is mixed or supported, so keep the standard level of guidance.' };
}

function planId(input: LocalRecommendationInput, scaffolding: readonly ScaffoldingRecommendation[]): string {
  const state = [...input.moduleStates]
    .sort((left, right) => left.moduleId.localeCompare(right.moduleId))
    .map((item) => `${item.moduleId}:${item.status}:${item.updatedAt}`)
    .join('|');
  return [state, input.dueReviewCount, input.firstCourseId ?? '', ...scaffolding.map((item) => `${item.skillId}:${item.level}`)].join('#');
}

/**
 * Pure, local, inspectable next-step selection. It ranks no learner and never
 * removes browsing; callers may display all available actions in this order.
 */
export function buildLocalRecommendationPlan(input: LocalRecommendationInput): LocalRecommendationPlan {
  const scaffolding = (input.mastery?.summaries ?? [])
    .map(chooseScaffolding)
    .sort((left, right) => left.skillId.localeCompare(right.skillId));
  const active = newestInProgress(input);
  const attention = input.mastery?.summaries
    .filter((summary) => summary.evidence.confidentWrong > 0)
    .sort((left, right) => left.skillId.localeCompare(right.skillId))[0];
  const actions: RecommendationAction[] = [
    active
      ? { id: 'continue', title: 'Continue', href: `/module/${active.moduleId}`, available: true, reason: 'Most recently active local module.' }
      : { id: 'continue', title: 'Continue', href: '/', available: false, reason: 'No local module is in progress yet.' },
    { id: 'review', title: 'Quick Review', href: '/review', available: true, reason: input.dueReviewCount > 0
      ? `${input.dueReviewCount} practice item${input.dueReviewCount === 1 ? '' : 's'} ready on this device.${attention ? ` A confident miss is recorded for ${attention.skillId}; use review to check it again.` : ''}`
      : 'No practice items are due right now; you can still review.' },
    input.firstCourseId
      ? { id: 'next', title: 'Recommended Next', href: `/course/${input.firstCourseId}`, available: true, reason: active ? 'A course is ready after your current module.' : 'Start with the first available course.' }
      : { id: 'next', title: 'Recommended Next', href: '/', available: false, reason: 'No course is available in the local catalogue.' },
  ];
  return {
    id: planId(input, scaffolding), actions,
    scaffolding,
    browse: { allowed: true, href: '/', reason: 'Browsing is always available; these are suggestions, not a lockout.' },
  };
}
