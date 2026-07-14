import type { MasteryEvidence } from '../mastery';

import type { ScaffoldLevel, ScaffoldingRecommendation } from './types';

export const RECOMMENDATION_DELAYED_EVALUATION_MS = 7 * 24 * 60 * 60 * 1_000;

export interface ScaffoldingExposure {
  skillId: string;
  level: ScaffoldLevel;
  shownAt: number;
}

export interface ScaffoldingEvaluation {
  skillId: string;
  status: 'awaiting-delayed-evidence' | 'retain' | 'rollback-to-fuller';
  reason: string;
}

/**
 * Evaluation is explicitly delayed: in-session completion is never used as a
 * success metric. A faded choice rolls back only after delayed, independent
 * evidence is repeatedly unsuccessful or absent after a fair observation window.
 */
export function evaluateDelayedScaffolding(
  exposure: ScaffoldingExposure,
  evidence: readonly MasteryEvidence[],
  now: number,
): ScaffoldingEvaluation {
  if (now - exposure.shownAt < RECOMMENDATION_DELAYED_EVALUATION_MS) {
    return { skillId: exposure.skillId, status: 'awaiting-delayed-evidence', reason: 'Wait for delayed performance before judging this recommendation.' };
  }
  const delayed = evidence.filter((item) => item.skillId === exposure.skillId && item.occurredAt >= exposure.shownAt + RECOMMENDATION_DELAYED_EVALUATION_MS);
  const independentSuccesses = delayed.filter((item) => item.outcome === 'success' && item.support === 'independent').length;
  if (exposure.level === 'faded' && (delayed.length < 2 || independentSuccesses === 0)) {
    return { skillId: exposure.skillId, status: 'rollback-to-fuller', reason: 'Delayed independent performance is not yet strong enough for faded support; return to fuller guidance.' };
  }
  return { skillId: exposure.skillId, status: 'retain', reason: 'Delayed evidence does not trigger a scaffolding rollback.' };
}

export function rollbackRecommendation(evaluation: ScaffoldingEvaluation, current: ScaffoldingRecommendation): ScaffoldingRecommendation {
  return evaluation.status === 'rollback-to-fuller'
    ? { ...current, level: 'fuller', reason: evaluation.reason }
    : current;
}
