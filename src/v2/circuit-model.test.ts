import { describe, expect, it } from 'vitest';
import { parseCircuitConfiguration, setCircuitElement, solveCircuit } from './circuit-model';
import type { CircuitConfiguration, CircuitElement } from './circuit-model';
const r = (id: string, ohms: number): CircuitElement => ({ type: 'resistor', id, ohms });
const s = (id: string, closed: boolean): CircuitElement => ({ type: 'switch', id, closed });
const group = (type: 'series' | 'parallel', ...elements: CircuitElement[]): CircuitElement => ({
  type,
  elements,
});
const solve = (circuit: CircuitElement, voltage = 12) => {
  const solution = solveCircuit({ voltage, circuit });
  if (solution.status !== 'solved') throw new Error(solution.reason);
  return solution;
};

describe('bounded circuit laboratory model', () => {
  it('agrees with independently calculated series, parallel and mixed values and conserves power', () => {
    // 6 || 3 = 2 ohms. In series with 4 ohms, total = 6 ohms.
    // 12/6 = 2 A; series drop = 8 V; branches see 4 V.
    const result = solve(group('series', r('heater', 4), group('parallel', r('a', 6), r('b', 3))));
    expect(result.resistance).toBe(6);
    expect(result.current).toBe(2);
    expect(result.readings[0]).toMatchObject({ voltage: 8, current: 2, power: 16 });
    expect(result.readings[1]!.current).toBeCloseTo(2 / 3);
    expect(result.readings[2]!.current).toBeCloseTo(4 / 3);
    expect(result.readings.slice(1).reduce((n, v) => n + v.current, 0)).toBeCloseTo(result.current);
    expect(result.readings.reduce((n, v) => n + v.power, 0)).toBeCloseTo(result.power);
  });
  it('models the dark beacon and repair, without mutating its original controls', () => {
    const initial: CircuitConfiguration = {
      voltage: 6,
      circuit: group('series', s('supply-link', false), r('beacon', 6)),
    };
    expect(solveCircuit(initial)).toMatchObject({
      status: 'solved',
      current: 0,
      resistance: null,
      power: 0,
    });
    const repaired = setCircuitElement(initial, 'supply-link', true);
    expect(solveCircuit(repaired)).toMatchObject({
      status: 'solved',
      current: 1,
      resistance: 6,
      power: 6,
    });
    expect(solveCircuit(initial)).toMatchObject({ current: 0 });
  });
  it('keeps an intact parallel branch working when another branch is opened', () => {
    const result = solve(
      group('parallel', group('series', s('a-link', false), r('a', 6)), r('b', 3)),
    );
    expect(result.current).toBe(4);
    expect(result.readings.find((v) => v.id === 'a')).toMatchObject({ current: 0, voltage: 0 });
    expect(result.readings.find((v) => v.id === 'a-link')).toMatchObject({
      current: 0,
      voltage: 12,
    });
    expect(result.readings.find((v) => v.id === 'b')).toMatchObject({
      current: 4,
      voltage: 12,
      power: 48,
    });
  });
  it('does not invent voltage across multiple series breaks or emit non-finite JSON values', () => {
    const result = solve(group('series', s('a', false), r('load', 3), s('b', false)));
    expect(result.current).toBe(0);
    expect(result.readings.filter((v) => v.type === 'switch').map((v) => v.voltage)).toEqual([
      null,
      null,
    ]);
    expect(result.readings.find((v) => v.id === 'load')!.voltage).toBe(0);
    expect(JSON.stringify(result)).not.toMatch(/NaN|Infinity/);
    const zeroSupply = solve(group('series', s('a', false), r('load', 3), s('b', false)), 0);
    expect(zeroSupply.readings.filter((v) => v.type === 'switch').map((v) => v.voltage)).toEqual([
      null,
      null,
    ]);
    expect(zeroSupply.readings.find((v) => v.id === 'load')!.voltage).toBe(0);
    expect(zeroSupply.power).toBe(0);
  });
  it('rejects unsupported ideal parallel shorts instead of showing a plausible but false current', () => {
    expect(
      solveCircuit({ voltage: 12, circuit: group('parallel', s('short', true), r('load', 6)) })
        .status,
    ).toBe('unsupported');
    expect(
      solveCircuit({
        voltage: 12,
        circuit: group(
          'series',
          r('limiter', 6),
          group('parallel', s('short', true), r('load', 6)),
        ),
      }).status,
    ).toBe('unsupported');
  });
  it('rejects unregistered shapes, duplicated controls, units-as-strings and out-of-bounds values', () => {
    for (const input of [
      { voltage: '12 V', circuit: r('load', 6) },
      { voltage: 25, circuit: r('load', 6) },
      { voltage: 12, circuit: r('load', 0) },
      { voltage: 12, circuit: r('load', Infinity) },
      { voltage: 12, circuit: group('series', r('load', 6), r('load', 3)) },
      { voltage: 12, circuit: { type: 'diode', id: 'd' } },
      { voltage: 12, circuit: { ...r('load', 6), evaluate: 'arbitrary code' } },
    ])
      expect(() => parseCircuitConfiguration(input)).toThrow();
  });
  it('rejects sparse arrays at the unknown input boundary', () => {
    const elements = [r('load', 6)];
    elements.length = 2;
    expect(() =>
      parseCircuitConfiguration({ voltage: 12, circuit: { type: 'series', elements } }),
    ).toThrow('elements/1: expected an element');
  });
  it('enforces control identity, type and bounds and prevents deeply nested content', () => {
    const config = { voltage: 12, circuit: r('load', 6) };
    expect(() => setCircuitElement(config, 'missing', 3)).toThrow('Unknown');
    expect(() => setCircuitElement(config, 'load', true)).toThrow('wrong type');
    expect(() => setCircuitElement(config, 'load', -3)).toThrow('resistance');
    let circuit = r('load', 3);
    for (let i = 0; i < 10; i++) circuit = group('series', circuit);
    expect(() => parseCircuitConfiguration({ voltage: 12, circuit })).toThrow('depth');
  });
});
