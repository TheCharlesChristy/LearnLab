import { describe, expect, it } from 'vitest';

import type { MasteryAggregation, MasteryEvidence, SkillMasterySummary } from '../mastery';

import { buildLocalRecommendationPlan, chooseScaffolding } from './planner';
import { evaluateDelayedScaffolding, RECOMMENDATION_DELAYED_EVALUATION_MS, rollbackRecommendation } from './evaluation';

function summary(overrides: Partial<SkillMasterySummary> = {}): SkillMasterySummary {
  return {
    skillId: 'forces', status: 'classified', band: 'developing', reasons: [],
    evidence: {
      opportunities: 2, opportunitiesByKind: { retrieval: 0, application: 2, transfer: 0, unknown: 0 },
      opportunitiesBySupport: { independent: 2, hinted: 0, assisted: 0, unknown: 0 },
      successes: 2, partials: 0, failures: 0, independentSuccesses: 2, hintedSuccesses: 0,
      assistedSuccesses: 0, confidentWrong: 0, unknownContext: 0,
    },
    ...overrides,
  };
}

function evidence(overrides: Partial<MasteryEvidence> = {}): MasteryEvidence {
  return {
    schemaVersion: 1, id: 'delayed', occurredAt: RECOMMENDATION_DELAYED_EVALUATION_MS + 1,
    skillId: 'forces', source: 'experience-run', content: { packId: 'p', packVersion: '1.0.0' },
    opportunity: 'application', outcome: 'failure', support: 'independent', hintUse: 'none', hintCount: 0,
    confidence: 'sure', latency: 'expected', transfer: 'same-context', ...overrides,
  };
}

describe('transparent local recommendations (#61)', () => {
  it('selects deterministic Continue, Review, and Next actions without a browse lockout', () => {
    const input = {
      moduleStates: [{ moduleId: 'z', status: 'in-progress' as const, updatedAt: 2 }, { moduleId: 'a', status: 'in-progress' as const, updatedAt: 2 }],
      dueReviewCount: 2, firstCourseId: 'forces',
    };
    const plan = buildLocalRecommendationPlan(input);
    expect(plan).toEqual(buildLocalRecommendationPlan({ ...input, moduleStates: [...input.moduleStates].reverse() }));
    expect(plan.actions.filter((action) => action.available).map((action) => action.id)).toEqual(['continue', 'review', 'next']);
    expect(plan.actions[0]).toMatchObject({ href: '/module/a', reason: 'Most recently active local module.' });
    expect(plan.browse).toMatchObject({ allowed: true, href: '/' });
  });

  it('uses confident-wrong and weak evidence to choose fuller support, but fades only after strong independent evidence', () => {
    expect(chooseScaffolding(summary({ evidence: { ...summary().evidence, confidentWrong: 1 } }))).toMatchObject({ level: 'fuller', reason: expect.stringMatching(/confident unsuccessful/i) });
    expect(chooseScaffolding(summary({ status: 'insufficient-evidence', band: undefined, evidence: { ...summary().evidence, opportunities: 1 } }))).toMatchObject({ level: 'fuller' });
    expect(chooseScaffolding(summary({ band: 'secure', evidence: { ...summary().evidence, opportunities: 4, successes: 3, independentSuccesses: 3 } }))).toMatchObject({ level: 'faded' });
  });

  it('evaluates faded support only on delayed performance and rolls it back conservatively', () => {
    const exposure = { skillId: 'forces', level: 'faded' as const, shownAt: 0 };
    expect(evaluateDelayedScaffolding(exposure, [], RECOMMENDATION_DELAYED_EVALUATION_MS - 1).status).toBe('awaiting-delayed-evidence');
    const evaluation = evaluateDelayedScaffolding(exposure, [evidence()], RECOMMENDATION_DELAYED_EVALUATION_MS + 2);
    expect(evaluation.status).toBe('rollback-to-fuller');
    expect(rollbackRecommendation(evaluation, { skillId: 'forces', level: 'faded', reason: 'old' })).toMatchObject({ level: 'fuller' });
  });

  it('keeps a confident miss visible in the review reason rather than hiding it behind a score', () => {
    const mastery: MasteryAggregation = { summaries: [summary({ evidence: { ...summary().evidence, confidentWrong: 1 } })], ignoredEvidence: [] };
    expect(buildLocalRecommendationPlan({ moduleStates: [], dueReviewCount: 1, mastery }).actions.find((action) => action.id === 'review')?.reason).toMatch(/confident miss/i);
  });
});
