import { describe, expect, it } from 'vitest';

import type { Skill } from '../types';
import { createRunEvent, projectRunStart } from '../run-state';
import type { StartExperienceRunInput } from '../run-state';
import type { RunBoundaryEvent } from '../run-state/types';
import {
  aggregateMastery,
  buildSkillGraph,
  classifyLegacyQuizAttempt,
  classifyLegacyReviewState,
  normaliseExperienceEvidence,
  validateSkillGraph,
  type MasteryEvidence,
} from '.';

const SKILLS: Skill[] = [
  { id: 'vectors', title: 'Vectors', description: 'Resolve a vector.', prerequisiteIds: [] },
  { id: 'forces', title: 'Forces', description: 'Balance forces.', prerequisiteIds: ['vectors'] },
];

const START: StartExperienceRunInput = {
  runId: 'run-1', eventId: 'start-1', packId: 'forces-pack', experienceId: 'bridge',
  packVersion: '2.1.0', experienceVersion: '2.1.0', stateVersion: '1.0.0', entryNodeId: 'scene-1',
  occurredAt: 1_000,
};

function evidence(overrides: Partial<MasteryEvidence> = {}): MasteryEvidence {
  return {
    schemaVersion: 1, id: 'e-1', occurredAt: 1_000, skillId: 'forces', source: 'experience-run',
    content: { packId: 'forces-pack', packVersion: '2.1.0' }, opportunity: 'application',
    outcome: 'success', support: 'independent', hintUse: 'none', hintCount: 0,
    confidence: 'sure', latency: 'expected', transfer: 'same-context', ...overrides,
  };
}

describe('skill graph', () => {
  it('validates authored prerequisite references and cycles, then builds stable indexes', () => {
    expect(validateSkillGraph([
      ...SKILLS,
      { id: 'bad', title: 'Bad', description: 'Bad.', prerequisiteIds: ['missing', 'bad'] },
      { id: 'loop-a', title: 'A', description: 'A.', prerequisiteIds: ['loop-b'] },
      { id: 'loop-b', title: 'B', description: 'B.', prerequisiteIds: ['loop-a'] },
    ]).map((item) => item.code)).toEqual([
      'self-prerequisite', 'unknown-prerequisite', 'cyclic-prerequisites',
    ]);

    expect(buildSkillGraph(SKILLS)).toEqual({
      skillIds: ['forces', 'vectors'],
      prerequisiteIdsBySkill: { forces: ['vectors'], vectors: [] },
      dependentIdsBySkill: { forces: [], vectors: ['forces'] },
    });
  });
});

describe('normalised evidence', () => {
  it('preserves supported work and confidently-wrong states without inventing omitted context', () => {
    const start = createRunEvent(START, projectRunStart(START));
    const boundary: RunBoundaryEvent = {
      runId: 'run-1', schemaVersion: 1, sequence: 1, eventId: 'boundary-1', occurredAt: 2_000,
      kind: 'boundary-applied', nodeId: 'scene-1',
      telemetry: { hintsUsed: 2, responseTimeMs: 4_000 },
      effects: [
        { operator: 'emit-evidence', skillId: 'forces', outcome: 'failure', independence: 'hinted', confidence: 'sure' },
      ],
    };
    expect(normaliseExperienceEvidence([start, boundary])).toEqual([
      expect.objectContaining({
        id: 'run-1:boundary-1:0', occurredAt: 2_000, skillId: 'forces', outcome: 'failure',
        support: 'hinted', hintUse: 'used', hintCount: 2, confidence: 'sure',
        opportunity: 'unknown', transfer: 'unknown', latency: 'unknown',
        content: { packId: 'forces-pack', packVersion: '2.1.0', experienceId: 'bridge', experienceVersion: '2.1.0' },
      }),
    ]);
  });

  it('does not turn a boundary without its run-start version into evidence', () => {
    const boundary: RunBoundaryEvent = {
      runId: 'missing-start', schemaVersion: 1, sequence: 1, eventId: 'boundary-1', occurredAt: 2_000,
      kind: 'boundary-applied', nodeId: 'scene-1', effects: [
        { operator: 'emit-evidence', skillId: 'forces', outcome: 'success', independence: 'independent' },
      ],
    };
    expect(normaliseExperienceEvidence([boundary])).toEqual([]);
  });
});

describe('conservative, inspectable aggregation', () => {
  it('withholds a mastery band for one attempt, independent of input order', () => {
    const graph = buildSkillGraph(SKILLS);
    const first = aggregateMastery(graph, [evidence()]);
    expect(first.summaries.find((item) => item.skillId === 'forces')).toMatchObject({
      status: 'insufficient-evidence',
      reasons: ['Fewer than two evidence opportunities: no mastery band is claimed.'],
    });
    expect(first.summaries.find((item) => item.skillId === 'forces')).not.toHaveProperty('band');

    const mixed = [
      evidence({ id: 'late', occurredAt: 4_000, outcome: 'failure', confidence: 'sure' }),
      evidence({ id: 'early', occurredAt: 2_000, outcome: 'success' }),
    ];
    expect(aggregateMastery(graph, mixed)).toEqual(aggregateMastery(graph, [...mixed].reverse()));
    expect(aggregateMastery(graph, mixed).summaries.find((item) => item.skillId === 'forces')!.evidence)
      .toMatchObject({
        opportunities: 2, independentSuccesses: 1, confidentWrong: 1,
        opportunitiesByKind: { application: 2 },
        opportunitiesBySupport: { independent: 2, hinted: 0, assisted: 0, unknown: 0 },
      });
  });

  it('requires repeated independent success before secure and keeps unknown skills inspectable', () => {
    const graph = buildSkillGraph(SKILLS);
    const records = [1, 2, 3, 4].map((n) => evidence({ id: `e-${n}`, occurredAt: n * 1_000 }));
    const result = aggregateMastery(graph, [
      ...records,
      evidence({ id: 'unknown', skillId: 'not-authored' }),
      evidence({ id: 'e-1' }),
    ]);
    expect(result.summaries.find((item) => item.skillId === 'forces')).toMatchObject({ band: 'secure' });
    expect(result.ignoredEvidence).toEqual([
      { id: 'e-1', reason: 'Duplicate evidence id.' },
      { id: 'unknown', reason: 'Unknown authored skill "not-authored".' },
    ]);
  });
});

describe('legacy migration boundary', () => {
  it('labels legacy quiz and review records instead of fabricating skill evidence', () => {
    expect(classifyLegacyQuizAttempt({
      moduleId: 'forces', itemId: 'assessment', startedAt: 10, finishedAt: 20, score: 8, maxScore: 10,
    })).toMatchObject({ kind: 'legacy', source: 'quiz-attempt', occurredAt: 20 });
    expect(classifyLegacyReviewState({
      moduleId: 'forces', itemId: 'quiz:assessment:q1', lastReviewedAt: 30, lastQuality: 4,
    })).toMatchObject({ kind: 'legacy', source: 'review-state', occurredAt: 30 });
  });
});
