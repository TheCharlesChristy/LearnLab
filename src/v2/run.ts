import { circuitGoalMet, leaves } from './pack.ts';
import type { CircuitActivity, LaboratoryEpisode, LaboratoryNode, LaboratoryPack } from './pack.ts';
import { parseCircuitConfiguration, setCircuitElement, solveCircuit } from './circuit-model.ts';
import type { CircuitConfiguration } from './circuit-model.ts';

export type RunEvent = { at: number; node: string } & (
  | { type: 'control'; id: string; value: number | boolean }
  | { type: 'answer'; option: string }
  | { type: 'hint' }
  | { type: 'worked' }
  | { type: 'advance'; outcome: 'passed' | 'assisted' }
  | { type: 'restart' }
  | { type: 'time'; ms: number }
);
export type RunInput = {
  [K in RunEvent['type']]: Omit<Extract<RunEvent, { type: K }>, 'at'>;
}[RunEvent['type']];
export interface LaboratoryRun {
  stateVersion: 1;
  startedAt: number;
  packId: string;
  packVersion: number;
  episodeId: string;
  events: RunEvent[];
  priorExposure?: string[];
}
export interface NodeMemory {
  circuit?: CircuitConfiguration;
  selected?: string;
  attempts: number;
  actions: number;
  hints: number;
  worked: boolean;
  replayed: boolean;
}
export interface Evidence {
  node: string;
  outcome: 'passed' | 'assisted';
  independent: boolean;
  role: LaboratoryNode['role'];
  attempts: number;
  hints: number;
  worked: boolean;
  at: number;
  replayed: boolean;
}
export interface RunProjection {
  current: string | null;
  memory: Record<string, NodeMemory>;
  evidence: Evidence[];
  exposed: Set<string>;
  activeMs: number;
  restarts: number;
}
export function newRun(
  pack: LaboratoryPack,
  episode: LaboratoryEpisode,
  priorExposure: string[] = [],
): LaboratoryRun {
  return {
    stateVersion: 1,
    startedAt: Date.now(),
    packId: pack.id,
    packVersion: pack.version,
    episodeId: episode.id,
    events: [],
    priorExposure: [...new Set(priorExposure)],
  };
}
const initialMemory = (node: LaboratoryNode, replayed = false): NodeMemory => ({
  ...(node.activity.type === 'circuit' ? { circuit: structuredClone(node.activity.initial) } : {}),
  attempts: 0,
  actions: 0,
  hints: 0,
  worked: false,
  replayed,
});
export function nodePassed(node: LaboratoryNode, memory: NodeMemory): boolean {
  if (node.activity.type === 'choice')
    return !!node.activity.options.find((v) => v.id === memory.selected)?.correct;
  return (
    memory.actions > 0 &&
    !!memory.circuit &&
    circuitGoalMet(node.activity, solveCircuit(memory.circuit))
  );
}
/** Replay is the persistence validation boundary. Only bounded typed events are
 * accepted, and outcomes are recomputed from interaction rather than imported claims. */
export function projectRun(
  pack: LaboratoryPack,
  episode: LaboratoryEpisode,
  run: LaboratoryRun,
): RunProjection {
  if (
    run.stateVersion !== 1 ||
    run.packId !== pack.id ||
    run.packVersion !== pack.version ||
    run.episodeId !== episode.id
  )
    throw new Error(
      'Saved work belongs to another content/state version. Export it before starting a new run.',
    );
  if (
    !Array.isArray(run.events) ||
    run.events.length > 2000 ||
    new TextEncoder().encode(JSON.stringify(run)).length > 256 * 1024
  )
    throw new Error('Saved work exceeds the bounded event limit. Export it before starting again.');
  const result: RunProjection = {
    current: episode.start,
    memory: Object.create(null) as Record<string, NodeMemory>,
    evidence: [],
    exposed: new Set(run.priorExposure ?? []),
    activeMs: 0,
    restarts: 0,
  };
  if (!Number.isSafeInteger(run.startedAt) || run.startedAt < 0)
    throw new Error('Invalid start time');
  if (
    run.priorExposure !== undefined &&
    (!Array.isArray(run.priorExposure) ||
      run.priorExposure.length > episode.nodes.length ||
      run.priorExposure.some(
        (id) => typeof id !== 'string' || !episode.nodes.some((n) => n.id === id),
      ))
  )
    throw new Error('Invalid prior answer exposure');
  let lastAt = run.startedAt;
  let creditedThrough = run.startedAt;
  for (const event of run.events) {
    if (
      !event ||
      !Number.isSafeInteger(event.at) ||
      event.at < lastAt ||
      typeof event.node !== 'string'
    )
      throw new Error('Invalid saved event timestamp or scene');
    lastAt = event.at;
    const keys: Record<RunEvent['type'], string[]> = {
      control: ['id', 'value'],
      answer: ['option'],
      hint: [],
      worked: [],
      advance: ['outcome'],
      restart: [],
      time: ['ms'],
    };
    if (
      !Object.hasOwn(keys, event.type) ||
      Object.keys(event).some((k) => !['type', 'at', 'node', ...keys[event.type]].includes(k))
    )
      throw new Error('Unknown saved event or fields');
    if (event.type === 'restart') {
      if (event.node !== episode.start) throw new Error('Invalid restart scene');
      result.current = episode.start;
      result.memory = Object.create(null) as Record<string, NodeMemory>;
      result.restarts++;
      continue;
    }
    if (result.current !== event.node) throw new Error('Saved event is out of scene order');
    const node = episode.nodes.find((n) => n.id === result.current);
    if (!node) throw new Error('Saved scene no longer exists');
    const memory = (result.memory[node.id] ??= initialMemory(node, result.exposed.has(node.id)));
    if (event.type === 'time') {
      if (
        !Number.isFinite(event.ms) ||
        event.ms < 0 ||
        event.ms > 15000 ||
        event.ms > event.at - creditedThrough
      )
        throw new Error('Invalid active-time event');
      result.activeMs += event.ms;
      creditedThrough = event.at;
      continue;
    }
    if (event.type === 'hint') {
      if (memory.hints >= node.hints.length) throw new Error('Saved hint exceeds authored ladder');
      memory.hints++;
      result.exposed.add(node.id);
      continue;
    }
    if (event.type === 'worked') {
      memory.worked = true;
      result.exposed.add(node.id);
      continue;
    }
    if (event.type === 'control') {
      if (
        node.activity.type !== 'circuit' ||
        !node.activity.controls.find((v) => v.id === event.id)?.values.includes(event.value)
      )
        throw new Error('Saved control is unavailable');
      memory.circuit = setCircuitElement(memory.circuit!, event.id, event.value);
      memory.actions++;
      result.exposed.add(node.id);
      continue;
    }
    if (event.type === 'answer') {
      if (
        node.activity.type !== 'choice' ||
        !node.activity.options.some((v) => v.id === event.option) ||
        nodePassed(node, memory)
      )
        throw new Error('Saved answer is unavailable');
      memory.selected = event.option;
      memory.attempts++;
      memory.actions++;
      result.exposed.add(node.id);
      continue;
    }
    if (event.type === 'advance') {
      if (
        !['passed', 'assisted'].includes(event.outcome) ||
        (event.outcome === 'passed' && !nodePassed(node, memory))
      )
        throw new Error('Saved advancement has no supporting interaction');
      const replayed = memory.replayed;
      result.evidence.push({
        node: node.id,
        role: node.role,
        outcome: event.outcome,
        independent:
          event.outcome === 'passed' &&
          node.role === 'transfer' &&
          memory.hints === 0 &&
          !memory.worked &&
          !replayed &&
          (node.activity.type !== 'choice' || memory.attempts === 1),
        attempts: memory.attempts,
        hints: memory.hints,
        worked: memory.worked,
        replayed,
        at: event.at,
      });
      result.exposed.add(node.id);
      result.current = node.transitions[event.outcome];
    }
  }
  if (result.current) {
    const node = episode.nodes.find((n) => n.id === result.current)!;
    result.memory[node.id] ??= initialMemory(node, result.exposed.has(node.id));
  }
  return result;
}
export function parseRun(
  raw: unknown,
  pack: LaboratoryPack,
  episode: LaboratoryEpisode,
): LaboratoryRun {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw))
    throw new Error('Saved work is not an object');
  const keys = Object.keys(raw);
  if (
    keys.some(
      (k) =>
        ![
          'stateVersion',
          'startedAt',
          'packId',
          'packVersion',
          'episodeId',
          'events',
          'priorExposure',
        ].includes(k),
    )
  )
    throw new Error('Unknown saved work fields');
  const run = raw as LaboratoryRun;
  projectRun(pack, episode, run);
  return structuredClone(run);
}
export function appendEvent(
  pack: LaboratoryPack,
  episode: LaboratoryEpisode,
  run: LaboratoryRun,
  event: RunEvent,
): LaboratoryRun {
  const next = { ...run, events: [...run.events, event] };
  projectRun(pack, episode, next);
  return next;
}
export function activityMemory(node: LaboratoryNode, projection: RunProjection): NodeMemory {
  return projection.memory[node.id] ?? initialMemory(node, projection.exposed.has(node.id));
}
export function controlValue(
  activity: CircuitActivity,
  config: CircuitConfiguration,
  id: string,
): number | boolean {
  parseCircuitConfiguration(config);
  if (!activity.controls.some((v) => v.id === id)) throw new Error('Unknown control');
  const element = leaves(config.circuit).find((v) => v.id === id)!;
  return element.type === 'switch' ? element.closed : element.ohms;
}

/** Conservative exposure extraction for recovery, including unreadable older
 * envelopes. It can only remove a fresh-evidence claim, never award one. */
export function retainedExposure(raw: unknown, episode: LaboratoryEpisode): string[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
  const value = raw as Record<string, unknown>;
  const known = new Set(episode.nodes.map((n) => n.id));
  const prior = Array.isArray(value.priorExposure) ? value.priorExposure.slice(0, 64) : [];
  const events = Array.isArray(value.events) ? value.events.slice(0, 2000) : [];
  const observed = events.flatMap((event: unknown) => {
    if (!event || typeof event !== 'object' || Array.isArray(event)) return [];
    const e = event as Record<string, unknown>;
    return ['answer', 'control', 'hint', 'worked', 'advance'].includes(String(e.type))
      ? [e.node]
      : [];
  });
  return [
    ...new Set(
      [...prior, ...observed].filter((id): id is string => typeof id === 'string' && known.has(id)),
    ),
  ];
}
/** A restored export is historical data. Preserve local exposure across rollback;
 * imported answer logs are not newly observed independent performance. */
export function restoreRun(
  raw: unknown,
  current: unknown,
  pack: LaboratoryPack,
  episode: LaboratoryEpisode,
): LaboratoryRun {
  const imported = parseRun(raw, pack, episode);
  imported.priorExposure = [
    ...new Set([...retainedExposure(imported, episode), ...retainedExposure(current, episode)]),
  ];
  projectRun(pack, episode, imported);
  return imported;
}
