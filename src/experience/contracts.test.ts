import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { describe, expect, it } from 'vitest';

import coursePackSchema from '../../schemas/course-pack.schema.json';
import experienceGraphSchema from '../../schemas/experience-graph.schema.json';
import branchGraph from '../../fixtures/experience-v2/branching.valid.json';
import coursePack from '../../fixtures/experience-v2/course-pack.valid.json';
import linearGraph from '../../fixtures/experience-v2/linear.valid.json';
import loopGraph from '../../fixtures/experience-v2/looping.valid.json';
import missingFallback from '../../fixtures/experience-v2/missing-fallback.invalid.json';
import missingTermination from '../../fixtures/experience-v2/missing-termination.invalid.json';
import multiEndingGraph from '../../fixtures/experience-v2/multi-ending.valid.json';
import unknownOperator from '../../fixtures/experience-v2/unknown-operator.invalid.json';
import type { CoursePack, ExperienceGraph } from './types';

function validators() {
  const ajv = new Ajv2020({ allErrors: true, allowUnionTypes: true, discriminator: true });
  addFormats(ajv);
  return {
    pack: ajv.compile(coursePackSchema),
    graph: ajv.compile(experienceGraphSchema),
  };
}

describe('v2 course-pack and experience-graph contracts (#36)', () => {
  it('accepts a versioned pack with declared capabilities, state, skills, assets, and a standalone review item', () => {
    const { pack } = validators();
    expect(pack(coursePack)).toBe(true);

    // The TypeScript twins accept the same public contract as the JSON fixtures.
    // JSON module imports are intentionally `number`/`string` widened by
    // TypeScript. Ajv establishes their runtime shape; the assertion crosses
    // that JSON boundary so the test exercises the public TypeScript twin too.
    const typedPack = coursePack as unknown as CoursePack;
    expect(typedPack.reviewItems[0]?.standaloneContext).toContain('10 N upward');
    expect(typedPack.state.declarations[0]?.path).toBe('/bridge/repaired');
  });

  it.each([
    ['linear', linearGraph],
    ['branching', branchGraph],
    ['looping', loopGraph],
    ['multi-ending', multiEndingGraph],
  ])('accepts the representative %s graph fixture', (_name, graphFixture) => {
    const { graph } = validators();
    expect(graph(graphFixture)).toBe(true);

    const typedGraph = graphFixture as unknown as ExperienceGraph;
    expect(typedGraph.entryNodeId).not.toHaveLength(0);
  });

  it.each([
    ['a scene without its explicit fallback', missingFallback],
    ['an unregistered goal operator', unknownOperator],
    ['an ending without termination semantics', missingTermination],
  ])('rejects %s', (_name, graphFixture) => {
    const { graph } = validators();
    expect(graph(graphFixture)).toBe(false);
  });

  it('rejects unknown properties throughout the declared contract', () => {
    const { pack, graph } = validators();
    expect(pack({ ...coursePack, accidental: true })).toBe(false);
    expect(
      graph({
        ...linearGraph,
        nodes: [{ ...linearGraph.nodes[0], activity: { ...linearGraph.nodes[0]!.activity, keyTypo: 'choice' } }, linearGraph.nodes[1]],
      }),
    ).toBe(false);
  });
});
