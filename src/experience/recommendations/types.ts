import type { MasteryAggregation } from '../mastery';

export type RecommendationKind = 'continue' | 'review' | 'next';
export type ScaffoldLevel = 'fuller' | 'standard' | 'faded';

/** The small progress shape needed by local next-step rules. */
export interface RecommendationModuleState {
  moduleId: string;
  status: 'not-started' | 'in-progress' | 'completed';
  updatedAt: number;
}

export interface LocalRecommendationInput {
  moduleStates: readonly RecommendationModuleState[];
  dueReviewCount: number;
  firstCourseId?: string;
  mastery?: MasteryAggregation;
}

export interface RecommendationAction {
  id: RecommendationKind;
  title: string;
  href: string;
  available: boolean;
  reason: string;
}

export interface ScaffoldingRecommendation {
  skillId: string;
  level: ScaffoldLevel;
  reason: string;
}

export interface LocalRecommendationPlan {
  /** Stable fingerprint of the input that produced this plan. */
  id: string;
  actions: readonly RecommendationAction[];
  scaffolding: readonly ScaffoldingRecommendation[];
  /** Browse is never conditional on evidence or a recommendation. */
  browse: { allowed: true; href: '/'; reason: string };
}

export interface RecommendationLogEntry {
  schemaVersion: 1;
  planId: string;
  occurredAt: number;
  actions: readonly Pick<RecommendationAction, 'id' | 'reason'>[];
  scaffolding: readonly ScaffoldingRecommendation[];
}
