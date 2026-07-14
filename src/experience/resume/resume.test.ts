import { describe, expect, it } from 'vitest';

import { projectRunStart } from '../run-state';
import type { CoursePack, ExperienceGraph } from '../types';

import { loadResumePlan, planResume, type ResumeTarget } from './resume';

const graph: ExperienceGraph = {
  schemaVersion: 2,
  id: 'repair',
  packId: 'pack',
  version: '2.0.0',
  stateVersion: '2.0.0',
  entryNodeId: 'inspect',
  nodes: [
    {
      id: 'inspect',
      kind: 'scene',
      presentation: { kind: 'briefing', body: 'Inspect it.' },
      activity: { key: 'choice', version: '1.0.0', props: {} },
      goal: { operator: 'activity-complete' },
      feedback: { success: 'Done.' },
      effects: [],
      transitions: { branches: [], fallback: { to: 'finish' } },
    },
    {
      id: 'finish',
      kind: 'ending',
      presentation: { kind: 'explanation', body: 'Complete.' },
      termination: { status: 'complete', summary: 'Done.' },
    },
  ],
};

const pack: Pick<CoursePack, 'id' | 'version' | 'state'> = {
  id: 'pack',
  version: '2.0.0',
  state: {
    version: '2.0.0',
    declarations: [
      { path: '/repaired', type: 'boolean', default: false },
      { path: '/score', type: 'number', default: 0, minimum: 0 },
      { path: '/tools', type: 'string-set', default: [] },
    ],
    migrations: [{ fromVersion: '1.0.0', toVersion: '2.0.0', strategy: 'preserve-declared-state' }],
  },
};

const target: ResumeTarget = { pack, graph };

function run(overrides: Record<string, unknown> = {}) {
  return {
    ...projectRunStart({
      runId: 'run',
      eventId: 'created',
      packId: 'pack',
      experienceId: 'repair',
      packVersion: '1.0.0',
      experienceVersion: '1.0.0',
      stateVersion: '1.0.0',
      entryNodeId: 'inspect',
      initialVariables: { '/repaired': true, '/score': 4, '/tools': ['spanner'], '/removed': 'x' },
      occurredAt: 1,
    }),
    ...overrides,
  };
}

describe('v2 resume and declarative state migration (#40)', () => {
  it('resumes a durable checkpoint without reapplying its rewards or evidence', async () => {
    const saved = run({
      checkpoint: { nodeId: 'inspect', eventId: 'checkpoint-1' },
      evidence: [{ skillId: 'repair', outcome: 'success', independence: 'independent', eventId: 'checkpoint-1' }],
      celebrations: ['first-repair'],
      stateVersion: '2.0.0',
      packVersion: '2.0.0',
      experienceVersion: '2.0.0',
    });
    const first = await loadResumePlan('run', target, async () => saved);
    const second = await loadResumePlan('run', target, async () => saved);
    expect(first).toMatchObject({ kind: 'resume', run: { checkpoint: saved.checkpoint } });
    expect(second).toMatchObject({ kind: 'resume', run: { checkpoint: saved.checkpoint } });
    expect(saved.evidence).toHaveLength(1);
    expect(saved.celebrations).toEqual(['first-repair']);
  });

  it('preserves only declared, valid state through an explicit migration path', () => {
    const result = planResume(run(), target);
    expect(result.kind).toBe('migrate');
    if (result.kind !== 'migrate') return;
    expect(result.migrations).toHaveLength(1);
    expect(result.run.variables).toEqual({ '/repaired': true, '/score': 4, '/tools': ['spanner'] });
    expect(result.run.stateVersion).toBe('2.0.0');
  });

  it('uses an authored reset strategy rather than attempting to preserve incompatible state', () => {
    const resetTarget: ResumeTarget = {
      ...target,
      pack: {
        ...pack,
        state: {
          ...pack.state,
          migrations: [{ fromVersion: '1.0.0', toVersion: '2.0.0', strategy: 'reset' }],
        },
      },
    };
    const result = planResume(run(), resetTarget);
    expect(result.kind).toBe('reset');
    if (result.kind !== 'reset') return;
    expect(result.fallback.initialVariables).toEqual({ '/repaired': false, '/score': 0, '/tools': [] });
  });

  it('fails closed to a fresh run for missing migration paths, missing nodes, and corrupt stored data', async () => {
    const noPath = planResume(run(), {
      ...target,
      pack: { ...pack, state: { ...pack.state, migrations: [] } },
    });
    expect(noPath.kind).toBe('fallback');
    const missingNode = planResume(run({ currentNodeId: 'deleted' }), target);
    expect(missingNode.kind).toBe('fallback');
    const corrupt = await loadResumePlan('run', target, async () => {
      throw new Error('projection does not match event log');
    });
    expect(corrupt).toMatchObject({ kind: 'fallback', fallback: { entryNodeId: 'inspect' } });
  });
});
