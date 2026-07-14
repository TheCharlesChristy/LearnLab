import type { LegacyEvidenceRecord, LegacyQuizAttempt, LegacyReviewState } from './types';

/**
 * v1 quiz attempts store only a whole-item score and no declared skill link,
 * opportunity, support, confidence, latency, transfer, or content version.
 * They remain visible to migration callers but cannot be promoted to mastery.
 */
export function classifyLegacyQuizAttempt(attempt: LegacyQuizAttempt): LegacyEvidenceRecord {
  return {
    kind: 'legacy', source: 'quiz-attempt', id: `${attempt.moduleId}:${attempt.itemId}:${attempt.startedAt}`,
    occurredAt: attempt.finishedAt,
    reason: 'Legacy quiz attempts have no explicit skill mapping or per-opportunity evidence.',
  };
}

/** Review-state is scheduling state, not a versioned assessment event. */
export function classifyLegacyReviewState(review: LegacyReviewState): LegacyEvidenceRecord {
  return {
    kind: 'legacy', source: 'review-state', id: `${review.moduleId}:${review.itemId}:${review.lastReviewedAt}`,
    occurredAt: review.lastReviewedAt,
    reason: 'Legacy review state has no content version, declared skill mapping, or complete evidence context.',
  };
}
