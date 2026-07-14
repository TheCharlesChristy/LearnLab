import { describe, expect, it } from 'vitest';

import linearGraphFixture from '../../fixtures/experience-v2/linear.valid.json';
import type { ExperienceGraph } from '../experience';
import { createNode, deleteNode, duplicateNode, setTransitionTarget } from './model';
import { validateGraph } from './validation';

const fixture = linearGraphFixture as unknown as ExperienceGraph;

describe('Studio graph edits (#46)', () => {
  it('assigns a fresh stable ID when duplicating without changing existing references', () => {
    const duplicate = duplicateNode(fixture, fixture.entryNodeId);
    expect('message' in duplicate).toBe(false);
    if ('message' in duplicate) return;

    const original = fixture.nodes.find((node) => node.id === fixture.entryNodeId);
    const copied = duplicate.nodes.at(-1);
    expect(copied?.id).not.toBe(original?.id);
    expect(copied?.id).toMatch(/^scene-\d+$/);
    expect(duplicate.entryNodeId).toBe(fixture.entryNodeId);
  });

  it('blocks deletes that would orphan the entry or a transition', () => {
    const entryDelete = deleteNode(fixture, fixture.entryNodeId);
    expect(entryDelete.conflict?.message).toMatch(/stable reference/i);
    expect(entryDelete.conflict?.field).toBe('entryNodeId');

    const ending = fixture.nodes.find((node) => node.kind === 'ending');
    expect(ending).toBeDefined();
    if (ending === undefined) return;
    const endingDelete = deleteNode(fixture, ending.id);
    expect(endingDelete.conflict?.nodeId).toBe(fixture.entryNodeId);
  });

  it('rejects a transition target outside the open graph', () => {
    const result = setTransitionTarget(fixture, fixture.entryNodeId, 'fallback', 'another-pack-node');
    expect('message' in result).toBe(true);
    if ('message' in result) expect(result.message).toMatch(/does not exist/);
  });

  it('reports a broken target at the responsible node and field', () => {
    const broken = structuredClone(fixture);
    const scene = broken.nodes.find((node) => node.kind === 'scene');
    if (scene?.kind !== 'scene') throw new Error('fixture needs a scene');
    scene.transitions.fallback.to = 'missing-node';

    expect(validateGraph(broken)).toContainEqual(
      expect.objectContaining({ nodeId: scene.id, field: 'transitions.fallback.to' }),
    );
  });

  it('creates graph-only nodes in memory; callers choose whether to export them', () => {
    const node = createNode(fixture, 'ending');
    expect(node.id).toMatch(/^ending-\d+$/);
    expect(fixture.nodes.some((candidate) => candidate.id === node.id)).toBe(false);
  });
});
