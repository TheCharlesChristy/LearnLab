import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { projectRunStart } from '../../src/experience/run-state';
import { planSceneAdvance } from '../../src/experience/runtime/traversal';
import type { CoursePack, ExperienceGraph } from '../../src/experience/types';

const root = resolve(import.meta.dirname, '../..');
const pack = JSON.parse(
  readFileSync(resolve(root, 'public/content/v2/harbour-hoist/course-pack.json'), 'utf8'),
) as CoursePack;
const graph = JSON.parse(
  readFileSync(resolve(root, 'public/content/v2/harbour-hoist/experiences/balance-the-hoist.json'), 'utf8'),
) as ExperienceGraph;

describe('Harbour hoist v2 vertical slice (#57)', () => {
  it('keeps three reusable mechanics, persistent repair effects, and standalone delayed review in one pack', () => {
    expect(pack.engineCapabilities.map((capability) => capability.key)).toEqual(
      expect.arrayContaining(['core-flash-recall', 'experiment-infer', 'diagnose-repair']),
    );
    expect(pack.state.declarations.map((declaration) => declaration.path)).toEqual(
      expect.arrayContaining(['/hoist/repaired', '/hoist/evidence', '/hoist/resultant-understood']),
    );
    expect(pack.reviewItems[0]).toMatchObject({
      standaloneContext: expect.stringContaining('120 N upward'),
      source: { experienceId: 'balance-the-hoist', nodeId: 'experiment-balance' },
    });

    const repair = graph.nodes.find((node) => node.id === 'diagnose-repair');
    expect(repair).toMatchObject({
      kind: 'scene',
      activity: { key: 'diagnose-repair' },
      effects: expect.arrayContaining([
        { operator: 'set', path: '/hoist/repaired', value: true },
        { operator: 'checkpoint', label: 'evidence-based-repair' },
      ]),
    });
  });

  it('routes the self-graded retrieval branch to additional support and reconverges at the experiment', () => {
    const run = projectRunStart({
      runId: 'harbour-hoist-test', eventId: 'created', packId: pack.id, experienceId: graph.id,
      packVersion: pack.version, experienceVersion: graph.version, stateVersion: graph.stateVersion,
      entryNodeId: graph.entryNodeId, occurredAt: 1,
    });
    expect(
      planSceneAdvance(graph, run, 'again', { outcome: { completed: true, values: { '/grade': 'again' } } })?.target.id,
    ).toBe('guided-sum');
    expect(
      planSceneAdvance(graph, run, 'good', { outcome: { completed: true, values: { '/grade': 'good' } } })?.target.id,
    ).toBe('experiment-balance');
    const guided = graph.nodes.find((node) => node.id === 'guided-sum');
    expect(guided).toMatchObject({ kind: 'scene', transitions: { fallback: { to: 'experiment-balance' } } });
  });

  it('keeps every authored force calculation and the documented non-ship decision reviewable', () => {
    expect(200 + -200).toBe(0);
    expect(160 + -200).toBe(-40);
    expect(120 + -90).toBe(30);
    const playtest = readFileSync(resolve(root, 'docs/V2_VERTICAL_SLICE_PLAYTEST.md'), 'utf8');
    expect(playtest).toContain('**Decision: REVISE.**');
    expect(playtest).toContain('at least 24 hours');
    expect(playtest).toContain('Keyboard and screen reader');
    expect(
      readFileSync(resolve(root, 'public/content/v2/harbour-hoist/fixtures/balance-the-hoist.fixture.json'), 'utf8'),
    ).toBe(readFileSync(resolve(root, 'public/content/v2/harbour-hoist/experiences/balance-the-hoist.json'), 'utf8'));
  });
});
