import {
  createStudioActivityPluginCatalog,
  validateActivityPluginProps,
} from '../experience/plugins';
import type { ExperienceGraph, SceneNode } from '../experience';
import type { ExperienceRun, RunStateValue, RunVariables } from '../experience/run-state';
import type { CoursePack } from '../experience';

export interface StudioFormField {
  name: string;
  required: boolean;
  type: string;
  description?: string;
}
export interface StudioPreviewPlan {
  run: ExperienceRun;
  scene: SceneNode;
  propsValid: boolean;
  propErrors: readonly string[];
  explanation: string[];
}

/** Derives fields from the generated plugin schema — never a second Studio registry. */
export function studioPluginFormFields(key: string): StudioFormField[] {
  const plugin = createStudioActivityPluginCatalog().plugins.find((item) => item.key === key);
  if (!plugin) return [];
  const schema = plugin.propsSchema as {
    properties?: Record<string, { type?: string; description?: string }>;
    required?: string[];
  };
  return Object.entries(schema.properties ?? {}).map(([name, value]) => ({
    name,
    required: schema.required?.includes(name) ?? false,
    type: value.type ?? 'value',
    ...(value.description ? { description: value.description } : {}),
  }));
}

function seededVariables(pack: CoursePack, overrides: RunVariables): RunVariables {
  const values: RunVariables = {};
  for (const item of pack.state.declarations)
    values[item.path] = item.type === 'string-set' ? [...item.default] : item.default;
  for (const [path, value] of Object.entries(overrides))
    if (path in values) values[path as keyof RunVariables] = value as RunStateValue;
  return values;
}

/** Builds an in-memory preview run; no Dexie or run-state writer is used. */
export function planStudioPreview(
  pack: CoursePack,
  graph: ExperienceGraph,
  nodeId: string,
  overrides: RunVariables = {},
): StudioPreviewPlan | null {
  const scene = graph.nodes.find(
    (node): node is SceneNode => node.id === nodeId && node.kind === 'scene',
  );
  if (!scene || graph.packId !== pack.id) return null;
  const validation = validateActivityPluginProps(scene.activity.key, scene.activity.props);
  const run: ExperienceRun = {
    runId: `studio-preview:${nodeId}`,
    schemaVersion: 1,
    packId: pack.id,
    experienceId: graph.id,
    packVersion: pack.version,
    experienceVersion: graph.version,
    stateVersion: graph.stateVersion,
    currentNodeId: nodeId,
    variables: seededVariables(pack, overrides),
    unlockedCapabilityIds: [],
    branchHistory: [nodeId],
    evidence: [],
    celebrations: [],
    eventCount: 1,
    createdAt: 0,
    updatedAt: 0,
  };
  return {
    run,
    scene,
    propsValid: validation.valid,
    propErrors: validation.errors,
    explanation: [
      `Preview starts at ${nodeId}.`,
      `Seeded state: ${JSON.stringify(run.variables)}.`,
      `Activity props ${validation.valid ? 'match' : 'do not match'} ${scene.activity.key}@${scene.activity.version}.`,
      ...scene.effects.map((effect) => `On success: ${effect.operator}.`),
    ],
  };
}

/** A readable inspector projection: events/effects are explained, not executed. */
export function explainStudioRun(run: ExperienceRun, graph: ExperienceGraph): string[] {
  const node = graph.nodes.find((item) => item.id === run.currentNodeId);
  return [
    `Current node: ${run.currentNodeId}.`,
    `State entries: ${Object.keys(run.variables).length}.`,
    `Recorded evidence: ${run.evidence.length}.`,
    ...(node?.kind === 'scene'
      ? node.effects.map((effect) => `This scene can apply ${effect.operator}.`)
      : []),
    ...(run.ending ? [`Run ended: ${run.ending}.`] : ['Run is resumable.']),
  ];
}
