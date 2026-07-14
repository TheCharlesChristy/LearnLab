export { buildLocalRecommendationPlan, chooseScaffolding } from './planner';
export { evaluateDelayedScaffolding, RECOMMENDATION_DELAYED_EVALUATION_MS, rollbackRecommendation } from './evaluation';
export type { ScaffoldingEvaluation, ScaffoldingExposure } from './evaluation';
export { loadRecommendationLog, logLocalRecommendationPlan, RECOMMENDATION_LOG_MAX_ENTRIES, RECOMMENDATION_LOG_STORAGE_KEY } from './storage';
export type { LocalRecommendationInput, LocalRecommendationPlan, RecommendationAction, RecommendationKind, RecommendationLogEntry, RecommendationModuleState, ScaffoldLevel, ScaffoldingRecommendation } from './types';
