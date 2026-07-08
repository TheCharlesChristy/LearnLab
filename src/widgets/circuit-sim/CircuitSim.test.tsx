// Behaviour tests for the CircuitSim implementation (SRS §5.3 row, D-024):
// pure resistance/current/voltage computation (series, parallel, and a
// nested series-of-parallel worked example with a current-sums-back-to-
// total sanity check), circuit-JSON validation (errors naming the exact
// problem), the diagram's structure description, and component-level
// rendering (results table, malformed-file error card, fetch-failure retry
// card, relative src resolution via LessonContext).

import { cleanup, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);

import { LessonContext } from '../../content';
import type { LessonContextValue } from '../../content';

import {
  computeBranchResults,
  computeCombinedResistance,
  describeNode,
  formatSig,
  parseCircuitFile,
} from './CircuitSim';
import CircuitSim from './CircuitSim';
import type { CircuitNode } from './CircuitSim';

function withLesson(children: ReactNode, moduleBaseUrl = '/content/modules/dt/') {
  const value: LessonContextValue = {
    moduleId: 'dt',
    moduleBaseUrl,
    recordAttempt: async () => {},
    getItemState: async () => null,
    setItemState: async () => {},
    recordReview: async () => {},
    seedReviewItem: async () => {},
    notifyEngagement: () => {},
  };
  return <LessonContext.Provider value={value}>{children}</LessonContext.Provider>;
}

function mockFetchJson(data: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, status: 200, json: async () => data })) as unknown as typeof fetch,
  );
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

const SERIES_CIRCUIT = {
  voltage: 12,
  circuit: {
    type: 'series',
    elements: [
      { type: 'resistor', id: 'R1', ohms: 10 },
      { type: 'resistor', id: 'R2', ohms: 20 },
    ],
  },
};

const PARALLEL_CIRCUIT = {
  voltage: 12,
  circuit: {
    type: 'parallel',
    elements: [
      { type: 'resistor', id: 'R2', ohms: 20 },
      { type: 'resistor', id: 'R3', ohms: 30 },
    ],
  },
};

// The worked example from the schema: R1 in series with (R2 parallel R3).
const NESTED_CIRCUIT = {
  voltage: 12,
  circuit: {
    type: 'series',
    elements: [
      { type: 'resistor', id: 'R1', ohms: 10 },
      {
        type: 'parallel',
        elements: [
          { type: 'resistor', id: 'R2', ohms: 20 },
          { type: 'resistor', id: 'R3', ohms: 30 },
        ],
      },
    ],
  },
};

describe('parseCircuitFile — accept', () => {
  it('parses a well-formed series circuit', () => {
    const parsed = parseCircuitFile(SERIES_CIRCUIT);
    expect(parsed.voltage).toBe(12);
    expect(parsed.circuit).toEqual(SERIES_CIRCUIT.circuit);
  });

  it('parses a well-formed nested series-of-parallel circuit', () => {
    const parsed = parseCircuitFile(NESTED_CIRCUIT);
    expect(parsed.circuit).toEqual(NESTED_CIRCUIT.circuit);
  });
});

describe('parseCircuitFile — reject (errors name the exact problem)', () => {
  it('rejects a non-object', () => {
    expect(() => parseCircuitFile(null)).toThrow(/must be a JSON object/);
    expect(() => parseCircuitFile('nope')).toThrow(/must be a JSON object/);
  });

  it('rejects a missing/non-positive voltage', () => {
    expect(() => parseCircuitFile({ circuit: SERIES_CIRCUIT.circuit })).toThrow(
      /voltage: must be a positive number/,
    );
    expect(() => parseCircuitFile({ voltage: 0, circuit: SERIES_CIRCUIT.circuit })).toThrow(
      /voltage: must be a positive number/,
    );
    expect(() => parseCircuitFile({ voltage: -5, circuit: SERIES_CIRCUIT.circuit })).toThrow(
      /voltage: must be a positive number/,
    );
    expect(() => parseCircuitFile({ voltage: 'nope', circuit: SERIES_CIRCUIT.circuit })).toThrow(
      /voltage: must be a positive number/,
    );
  });

  it('rejects a non-object circuit node', () => {
    expect(() => parseCircuitFile({ voltage: 12, circuit: null })).toThrow(
      /circuit: must be an object with a "type" field/,
    );
  });

  it('rejects an unknown node type', () => {
    expect(() => parseCircuitFile({ voltage: 12, circuit: { type: 'capacitor' } })).toThrow(
      /circuit\.type: must be "resistor", "series", or "parallel" \(got "capacitor"\)/,
    );
  });

  it('rejects a resistor with a missing/empty id', () => {
    expect(() =>
      parseCircuitFile({ voltage: 12, circuit: { type: 'resistor', ohms: 10 } }),
    ).toThrow(/circuit\.id: must be a non-empty string/);
  });

  it('rejects a resistor with non-positive ohms', () => {
    expect(() =>
      parseCircuitFile({ voltage: 12, circuit: { type: 'resistor', id: 'R1', ohms: 0 } }),
    ).toThrow(/circuit\.ohms: must be a positive number \(got 0\)/);
    expect(() =>
      parseCircuitFile({ voltage: 12, circuit: { type: 'resistor', id: 'R1', ohms: -10 } }),
    ).toThrow(/circuit\.ohms: must be a positive number \(got -10\)/);
  });

  it('rejects a series/parallel node with empty elements', () => {
    expect(() =>
      parseCircuitFile({ voltage: 12, circuit: { type: 'series', elements: [] } }),
    ).toThrow(/circuit\.elements: must be a non-empty array/);
  });

  it('rejects duplicate resistor ids across the whole tree (including nested)', () => {
    expect(() =>
      parseCircuitFile({
        voltage: 12,
        circuit: {
          type: 'series',
          elements: [
            { type: 'resistor', id: 'R1', ohms: 10 },
            {
              type: 'parallel',
              elements: [
                { type: 'resistor', id: 'R1', ohms: 20 },
                { type: 'resistor', id: 'R3', ohms: 30 },
              ],
            },
          ],
        },
      }),
    ).toThrow(/circuit\.elements\[1\]\.elements\[0\]\.id: duplicate resistor id "R1"/);
  });

  it('names the exact nested path of a bad field', () => {
    expect(() => parseCircuitFile(NESTED_CIRCUIT_WITH_BAD_LEAF())).toThrow(
      /circuit\.elements\[1\]\.elements\[1\]\.ohms: must be a positive number \(got -30\)/,
    );

    function NESTED_CIRCUIT_WITH_BAD_LEAF() {
      return {
        voltage: 12,
        circuit: {
          type: 'series',
          elements: [
            { type: 'resistor', id: 'R1', ohms: 10 },
            {
              type: 'parallel',
              elements: [
                { type: 'resistor', id: 'R2', ohms: 20 },
                { type: 'resistor', id: 'R3', ohms: -30 },
              ],
            },
          ],
        },
      };
    }
  });
});

describe('computeCombinedResistance', () => {
  it('sums resistances in series (R1=10, R2=20 -> 30Ω)', () => {
    const circuit = parseCircuitFile(SERIES_CIRCUIT).circuit;
    expect(computeCombinedResistance(circuit)).toBeCloseTo(30);
  });

  it('combines resistances in parallel (R2=20, R3=30 -> 12Ω, via 1/(1/20+1/30))', () => {
    const circuit = parseCircuitFile(PARALLEL_CIRCUIT).circuit;
    expect(computeCombinedResistance(circuit)).toBeCloseTo(12);
  });

  it('handles a single resistor leaf', () => {
    const leaf: CircuitNode = { type: 'resistor', id: 'R1', ohms: 42 };
    expect(computeCombinedResistance(leaf)).toBe(42);
  });

  it('combines the nested series-of-parallel example (R1=10 series (R2=20 parallel R3=30) -> 22Ω)', () => {
    const circuit = parseCircuitFile(NESTED_CIRCUIT).circuit;
    // parallel(20,30) = 12; series(10,12) = 22.
    expect(computeCombinedResistance(circuit)).toBeCloseTo(22);
  });
});

describe('computeBranchResults', () => {
  it('gives every resistor the same current in a pure series circuit', () => {
    const circuit = parseCircuitFile(SERIES_CIRCUIT).circuit;
    const total = computeCombinedResistance(circuit); // 30
    const totalCurrent = SERIES_CIRCUIT.voltage / total; // 0.4
    const results = computeBranchResults(circuit, totalCurrent);
    expect(results).toHaveLength(2);
    for (const r of results) {
      expect(r.current).toBeCloseTo(totalCurrent);
    }
    const r1 = results.find((r) => r.id === 'R1')!;
    const r2 = results.find((r) => r.id === 'R2')!;
    expect(r1.voltage).toBeCloseTo(totalCurrent * 10);
    expect(r2.voltage).toBeCloseTo(totalCurrent * 20);
  });

  it('splits current inversely with resistance in a pure parallel circuit, equal branch voltage', () => {
    const circuit = parseCircuitFile(PARALLEL_CIRCUIT).circuit;
    const total = computeCombinedResistance(circuit); // 12
    const totalCurrent = PARALLEL_CIRCUIT.voltage / total; // 1
    const results = computeBranchResults(circuit, totalCurrent);
    const r2 = results.find((r) => r.id === 'R2')!;
    const r3 = results.find((r) => r.id === 'R3')!;
    expect(r2.voltage).toBeCloseTo(r3.voltage);
    expect(r2.voltage).toBeCloseTo(totalCurrent * total);
    expect(r2.current).toBeCloseTo(r2.voltage / 20);
    expect(r3.current).toBeCloseTo(r3.voltage / 30);
    // Branch currents must sum back to the total current.
    expect(r2.current + r3.current).toBeCloseTo(totalCurrent);
  });

  it('solves the nested series-of-parallel worked example exactly, sums back to total', () => {
    const circuit = parseCircuitFile(NESTED_CIRCUIT).circuit;
    const total = computeCombinedResistance(circuit); // 22
    const totalCurrent = NESTED_CIRCUIT.voltage / total; // 12/22 ≈ 0.5455
    expect(totalCurrent).toBeCloseTo(0.545454545, 6);

    const results = computeBranchResults(circuit, totalCurrent);
    const r1 = results.find((r) => r.id === 'R1')!;
    const r2 = results.find((r) => r.id === 'R2')!;
    const r3 = results.find((r) => r.id === 'R3')!;

    // R1 is in series with the whole rest of the circuit: full current.
    expect(r1.current).toBeCloseTo(totalCurrent);
    expect(r1.voltage).toBeCloseTo(totalCurrent * 10); // ≈ 5.4545

    // Across the parallel group, voltage = incomingCurrent * groupResistance(12).
    const groupVoltage = totalCurrent * 12;
    expect(groupVoltage).toBeCloseTo(6.545454545, 6);
    expect(r2.voltage).toBeCloseTo(groupVoltage);
    expect(r3.voltage).toBeCloseTo(groupVoltage);
    expect(r2.current).toBeCloseTo(groupVoltage / 20); // ≈ 0.3273
    expect(r3.current).toBeCloseTo(groupVoltage / 30); // ≈ 0.2182

    // Sanity check: branch currents of a parallel group sum back to the
    // current that flowed into it (here, the total circuit current).
    expect(r2.current + r3.current).toBeCloseTo(totalCurrent);
  });
});

describe('describeNode', () => {
  it('describes a single resistor', () => {
    expect(describeNode({ type: 'resistor', id: 'R1', ohms: 10 })).toBe('R1');
  });

  it('describes the nested series-of-parallel example', () => {
    const circuit = parseCircuitFile(NESTED_CIRCUIT).circuit;
    expect(describeNode(circuit)).toBe('R1 in series with R2 parallel R3');
  });
});

describe('formatSig', () => {
  it('formats to 3 significant figures without trailing zeros', () => {
    expect(formatSig(0.5454545454545454)).toBe('0.545');
    expect(formatSig(22)).toBe('22');
    expect(formatSig(6.545454545454544)).toBe('6.55');
    expect(formatSig(0)).toBe('0');
  });
});

describe('CircuitSim component', () => {
  it('renders the summary line and results table with correct values for the nested example', async () => {
    mockFetchJson(NESTED_CIRCUIT);
    render(<CircuitSim src="circuits/nested.json" />);

    expect(await screen.findByText(/Total resistance: 22 Ω · Total current: 0\.545 A/)).toBeInTheDocument();

    const table = screen.getByRole('table');
    const r1Row = within(table).getByText('R1').closest('tr')!;
    expect(within(r1Row).getAllByRole('cell').map((c) => c.textContent)).toEqual([
      'R1',
      '10',
      '0.545',
      '5.45',
    ]);

    const r2Row = within(table).getByText('R2').closest('tr')!;
    expect(within(r2Row).getAllByRole('cell').map((c) => c.textContent)).toEqual([
      'R2',
      '20',
      '0.327',
      '6.55',
    ]);

    const r3Row = within(table).getByText('R3').closest('tr')!;
    expect(within(r3Row).getAllByRole('cell').map((c) => c.textContent)).toEqual([
      'R3',
      '30',
      '0.218',
      '6.55',
    ]);
  });

  it('renders an accessible SVG diagram with a summarising aria-label', async () => {
    mockFetchJson(NESTED_CIRCUIT);
    render(<CircuitSim src="circuits/nested.json" />);
    const diagram = await screen.findByRole('img', {
      name: 'Circuit diagram: R1 in series with R2 parallel R3',
    });
    expect(diagram.tagName.toLowerCase()).toBe('svg');
  });

  it('shows a retry card on fetch failure and retries on click', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => SERIES_CIRCUIT });
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    render(<CircuitSim src="circuits/series.json" />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Couldn’t load circuit');

    const { default: userEvent } = await import('@testing-library/user-event');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('table')).toBeInTheDocument();
  });

  it('shows an error card naming the exact problem on a malformed file (bad resistor reference / negative ohms / missing voltage)', async () => {
    mockFetchJson({
      circuit: { type: 'resistor', id: 'R1', ohms: -10 },
    });
    render(<CircuitSim src="circuits/bad.json" />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Invalid circuit data');
    expect(alert).toHaveTextContent('voltage: must be a positive number');
  });

  it('resolves relative src against moduleBaseUrl when lesson context is present', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200, json: async () => SERIES_CIRCUIT }));
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);
    render(withLesson(<CircuitSim src="circuits/series.json" />));
    await screen.findByRole('table');
    expect(fetchMock).toHaveBeenCalledWith('/content/modules/dt/circuits/series.json');
  });
});
