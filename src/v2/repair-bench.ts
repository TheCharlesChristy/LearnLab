import { parseCircuitConfiguration, solveCircuit } from './circuit-model.ts';
import type { CircuitConfiguration, CircuitSolution } from './circuit-model.ts';

/** A bounded socket board: parts may be moved or left in the tray, and the
 * same sockets may be connected as one path or as separate paths. This is a
 * topology-changing workspace, but not an unrestricted graph simulator. */
export interface RepairBenchState {
  layout: 'series' | 'parallel';
  placements: Record<string, string | null>;
}
export interface RepairBenchActivity {
  type: 'repair-bench';
  voltage: number;
  slots: { id: string; label: string }[];
  parts: { id: string; label: string; ohms: number }[];
  initial: RepairBenchState;
  solution: RepairBenchState;
  goals: {
    reading: string;
    quantity: 'current' | 'voltage' | 'power';
    min: number;
    max: number;
  }[];
}

const unique = (ids: string[]) => new Set(ids).size === ids.length;
const sameKeys = (actual: string[], expected: string[]) =>
  actual.length === expected.length && actual.every((id) => expected.includes(id));

export function validateRepairState(activity: RepairBenchActivity, state: RepairBenchState): void {
  const slots = activity.slots.map((slot) => slot.id);
  if (
    !['series', 'parallel'].includes(state.layout) ||
    !state.placements ||
    typeof state.placements !== 'object' ||
    Array.isArray(state.placements) ||
    !sameKeys(Object.keys(state.placements), slots)
  )
    throw new Error('Repair board has an unavailable layout or socket');
  const occupied = Object.values(state.placements).filter((id): id is string => id !== null);
  if (!unique(occupied) || occupied.some((id) => !activity.parts.some((part) => part.id === id)))
    throw new Error('Repair board has an unknown or duplicated part');
}

export function repairConfiguration(
  activity: RepairBenchActivity,
  state: RepairBenchState,
): CircuitConfiguration {
  validateRepairState(activity, state);
  return parseCircuitConfiguration({
    voltage: activity.voltage,
    circuit: {
      type: state.layout,
      elements: activity.slots.map((slot) => {
        const partId = state.placements[slot.id];
        const part = activity.parts.find((item) => item.id === partId);
        return part
          ? { type: 'resistor' as const, id: slot.id, ohms: part.ohms }
          : { type: 'switch' as const, id: slot.id, closed: false };
      }),
    },
  });
}

export function repairReading(
  activity: RepairBenchActivity,
  state: RepairBenchState,
  reading: string,
  quantity: 'current' | 'voltage' | 'power',
): number | null {
  const result = solveCircuit(repairConfiguration(activity, state));
  if (result.status !== 'solved') return null;
  const source = reading === 'source';
  const meter = source ? null : result.readings.find((item) => item.id === reading);
  if (!source && !meter) return null;
  if (quantity === 'voltage') return source ? activity.voltage : (meter?.voltage ?? null);
  if (quantity === 'power') return source ? result.power : meter!.power;
  return source ? result.current : meter!.current;
}

export function repairGoalMet(activity: RepairBenchActivity, state: RepairBenchState): boolean {
  return activity.goals.every((goal) => {
    const value = repairReading(activity, state, goal.reading, goal.quantity);
    return value !== null && value >= goal.min && value <= goal.max;
  });
}

export function repairSolution(
  activity: RepairBenchActivity,
  state: RepairBenchState,
): CircuitSolution {
  return solveCircuit(repairConfiguration(activity, state));
}

export function placeRepairPart(
  activity: RepairBenchActivity,
  state: RepairBenchState,
  slot: string,
  part: string | null,
): RepairBenchState {
  if (
    !activity.slots.some((item) => item.id === slot) ||
    (part !== null && !activity.parts.some((item) => item.id === part))
  )
    throw new Error('Repair board part or socket is unavailable');
  const placements = { ...state.placements };
  if (part !== null) {
    for (const [id, placed] of Object.entries(placements))
      if (placed === part) placements[id] = null;
  }
  placements[slot] = part;
  const next = { ...state, placements };
  validateRepairState(activity, next);
  if (JSON.stringify(next) === JSON.stringify(state))
    throw new Error('Repair board did not change');
  return next;
}

export function setRepairLayout(
  activity: RepairBenchActivity,
  state: RepairBenchState,
  layout: 'series' | 'parallel',
): RepairBenchState {
  if (!['series', 'parallel'].includes(layout) || layout === state.layout)
    throw new Error('Repair board layout did not change');
  const next = { ...state, layout };
  validateRepairState(activity, next);
  return next;
}

export function validateRepairBench(activity: RepairBenchActivity, at: string): void {
  const slots = activity.slots.map((slot) => slot.id);
  const parts = activity.parts.map((part) => part.id);
  if (
    !unique(slots) ||
    !unique(parts) ||
    slots.includes('source') ||
    parts.some((id) => slots.includes(id)) ||
    activity.slots.some((item) => !item.label.trim()) ||
    activity.parts.some((item) => !item.label.trim())
  )
    throw new Error(`${at}: duplicate, reserved or unlabelled board item`);
  validateRepairState(activity, activity.initial);
  validateRepairState(activity, activity.solution);
  if (JSON.stringify(activity.initial) === JSON.stringify(activity.solution))
    throw new Error(`${at}: witness must require a repair`);
  if (
    repairSolution(activity, activity.initial).status !== 'solved' ||
    repairGoalMet(activity, activity.initial) ||
    repairSolution(activity, activity.solution).status !== 'solved' ||
    !repairGoalMet(activity, activity.solution)
  )
    throw new Error(`${at}: unmet supported starting state and satisfying witness required`);
  if (
    activity.goals.some(
      (goal) => goal.min > goal.max || (goal.reading !== 'source' && !slots.includes(goal.reading)),
    )
  )
    throw new Error(`${at}: invalid board reading goal`);
}
