import validate from './generated/validate-pack.mjs';
import contracts from './activity-contracts.json' with { type: 'json' };
import { parseCircuitConfiguration, setCircuitElement, solveCircuit } from './circuit-model.ts';
import type { CircuitConfiguration, CircuitElement } from './circuit-model.ts';
import { validateMeterProbe } from './meter-probe.ts';
import type { MeterProbeActivity } from './meter-probe.ts';
export type { MeterProbeActivity } from './meter-probe.ts';
import { validateRepairBench } from './repair-bench.ts';
import type { RepairBenchActivity } from './repair-bench.ts';
export type { RepairBenchActivity } from './repair-bench.ts';

export interface ChoiceActivity {
  type: 'choice';
  options: { id: string; text: string; correct: boolean; feedback: string }[];
}
export interface CircuitActivity {
  type: 'circuit';
  initial: CircuitConfiguration;
  solution: CircuitConfiguration;
  labels: Record<string, string>;
  sourceValues?: number[];
  interval?: { initialSeconds: number; solutionSeconds: number; values: number[] };
  controls: { id: string; values: (number | boolean)[] }[];
  goals: {
    reading: string;
    quantity: 'current' | 'voltage' | 'power' | 'charge' | 'energy';
    min: number;
    max: number;
  }[];
}
export type Activity = ChoiceActivity | CircuitActivity | MeterProbeActivity | RepairBenchActivity;
export interface LaboratoryNode {
  id: string;
  title: string;
  prompt: string;
  role: 'prediction' | 'practice' | 'transfer' | 'reflection';
  activity: Activity;
  hints: string[];
  workedExample: string;
  mechanism: string;
  bridge?: string;
  transitions: { passed: string | null; assisted: string | null };
}
export interface LaboratoryEpisode {
  id: string;
  title: string;
  estimatedMinutes: number;
  debrief?: { title: string; body: string };
  skills: string[];
  prerequisites: string[];
  start: string;
  nodes: LaboratoryNode[];
}
export interface LaboratoryPack {
  formatVersion: 1;
  version: number;
  stateVersion: 1;
  id: string;
  title: string;
  description: string;
  audience: string;
  level: string;
  subject: { id: string; title: string };
  capabilities: Record<string, string>;
  skills: { id: string; title: string; criterion: string; prerequisites: string[] }[];
  episodes: LaboratoryEpisode[];
  references: { id: string; title: string; url: string; note: string }[];
  assets: { path: string; attribution: string }[];
  scopeNote: string;
}
export const ACTIVITY_CONTRACTS = contracts;
export const LABORATORY_CAPABILITIES: Readonly<Record<string, string>> = {
  'experience-graph': '0.1.1',
  'activity-plugin': '0.1.0',
  ...Object.fromEntries(Object.entries(contracts).map(([key, value]) => [key, value.version])),
};
export function leaves(
  node: CircuitElement,
): Exclude<CircuitElement, { elements: CircuitElement[] }>[] {
  if (node.type === 'series' || node.type === 'parallel') return node.elements.flatMap(leaves);
  return [node];
}
export function circuitGoalMet(
  activity: CircuitActivity,
  config: CircuitConfiguration,
  elapsedSeconds = activity.interval?.initialSeconds ?? 0,
): boolean {
  const solution = solveCircuit(config);
  if (solution.status !== 'solved') return false;
  return activity.goals.every(({ reading, quantity, min, max }) => {
    const meter = reading === 'source' ? null : solution.readings.find((v) => v.id === reading);
    const current = reading === 'source' ? solution.current : meter?.current;
    const power = reading === 'source' ? solution.power : meter?.power;
    const value =
      quantity === 'voltage'
        ? reading === 'source'
          ? config.voltage
          : meter?.voltage
        : quantity === 'charge' && typeof current === 'number'
          ? current * elapsedSeconds
          : quantity === 'energy' && typeof power === 'number'
            ? power * elapsedSeconds
            : quantity === 'current'
              ? current
              : power;
    return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
  });
}
const unique = (ids: string[], at: string) => {
  if (new Set(ids).size !== ids.length) throw new Error(`${at}: duplicate id`);
};
const dag = (items: { id: string; prerequisites: string[] }[], at: string) => {
  unique(
    items.map((v) => v.id),
    at,
  );
  const visited = new Set<string>();
  const active = new Set<string>();
  const visit = (id: string) => {
    if (active.has(id)) throw new Error(`${at}: prerequisite cycle at ${id}`);
    if (visited.has(id)) return;
    const item = items.find((v) => v.id === id);
    if (!item) throw new Error(`${at}: missing prerequisite ${id}`);
    active.add(id);
    item.prerequisites.forEach(visit);
    active.delete(id);
    visited.add(id);
  };
  items.forEach((v) => visit(v.id));
};
function validateActivity(activity: Activity, at: string) {
  if (activity.type === 'choice') {
    unique(
      activity.options.map((v) => v.id),
      at,
    );
    if (activity.options.filter((v) => v.correct).length !== 1)
      throw new Error(
        `${at}: choice requires exactly one correct option; use reflection for unmarked interpretation`,
      );
    return;
  }
  if (activity.type === 'meter-probe') {
    validateMeterProbe(activity, at);
    return;
  }
  if (activity.type === 'repair-bench') {
    validateRepairBench(activity, at);
    return;
  }
  const initial = parseCircuitConfiguration(activity.initial);
  const witness = parseCircuitConfiguration(activity.solution);
  const initialLeaves = leaves(initial.circuit);
  if (initialLeaves.some((v) => ['source', 'elapsed-time'].includes(v.id)))
    throw new Error(`${at}: source and elapsed-time are reserved controls/readings`);
  unique(
    activity.controls.map((v) => v.id),
    at,
  );
  if (!activity.controls.length && !activity.sourceValues && !activity.interval)
    throw new Error(`${at}: circuit needs an adjustable control`);
  let reachable = initial;
  for (const control of activity.controls) {
    unique(control.values.map(String), `${at}/${control.id}`);
    const leaf = initialLeaves.find((v) => v.id === control.id);
    if (!leaf) throw new Error(`${at}: unknown control ${control.id}`);
    const startValue = leaf.type === 'resistor' ? leaf.ohms : leaf.closed;
    if (!control.values.includes(startValue))
      throw new Error(`${at}: initial value not available for ${control.id}`);
    for (const value of control.values) setCircuitElement(initial, control.id, value);
    const target = leaves(witness.circuit).find((v) => v.id === control.id);
    if (!target) throw new Error(`${at}: solution changes topology`);
    const endValue = target.type === 'resistor' ? target.ohms : target.closed;
    if (!control.values.includes(endValue))
      throw new Error(`${at}: solution control ${control.id} is unreachable`);
    reachable = setCircuitElement(reachable, control.id, endValue);
  }
  if (activity.sourceValues) {
    unique(activity.sourceValues.map(String), `${at}/sourceValues`);
    if (
      !activity.sourceValues.includes(initial.voltage) ||
      !activity.sourceValues.includes(witness.voltage)
    )
      throw new Error(`${at}: source voltage control is unreachable`);
    reachable = parseCircuitConfiguration({ ...reachable, voltage: witness.voltage });
  }
  if (activity.interval) {
    unique(activity.interval.values.map(String), `${at}/interval`);
    if (
      !activity.interval.values.includes(activity.interval.initialSeconds) ||
      !activity.interval.values.includes(activity.interval.solutionSeconds)
    )
      throw new Error(`${at}: observation interval is unreachable`);
  }
  if (JSON.stringify(reachable) !== JSON.stringify(witness))
    throw new Error(`${at}: solution changes an unavailable control, source or topology`);
  if (
    initialLeaves.some((v) => !Object.hasOwn(activity.labels, v.id) || !activity.labels[v.id]) ||
    Object.keys(activity.labels).some((id) => !initialLeaves.some((v) => v.id === id))
  )
    throw new Error(`${at}: labels must match all circuit elements`);
  for (const goal of activity.goals) {
    if (
      goal.min > goal.max ||
      (goal.reading !== 'source' && !initialLeaves.some((v) => v.id === goal.reading))
    )
      throw new Error(`${at}: invalid reading range ${goal.reading}`);
    if (['charge', 'energy'].includes(goal.quantity) && !activity.interval)
      throw new Error(`${at}: integrated reading requires an observation interval`);
  }
  if (
    solveCircuit(initial).status !== 'solved' ||
    !circuitGoalMet(activity, witness, activity.interval?.solutionSeconds)
  )
    throw new Error(
      `${at}: supported initial state and a satisfying reachable solution are required`,
    );
}
/** Same structural/semantic boundary in the CLI and browser. Standalone Ajv
 * executes ordinary generated functions under CSP; it never compiles content. */
export function parseLaboratoryPack(raw: unknown): LaboratoryPack {
  if (!validate(raw))
    throw new Error(
      (validate.errors ?? []).map((e) => `${e.instancePath || '/'}: ${e.message}`).join('\n'),
    );
  const pack = raw as LaboratoryPack;
  if (new TextEncoder().encode(JSON.stringify(pack)).length > 1024 * 1024)
    throw new Error('Pack exceeds 1 MiB');
  for (const [key, required] of Object.entries(pack.capabilities)) {
    const available = Object.hasOwn(LABORATORY_CAPABILITIES, key)
      ? LABORATORY_CAPABILITIES[key]
      : undefined;
    const wanted = required.split('.').map(Number);
    const actual = available?.split('.').map(Number);
    if (
      !actual ||
      actual[0] !== wanted[0] ||
      (wanted[0] === 0 && actual[1] !== wanted[1]) ||
      actual[1]! < wanted[1]! ||
      (actual[1] === wanted[1] && actual[2]! < wanted[2]!)
    )
      throw new Error(`Unsupported capability ${key}@${required}`);
  }
  for (const core of ['experience-graph', 'activity-plugin'])
    if (!pack.capabilities[core]) throw new Error(`Missing required capability ${core}`);
  if (
    pack.capabilities['experience-graph'] === '0.1.0' &&
    pack.episodes.some((episode) => episode.debrief || episode.nodes.some((node) => node.bridge))
  )
    throw new Error('Authored bridge/debrief requires experience-graph@0.1.1');
  if (
    pack.capabilities.circuit === '0.1.0' &&
    pack.episodes.some((episode) =>
      episode.nodes.some(
        (node) =>
          node.activity.type === 'circuit' &&
          (node.activity.sourceValues ||
            node.activity.interval ||
            node.activity.goals.some((goal) => ['charge', 'energy'].includes(goal.quantity))),
      ),
    )
  )
    throw new Error('Source/interval/charge/energy controls require circuit@0.1.1');
  dag(pack.skills, 'skills');
  dag(pack.episodes, 'episodes');
  unique(
    pack.references.map((v) => v.id),
    'references',
  );
  unique(
    pack.assets.map((v) => v.path),
    'assets',
  );
  for (const asset of pack.assets)
    if (asset.path.split('/').some((v) => v === '.' || v === '..' || v === ''))
      throw new Error(`Unsafe asset path ${asset.path}`);
  for (const episode of pack.episodes) {
    if (episode.skills.some((id) => !pack.skills.some((s) => s.id === id)))
      throw new Error(`${episode.id}: unknown skill`);
    unique(
      episode.nodes.map((n) => n.id),
      episode.id,
    );
    const visited = new Set<string>();
    const active = new Set<string>();
    const visit = (id: string | null): void => {
      if (id === null) return;
      if (active.has(id))
        throw new Error(
          `${episode.id}: scene cycle at ${id}; this initial contract supports finite DAGs`,
        );
      if (visited.has(id)) return;
      const node = episode.nodes.find((n) => n.id === id);
      if (!node) throw new Error(`${episode.id}: missing scene ${id}`);
      active.add(id);
      if (!pack.capabilities[node.activity.type])
        throw new Error(`${id}: missing activity capability ${node.activity.type}`);
      validateActivity(node.activity, `${episode.id}/${id}`);
      visit(node.transitions.passed);
      visit(node.transitions.assisted);
      active.delete(id);
      visited.add(id);
    };
    visit(episode.start);
    if (visited.size !== episode.nodes.length)
      throw new Error(`${episode.id}: orphan/unreachable scenes`);
    if (!episode.nodes.some((n) => n.role === 'transfer'))
      throw new Error(`${episode.id}: needs independent transfer opportunity`);
  }
  return structuredClone(pack);
}
