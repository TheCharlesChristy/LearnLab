import { parseCircuitConfiguration, solveCircuit } from './circuit-model.ts';
import type { CircuitConfiguration, CircuitElement } from './circuit-model.ts';

export interface MeterProbeActivity {
  type: 'meter-probe';
  candidates: {
    id: string;
    title: string;
    configuration: CircuitConfiguration;
  }[];
  actual: string;
  labels: Record<string, string>;
  probes: { id: string; reading: string; quantity: 'current' | 'voltage' }[];
}

export const formatMeterReading = (value: number): string =>
  new Intl.NumberFormat('en-GB', { maximumSignificantDigits: 3 }).format(value);

function shape(node: CircuitElement): string {
  return node.type === 'series' || node.type === 'parallel'
    ? `${node.type}(${node.elements.map(shape).join(',')})`
    : `${node.type}:${node.id}`;
}

function leafValues(node: CircuitElement, result: Map<string, number | boolean>): void {
  if (node.type === 'series' || node.type === 'parallel') {
    node.elements.forEach((child) => leafValues(child, result));
  } else {
    result.set(node.id, node.type === 'switch' ? node.closed : node.ohms);
  }
}

export function redactedMeterIds(activity: MeterProbeActivity): string[] {
  const [first, second] = activity.candidates;
  if (!first || !second) return [];
  const a = new Map<string, number | boolean>();
  const b = new Map<string, number | boolean>();
  leafValues(first.configuration.circuit, a);
  leafValues(second.configuration.circuit, b);
  return [...a.keys()].filter((id) => a.get(id) !== b.get(id));
}

export function meterReading(
  activity: MeterProbeActivity,
  candidateId: string,
  probeId: string,
): number {
  const candidate = activity.candidates.find((item) => item.id === candidateId);
  const probe = activity.probes.find((item) => item.id === probeId);
  if (!candidate || !probe) throw new Error('Unknown candidate or meter position');
  const result = solveCircuit(candidate.configuration);
  if (result.status !== 'solved') throw new Error('Meter configuration is unsupported');
  const value =
    probe.reading === 'source'
      ? probe.quantity === 'current'
        ? result.current
        : candidate.configuration.voltage
      : result.readings.find((item) => item.id === probe.reading)?.[probe.quantity];
  if (typeof value !== 'number' || !Number.isFinite(value))
    throw new Error('Meter position has no determinate reading');
  return value;
}

export function informativeProbeIds(activity: MeterProbeActivity): string[] {
  const [first, second] = activity.candidates;
  if (!first || !second) return [];
  return activity.probes
    .filter(
      (probe) =>
        formatMeterReading(meterReading(activity, first.id, probe.id)) !==
        formatMeterReading(meterReading(activity, second.id, probe.id)),
    )
    .map((probe) => probe.id);
}

export function validateMeterProbe(activity: MeterProbeActivity, at: string): void {
  if (activity.candidates.length !== 2)
    throw new Error(`${at}: meter activity needs exactly two candidate states`);
  const [first, second] = activity.candidates;
  if (
    !first ||
    !second ||
    first.id === second.id ||
    !activity.candidates.some((v) => v.id === activity.actual)
  )
    throw new Error(`${at}: candidate IDs must differ and include the actual state`);
  const a = parseCircuitConfiguration(first.configuration);
  const b = parseCircuitConfiguration(second.configuration);
  if (a.voltage !== b.voltage || shape(a.circuit) !== shape(b.circuit))
    throw new Error(`${at}: candidate states need the same supply and circuit positions`);
  if (redactedMeterIds(activity).length === 0)
    throw new Error(`${at}: candidate states must differ in a component setting`);
  const ids = new Set<string>();
  const add = (id: string, kind: string) => {
    if (ids.has(id)) throw new Error(`${at}: duplicate ${kind} ${id}`);
    ids.add(id);
  };
  const leaves = new Set<string>();
  const visit = (node: CircuitElement): void => {
    if (node.type === 'series' || node.type === 'parallel') node.elements.forEach(visit);
    else leaves.add(node.id);
  };
  visit(a.circuit);
  if (leaves.has('source')) throw new Error(`${at}: source is a reserved meter reading`);
  if (
    Object.keys(activity.labels).length !== leaves.size ||
    [...leaves].some((id) => !activity.labels[id])
  )
    throw new Error(`${at}: labels must match every circuit component`);
  const placements = new Set<string>();
  for (const probe of activity.probes) {
    add(probe.id, 'probe');
    if (probe.reading !== 'source' && !leaves.has(probe.reading))
      throw new Error(`${at}: unknown meter position ${probe.reading}`);
    const position = `${probe.reading}:${probe.quantity}`;
    if (placements.has(position)) throw new Error(`${at}: duplicate meter placement ${position}`);
    placements.add(position);
    for (const candidate of activity.candidates) meterReading(activity, candidate.id, probe.id);
  }
  const informative = informativeProbeIds(activity);
  if (!informative.length || informative.length === activity.probes.length)
    throw new Error(`${at}: include both diagnostic and nondiagnostic meter positions`);
}
