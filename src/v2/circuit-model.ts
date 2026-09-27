/** Bounded ideal DC tree model for laboratory activities.
 * Reuses circuit-sim's series/parallel reduction, adding ideal switches and
 * explicit floating/unsupported results. No transient, semiconductor, internal
 * resistance or unrestricted graph claims. All values use V, A, ohms and W.
 */
export type CircuitElement =
  | { type: 'resistor'; id: string; ohms: number }
  | { type: 'switch'; id: string; closed: boolean }
  | { type: 'series'; elements: CircuitElement[] }
  | { type: 'parallel'; elements: CircuitElement[] };
export interface CircuitConfiguration {
  voltage: number;
  circuit: CircuitElement;
}
export interface CircuitReading {
  id: string;
  type: 'resistor' | 'switch';
  current: number;
  voltage: number | null;
  power: number;
}
export type CircuitSolution =
  | { status: 'unsupported'; reason: string }
  | {
      status: 'solved';
      current: number;
      resistance: number | null;
      power: number;
      readings: CircuitReading[];
    };

const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const exactKeys = (v: Record<string, unknown>, keys: string[], at: string) => {
  const extra = Object.keys(v).filter((k) => !keys.includes(k));
  if (extra.length) throw new Error(`${at}: unsupported fields ${extra.join(', ')}`);
};

/** Safe for content/import boundaries, including explicit limits on nesting. */
export function parseCircuitConfiguration(raw: unknown): CircuitConfiguration {
  if (!record(raw)) throw new Error('circuit: expected an object');
  exactKeys(raw, ['voltage', 'circuit'], 'circuit');
  if (!finite(raw.voltage) || raw.voltage < 0 || raw.voltage > 24)
    throw new Error('voltage must be finite, from 0 to 24 V');
  const ids = new Set<string>();
  let count = 0;
  const parse = (value: unknown, at: string, depth: number): CircuitElement => {
    if (++count > 64 || depth > 8) throw new Error(`${at}: maximum 64 elements and depth 8`);
    if (!record(value)) throw new Error(`${at}: expected an element`);
    if (value.type === 'series' || value.type === 'parallel') {
      exactKeys(value, ['type', 'elements'], at);
      if (!Array.isArray(value.elements) || value.elements.length < 1 || value.elements.length > 8)
        throw new Error(`${at}: groups need 1 to 8 elements`);
      return {
        type: value.type,
        elements: Array.from(value.elements, (v, i) => parse(v, `${at}/elements/${i}`, depth + 1)),
      };
    }
    if (value.type !== 'resistor' && value.type !== 'switch')
      throw new Error(`${at}: unregistered element type`);
    if (
      typeof value.id !== 'string' ||
      !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(value.id) ||
      value.id.length > 64
    )
      throw new Error(`${at}: invalid element id`);
    if (ids.has(value.id)) throw new Error(`${at}: duplicate element id ${value.id}`);
    ids.add(value.id);
    if (value.type === 'switch') {
      exactKeys(value, ['type', 'id', 'closed'], at);
      if (typeof value.closed !== 'boolean')
        throw new Error(`${at}: switch.closed must be boolean`);
      return { type: 'switch', id: value.id, closed: value.closed };
    }
    exactKeys(value, ['type', 'id', 'ohms'], at);
    if (!finite(value.ohms) || value.ohms < 1 || value.ohms > 10000)
      throw new Error(`${at}: resistance must be finite, from 1 to 10000 ohms`);
    return { type: 'resistor', id: value.id, ohms: value.ohms };
  };
  const circuit = parse(raw.circuit, 'circuit', 0);
  if (!containsResistor(circuit)) throw new Error('circuit: at least one resistor is required');
  return { voltage: raw.voltage, circuit };
}
function containsResistor(node: CircuitElement): boolean {
  return (
    node.type === 'resistor' || (node.type !== 'switch' && node.elements.some(containsResistor))
  );
}
export function equivalentResistance(node: CircuitElement): number {
  if (node.type === 'resistor') return node.ohms;
  if (node.type === 'switch') return node.closed ? 0 : Infinity;
  const parts = node.elements.map(equivalentResistance);
  if (node.type === 'series') return parts.reduce((a, b) => a + b, 0);
  if (parts.some((r) => r === 0)) return 0;
  const conductance = parts.reduce((sum, r) => sum + 1 / r, 0);
  return conductance === 0 ? Infinity : 1 / conductance;
}
function hasUnsupportedParallelShort(node: CircuitElement): boolean {
  if (node.type === 'resistor' || node.type === 'switch') return false;
  return (
    (node.type === 'parallel' && node.elements.some((e) => equivalentResistance(e) === 0)) ||
    node.elements.some(hasUnsupportedParallelShort)
  );
}

/** Supply current and power are always finite on a solved result. Infinite
 * resistance is exposed as null (open), not JSON's accidental Infinity -> null.
 * Multiple series breaks have indeterminate individual voltage drops: null.
 */
export function solveCircuit(input: CircuitConfiguration): CircuitSolution {
  const config = parseCircuitConfiguration(input);
  const resistance = equivalentResistance(config.circuit);
  if (resistance === 0 || hasUnsupportedParallelShort(config.circuit))
    return {
      status: 'unsupported',
      reason:
        'Ideal short circuits and zero-resistance parallel paths are outside this model. Add a resistive load in each path.',
    };
  const current = config.voltage / resistance;
  const readings: CircuitReading[] = [];
  const walk = (node: CircuitElement, volts: number | null, amps: number): void => {
    if (node.type === 'resistor' || node.type === 'switch') {
      readings.push({
        id: node.id,
        type: node.type,
        current: amps,
        voltage: volts,
        power: volts === null ? 0 : volts * amps,
      });
      return;
    }
    const parts = node.elements.map(equivalentResistance);
    if (node.type === 'parallel') {
      node.elements.forEach((child, i) =>
        walk(child, volts, volts === null ? 0 : volts / parts[i]!),
      );
      return;
    }
    const breaks = parts.filter((r) => !Number.isFinite(r)).length;
    node.elements.forEach((child, i) => {
      const r = parts[i]!;
      const drop = Number.isFinite(r) ? amps * r : breaks === 1 ? volts : null;
      walk(child, drop, amps);
    });
  };
  walk(config.circuit, config.voltage, current);
  return {
    status: 'solved',
    current,
    resistance: Number.isFinite(resistance) ? resistance : null,
    power: config.voltage * current,
    readings,
  };
}

/** Immutable typed control operation; no content-provided predicates. */
export function setCircuitElement(
  config: CircuitConfiguration,
  id: string,
  value: number | boolean,
): CircuitConfiguration {
  let changed = false;
  const visit = (node: CircuitElement): CircuitElement => {
    if (node.type === 'series' || node.type === 'parallel')
      return { ...node, elements: node.elements.map(visit) };
    if (node.id !== id) return node;
    changed = true;
    if (node.type === 'resistor' && typeof value === 'number') return { ...node, ohms: value };
    if (node.type === 'switch' && typeof value === 'boolean') return { ...node, closed: value };
    throw new Error(`${id}: control value has the wrong type`);
  };
  const next = { ...config, circuit: visit(config.circuit) };
  if (!changed) throw new Error(`Unknown circuit control ${id}`);
  return parseCircuitConfiguration(next);
}
