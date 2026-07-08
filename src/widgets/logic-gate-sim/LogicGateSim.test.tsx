// Behaviour tests for the LogicGateSim implementation (SRS §5.3 row):
// gate evaluation (2-input AND, NOT, multi-gate NAND-equivalent, XOR built
// from AND/OR/NOT), live toggling, truth-table rendering + row highlight,
// malformed-file error cards naming the exact problem, retry card on fetch
// failure, relative src resolution via LessonContext, keyboard toggling.

import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);

import { LessonContext } from '../../content';
import type { LessonContextValue } from '../../content';

import { evaluateCircuit, parseCircuit } from './LogicGateSim';
import LogicGateSim from './LogicGateSim';

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

const AND_CIRCUIT = {
  inputs: ['A', 'B'],
  gates: [{ id: 'g1', type: 'AND', inputs: ['A', 'B'] }],
  outputs: ['g1'],
};

const NOT_CIRCUIT = {
  inputs: ['A'],
  gates: [{ id: 'g1', type: 'NOT', inputs: ['A'] }],
  outputs: ['g1'],
};

// AND then NOT == NAND-equivalent.
const NAND_EQUIV_CIRCUIT = {
  inputs: ['A', 'B'],
  gates: [
    { id: 'g1', type: 'AND', inputs: ['A', 'B'] },
    { id: 'g2', type: 'NOT', inputs: ['g1'] },
  ],
  outputs: ['g2'],
};

// Genuine XOR built from AND/OR/NOT: (A OR B) AND NOT(A AND B).
const XOR_FROM_PRIMITIVES = {
  inputs: ['A', 'B'],
  gates: [
    { id: 'orAB', type: 'OR', inputs: ['A', 'B'] },
    { id: 'andAB', type: 'AND', inputs: ['A', 'B'] },
    { id: 'notAndAB', type: 'NOT', inputs: ['andAB'] },
    { id: 'xor', type: 'AND', inputs: ['orAB', 'notAndAB'] },
  ],
  outputs: ['xor'],
};

describe('parseCircuit — accept', () => {
  it('parses a well-formed circuit', () => {
    expect(parseCircuit(AND_CIRCUIT)).toEqual({
      inputs: ['A', 'B'],
      gates: [{ id: 'g1', type: 'AND', inputs: ['A', 'B'] }],
      outputs: ['g1'],
    });
  });
});

describe('parseCircuit — reject (errors name the exact problem)', () => {
  it('rejects a non-object', () => {
    expect(() => parseCircuit(null)).toThrow(/must be a JSON object/);
    expect(() => parseCircuit('nope')).toThrow(/must be a JSON object/);
  });

  it('rejects empty inputs', () => {
    expect(() => parseCircuit({ inputs: [], gates: [{}], outputs: ['g1'] })).toThrow(
      /inputs: must be a non-empty array/,
    );
  });

  it('rejects empty gates', () => {
    expect(() => parseCircuit({ inputs: ['A'], gates: [], outputs: ['A'] })).toThrow(
      /gates: must be a non-empty array/,
    );
  });

  it('rejects empty outputs', () => {
    expect(() =>
      parseCircuit({
        inputs: ['A', 'B'],
        gates: [{ id: 'g1', type: 'AND', inputs: ['A', 'B'] }],
        outputs: [],
      }),
    ).toThrow(/outputs: must be a non-empty array/);
  });

  it('rejects a bad gate type (closed set)', () => {
    expect(() =>
      parseCircuit({
        inputs: ['A', 'B'],
        gates: [{ id: 'g1', type: 'MAYBE', inputs: ['A', 'B'] }],
        outputs: ['g1'],
      }),
    ).toThrow(/gates\[0\]\.type: must be one of AND, OR, NOT, XOR, NAND, NOR \(got "MAYBE"\)/);
  });

  it('rejects an unknown pin/gate reference', () => {
    expect(() =>
      parseCircuit({
        inputs: ['A', 'B'],
        gates: [{ id: 'g1', type: 'AND', inputs: ['A', 'x1'] }],
        outputs: ['g1'],
      }),
    ).toThrow(/gates\[0\]\.inputs\[1\]: references unknown pin\/gate "x1"/);
  });

  it('rejects a forward reference to a later gate id', () => {
    expect(() =>
      parseCircuit({
        inputs: ['A', 'B'],
        gates: [
          { id: 'g1', type: 'AND', inputs: ['A', 'g2'] },
          { id: 'g2', type: 'NOT', inputs: ['A'] },
        ],
        outputs: ['g1'],
      }),
    ).toThrow(/gates\[0\]\.inputs\[1\]: "g2" is declared later/);
  });

  it('rejects a self-reference', () => {
    expect(() =>
      parseCircuit({
        inputs: ['A', 'B'],
        gates: [{ id: 'g1', type: 'AND', inputs: ['A', 'g1'] }],
        outputs: ['g1'],
      }),
    ).toThrow(/gates\[0\]\.inputs\[1\]: gate "g1" cannot reference itself/);
  });

  it('rejects wrong arity (NOT with 2 inputs)', () => {
    expect(() =>
      parseCircuit({
        inputs: ['A', 'B'],
        gates: [{ id: 'g1', type: 'NOT', inputs: ['A', 'B'] }],
        outputs: ['g1'],
      }),
    ).toThrow(/gates\[0\]\.inputs: NOT requires exactly 1 input \(got 2\)/);
  });

  it('rejects wrong arity (AND with 1 input)', () => {
    expect(() =>
      parseCircuit({
        inputs: ['A', 'B'],
        gates: [{ id: 'g1', type: 'AND', inputs: ['A'] }],
        outputs: ['g1'],
      }),
    ).toThrow(/gates\[0\]\.inputs: AND requires exactly 2 inputs \(got 1\)/);
  });

  it('rejects an output referencing an unknown pin/gate', () => {
    expect(() =>
      parseCircuit({
        inputs: ['A', 'B'],
        gates: [{ id: 'g1', type: 'AND', inputs: ['A', 'B'] }],
        outputs: ['nope'],
      }),
    ).toThrow(/outputs\[0\]: references unknown pin\/gate "nope"/);
  });
});

describe('evaluateCircuit — gate logic', () => {
  it('evaluates a 2-input AND circuit for all 4 input combinations', () => {
    const circuit = parseCircuit(AND_CIRCUIT);
    expect(evaluateCircuit(circuit, { A: false, B: false }).g1).toBe(false);
    expect(evaluateCircuit(circuit, { A: false, B: true }).g1).toBe(false);
    expect(evaluateCircuit(circuit, { A: true, B: false }).g1).toBe(false);
    expect(evaluateCircuit(circuit, { A: true, B: true }).g1).toBe(true);
  });

  it('evaluates a NOT gate (1 input)', () => {
    const circuit = parseCircuit(NOT_CIRCUIT);
    expect(evaluateCircuit(circuit, { A: false }).g1).toBe(true);
    expect(evaluateCircuit(circuit, { A: true }).g1).toBe(false);
  });

  it('evaluates a multi-gate circuit: AND then NOT == NAND', () => {
    const circuit = parseCircuit(NAND_EQUIV_CIRCUIT);
    expect(evaluateCircuit(circuit, { A: false, B: false }).g2).toBe(true);
    expect(evaluateCircuit(circuit, { A: false, B: true }).g2).toBe(true);
    expect(evaluateCircuit(circuit, { A: true, B: false }).g2).toBe(true);
    expect(evaluateCircuit(circuit, { A: true, B: true }).g2).toBe(false);
  });

  it('evaluates a genuine XOR built from AND/OR/NOT primitives', () => {
    const circuit = parseCircuit(XOR_FROM_PRIMITIVES);
    expect(evaluateCircuit(circuit, { A: false, B: false }).xor).toBe(false);
    expect(evaluateCircuit(circuit, { A: false, B: true }).xor).toBe(true);
    expect(evaluateCircuit(circuit, { A: true, B: false }).xor).toBe(true);
    expect(evaluateCircuit(circuit, { A: true, B: true }).xor).toBe(false);
  });

  it('evaluates XOR/NAND/NOR gate primitives directly', () => {
    const xorCircuit = parseCircuit({
      inputs: ['A', 'B'],
      gates: [{ id: 'g1', type: 'XOR', inputs: ['A', 'B'] }],
      outputs: ['g1'],
    });
    expect(evaluateCircuit(xorCircuit, { A: true, B: false }).g1).toBe(true);
    expect(evaluateCircuit(xorCircuit, { A: true, B: true }).g1).toBe(false);

    const norCircuit = parseCircuit({
      inputs: ['A', 'B'],
      gates: [{ id: 'g1', type: 'NOR', inputs: ['A', 'B'] }],
      outputs: ['g1'],
    });
    expect(evaluateCircuit(norCircuit, { A: false, B: false }).g1).toBe(true);
    expect(evaluateCircuit(norCircuit, { A: true, B: false }).g1).toBe(false);
  });
});

describe('LogicGateSim component', () => {
  it('renders input toggles and gate/output values, updating live on click (no reload)', async () => {
    mockFetchJson(AND_CIRCUIT);
    render(<LogicGateSim src="circuits/and.json" />);

    const toggleA = await screen.findByRole('switch', { name: /A/ });
    const toggleB = screen.getByRole('switch', { name: /B/ });
    expect(toggleA).toHaveAttribute('aria-checked', 'false');
    expect(toggleB).toHaveAttribute('aria-checked', 'false');

    // Both false -> AND output false.
    expect(screen.getByText('g1: 0')).toBeInTheDocument();

    await userEvent.click(toggleA);
    await userEvent.click(toggleB);
    expect(toggleA).toHaveAttribute('aria-checked', 'true');
    expect(toggleB).toHaveAttribute('aria-checked', 'true');

    await waitFor(() => expect(screen.getByText('g1: 1')).toBeInTheDocument());
  });

  it('operates a toggle via the keyboard', async () => {
    mockFetchJson(NOT_CIRCUIT);
    render(<LogicGateSim src="circuits/not.json" />);

    const toggleA = await screen.findByRole('switch', { name: /A/ });
    // NOT(false) = true initially.
    expect(screen.getByText('g1: 1')).toBeInTheDocument();

    toggleA.focus();
    await userEvent.keyboard('{Enter}');
    expect(toggleA).toHaveAttribute('aria-checked', 'true');
    await waitFor(() => expect(screen.getByText('g1: 0')).toBeInTheDocument());
  });

  it('renders all 2^N truth-table rows with values matching live evaluation, and highlights the current row', async () => {
    mockFetchJson(AND_CIRCUIT);
    render(<LogicGateSim src="circuits/and.json" />);

    const toggleA = await screen.findByRole('switch', { name: /A/ });
    const table = screen.getByRole('table');
    const rows = within(table).getAllByRole('row');
    // header + 4 data rows for 2 inputs.
    expect(rows).toHaveLength(5);

    // Row order = binary counting on [A, B]: 00, 01, 10, 11.
    const [row00, row01, row10, row11] = rows.slice(1) as [
      HTMLElement,
      HTMLElement,
      HTMLElement,
      HTMLElement,
    ];
    expect(within(row00).getAllByRole('cell').map((c) => c.textContent)).toEqual([
      '0',
      '0',
      '0',
    ]);
    expect(within(row01).getAllByRole('cell').map((c) => c.textContent)).toEqual([
      '0',
      '1',
      '0',
    ]);
    expect(within(row10).getAllByRole('cell').map((c) => c.textContent)).toEqual([
      '1',
      '0',
      '0',
    ]);
    expect(within(row11).getAllByRole('cell').map((c) => c.textContent)).toEqual([
      '1',
      '1',
      '1',
    ]);

    // Initially A=0,B=0 is the live state -> first data row highlighted.
    expect(row00).toHaveAttribute('aria-current', 'true');
    expect(row01).not.toHaveAttribute('aria-current');

    // Toggle A -> live state becomes A=1,B=0 -> third data row highlighted.
    await userEvent.click(toggleA);
    await waitFor(() => expect(row10).toHaveAttribute('aria-current', 'true'));
    expect(row00).not.toHaveAttribute('aria-current');
  });

  it('shows a message instead of a huge table beyond 6 inputs', async () => {
    const bigCircuit = {
      inputs: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
      gates: [{ id: 'g1', type: 'AND', inputs: ['A', 'B'] }],
      outputs: ['g1'],
    };
    mockFetchJson(bigCircuit);
    render(<LogicGateSim src="circuits/big.json" />);
    await screen.findByText(/Truth table hidden/);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('resolves relative src against moduleBaseUrl when lesson context is present', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200, json: async () => AND_CIRCUIT }));
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);
    render(withLesson(<LogicGateSim src="circuits/and.json" />));
    await screen.findByRole('switch', { name: /A/ });
    expect(fetchMock).toHaveBeenCalledWith('/content/modules/dt/circuits/and.json');
  });

  it('shows a retry card on fetch failure and retries on click', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => AND_CIRCUIT });
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    render(<LogicGateSim src="circuits/and.json" />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Couldn’t load circuit');

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('switch', { name: /A/ })).toBeInTheDocument();
  });

  it('shows an error card naming the exact problem on a malformed file', async () => {
    mockFetchJson({
      inputs: ['A', 'B'],
      gates: [{ id: 'g1', type: 'AND', inputs: ['A', 'x1'] }],
      outputs: ['g1'],
    });
    render(<LogicGateSim src="circuits/bad.json" />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Invalid circuit data');
    expect(alert).toHaveTextContent('gates[0].inputs[1]: references unknown pin/gate "x1"');
  });
});
