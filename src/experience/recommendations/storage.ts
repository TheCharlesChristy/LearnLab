import type { LocalRecommendationPlan, RecommendationLogEntry } from './types';

export const RECOMMENDATION_LOG_STORAGE_KEY = 'learnlab:recommendation-log:v1';
export const RECOMMENDATION_LOG_MAX_ENTRIES = 100;

export function loadRecommendationLog(): RecommendationLogEntry[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(RECOMMENDATION_LOG_STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((entry): entry is RecommendationLogEntry =>
      typeof entry === 'object' && entry !== null && (entry as RecommendationLogEntry).schemaVersion === 1,
    ) : [];
  } catch { return []; }
}

/** Stores the human-readable decision locally, once per deterministic plan id. */
export function logLocalRecommendationPlan(plan: LocalRecommendationPlan, occurredAt = Date.now()): void {
  try {
    const existing = loadRecommendationLog();
    if (existing.some((entry) => entry.planId === plan.id)) return;
    const entry: RecommendationLogEntry = {
      schemaVersion: 1, planId: plan.id, occurredAt,
      actions: plan.actions.map(({ id, reason }) => ({ id, reason })), scaffolding: plan.scaffolding,
    };
    window.localStorage.setItem(RECOMMENDATION_LOG_STORAGE_KEY, JSON.stringify([...existing, entry].slice(-RECOMMENDATION_LOG_MAX_ENTRIES)));
  } catch { /* Storage restrictions never remove recommendations. */ }
}
