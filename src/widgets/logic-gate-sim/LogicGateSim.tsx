// `logic-gate-sim` implementation — interactive boolean circuits (SRS §5.3 row).
//
// Fetches a module-relative JSON file describing a circuit — pin names,
// gates, and declared outputs (D-013 pinned schema, see index.test.ts /
// docs draft) — and renders toggleable input buttons, live gate/output
// values, and a truth-table side panel.
//
// Gate set is closed: AND, OR, NOT, XOR, NAND, NOR (NFR-SEC-002 spirit — no
// eval/new Function; every gate is plain boolean JS). A gate's `inputs`
// array may only reference input pins or EARLIER gate ids (array order =
// evaluation order), which makes the circuit acyclic by construction: a
// single forward pass over `gates` in file order can evaluate every value
// with no graph/cycle algorithm needed. Self- and forward-references are
// caught as malformed-file errors at load time (§ below), not silently
// tolerated.
//
// Failure handling (FR-CONT-007 / FR-WID-003 spirit):
//   • network/HTTP failure  → retry card
//   • malformed JSON / bad shape → error card naming the exact problem
// The widget renders an inline card rather than throwing.

import { useContext, useEffect, useMemo, useState } from 'react';

import { LessonContext } from '../../content';

import type { LogicGateSimProps } from './index';

export const GATE_TYPES = ['AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR'] as const;
export type GateType = (typeof GATE_TYPES)[number];

interface Gate {
  id: string;
  type: GateType;
  /** References to input pin names or earlier gate ids, in evaluation order. */
  inputs: string[];
}

export interface Circuit {
  inputs: string[];
  gates: Gate[];
  outputs: string[];
}

/** True for URLs that must not be re-based: scheme:, protocol-relative, root-relative. */
function isAbsoluteUrl(src: string): boolean {
  return /^(?:[a-z][a-z\d+\-.]*:|\/)/i.test(src);
}

const MAX_TRUTH_TABLE_INPUTS = 6;

/**
 * Evaluate a single gate given already-resolved input values. `inputs` has
 * exactly 1 element for NOT and exactly 2 for the rest — enforced by the
 * arity check in parseCircuit, so the non-null assertions below are safe.
 */
function evalGate(type: GateType, inputs: boolean[]): boolean {
  const a = inputs[0]!;
  const b = inputs[1]!;
  switch (type) {
    case 'AND':
      return a && b;
    case 'OR':
      return a || b;
    case 'NOT':
      return !a;
    case 'XOR':
      return a !== b;
    case 'NAND':
      return !(a && b);
    case 'NOR':
      return !(a || b);
  }
}

/**
 * Validate the fetched value into a Circuit, or throw an Error whose message
 * names the offending part of the file (surfaced verbatim on the error card).
 * Also performs the forward-reference/self-reference/unknown-reference and
 * arity checks that make later evaluation total (never throws at click time).
 */
export function parseCircuit(value: unknown): Circuit {
  if (typeof value !== 'object' || value === null) {
    throw new Error('file must be a JSON object with "inputs", "gates" and "outputs"');
  }
  const v = value as Record<string, unknown>;

  if (!Array.isArray(v.inputs) || v.inputs.length === 0) {
    throw new Error('inputs: must be a non-empty array of pin name strings');
  }
  const inputs: string[] = v.inputs.map((name, i) => {
    if (typeof name !== 'string' || name.trim() === '') {
      throw new Error(`inputs[${i}]: must be a non-empty string`);
    }
    return name;
  });
  const inputSet = new Set(inputs);
  if (inputSet.size !== inputs.length) {
    throw new Error('inputs: pin names must be unique');
  }

  if (!Array.isArray(v.gates) || v.gates.length === 0) {
    throw new Error('gates: must be a non-empty array');
  }
  const rawGates: unknown[] = v.gates;

  const knownIds = new Set<string>(inputs);
  const gates: Gate[] = rawGates.map((rawGate, i) => {
    if (typeof rawGate !== 'object' || rawGate === null) {
      throw new Error(`gates[${i}]: must be an object { id, type, inputs }`);
    }
    const g = rawGate as Record<string, unknown>;

    if (typeof g.id !== 'string' || g.id.trim() === '') {
      throw new Error(`gates[${i}].id: must be a non-empty string`);
    }
    if (inputSet.has(g.id)) {
      throw new Error(`gates[${i}].id: "${g.id}" collides with an input pin name`);
    }
    if (knownIds.has(g.id)) {
      throw new Error(`gates[${i}].id: duplicate gate id "${g.id}"`);
    }

    if (
      typeof g.type !== 'string' ||
      !(GATE_TYPES as readonly string[]).includes(g.type)
    ) {
      throw new Error(
        `gates[${i}].type: must be one of ${GATE_TYPES.join(', ')} (got ${JSON.stringify(g.type)})`,
      );
    }
    const type = g.type as GateType;

    if (!Array.isArray(g.inputs) || g.inputs.length === 0) {
      throw new Error(`gates[${i}].inputs: must be a non-empty array of pin/gate references`);
    }
    const expectedArity = type === 'NOT' ? 1 : 2;
    if (g.inputs.length !== expectedArity) {
      throw new Error(
        `gates[${i}].inputs: ${type} requires exactly ${expectedArity} input${expectedArity === 1 ? '' : 's'} (got ${g.inputs.length})`,
      );
    }

    const gateInputs = g.inputs.map((ref, j) => {
      if (typeof ref !== 'string' || ref.trim() === '') {
        throw new Error(`gates[${i}].inputs[${j}]: must be a non-empty string`);
      }
      if (ref === g.id) {
        throw new Error(`gates[${i}].inputs[${j}]: gate "${g.id}" cannot reference itself`);
      }
      if (!knownIds.has(ref)) {
        // Either unknown entirely, or a forward reference to a gate that
        // hasn't been declared yet — both are malformed-file errors, since
        // array order = evaluation order (acyclic by construction).
        const isLaterGate = rawGates.some(
          (later) =>
            typeof later === 'object' &&
            later !== null &&
            (later as Record<string, unknown>).id === ref,
        );
        if (isLaterGate) {
          throw new Error(
            `gates[${i}].inputs[${j}]: "${ref}" is declared later — gates may only reference input pins or EARLIER gate ids`,
          );
        }
        throw new Error(`gates[${i}].inputs[${j}]: references unknown pin/gate "${ref}"`);
      }
      return ref;
    });

    knownIds.add(g.id);
    return { id: g.id, type, inputs: gateInputs };
  });

  if (!Array.isArray(v.outputs) || v.outputs.length === 0) {
    throw new Error('outputs: must be a non-empty array of gate ids or input names');
  }
  const outputs: string[] = v.outputs.map((ref, i) => {
    if (typeof ref !== 'string' || ref.trim() === '') {
      throw new Error(`outputs[${i}]: must be a non-empty string`);
    }
    if (!knownIds.has(ref)) {
      throw new Error(`outputs[${i}]: references unknown pin/gate "${ref}"`);
    }
    return ref;
  });

  return { inputs, gates, outputs };
}

/**
 * Evaluate every pin/gate value given current input states. Single forward
 * pass — the circuit is acyclic by construction (validated at parse time).
 */
export function evaluateCircuit(
  circuit: Circuit,
  inputValues: Record<string, boolean>,
): Record<string, boolean> {
  const values: Record<string, boolean> = { ...inputValues };
  for (const gate of circuit.gates) {
    // Every ref is a validated input name or earlier gate id (parseCircuit),
    // so it is always already present in `values` — the `?? false` fallback
    // is unreachable and exists only to satisfy noUncheckedIndexedAccess.
    const args = gate.inputs.map((ref) => values[ref] ?? false);
    values[gate.id] = evalGate(gate.type, args);
  }
  return values;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'fetch-error'; message: string }
  | { status: 'data-error'; message: string }
  | { status: 'ready'; circuit: Circuit };

export default function LogicGateSim({ src }: LogicGateSimProps) {
  const ctx = useContext(LessonContext); // optional: null outside lesson routes
  const url =
    ctx && !isAbsoluteUrl(src) ? `${ctx.moduleBaseUrl}${src.replace(/^\.\//, '')}` : src;

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    void (async () => {
      let raw: unknown;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        raw = await res.json();
      } catch (err) {
        console.error(`[logic-gate-sim] failed to load ${url}`, err);
        if (!cancelled) {
          setState({
            status: 'fetch-error',
            message: err instanceof Error ? err.message : String(err),
          });
        }
        return;
      }
      try {
        const circuit = parseCircuit(raw);
        if (!cancelled) setState({ status: 'ready', circuit });
      } catch (err) {
        if (!cancelled) {
          setState({
            status: 'data-error',
            message: err instanceof Error ? err.message : String(err),
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url, reloadToken]);

  if (state.status === 'loading') {
    return (
      <div role="status" className="my-4 rounded-lg border p-4 text-sm opacity-80">
        Loading circuit…
      </div>
    );
  }

  if (state.status === 'fetch-error') {
    return (
      <div role="alert" className="my-4 rounded-lg border border-red-300 p-4">
        <p className="font-medium">Couldn’t load circuit</p>
        <p className="mt-1 text-sm opacity-80">
          {src}: {state.message}
        </p>
        <button
          type="button"
          onClick={() => setReloadToken((t) => t + 1)}
          className="mt-2 rounded bg-blue-600 px-3 py-1 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (state.status === 'data-error') {
    return (
      <div role="alert" className="my-4 rounded-lg border border-red-300 p-4">
        <p className="font-medium">Invalid circuit data</p>
        <p className="mt-1 text-sm opacity-80">
          {src}: {state.message}
        </p>
      </div>
    );
  }

  return <CircuitSim circuit={state.circuit} />;
}

function bitLabel(v: boolean): string {
  return v ? '1' : '0';
}

function CircuitSim({ circuit }: { circuit: Circuit }) {
  const [inputValues, setInputValues] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(circuit.inputs.map((name) => [name, false])),
  );

  function toggle(name: string) {
    setInputValues((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  const values = useMemo(() => evaluateCircuit(circuit, inputValues), [circuit, inputValues]);

  return (
    <section className="my-4 grid gap-4 rounded-lg border p-4 md:grid-cols-2" aria-label="Logic gate simulator">
      <div>
        <h4 className="font-medium">Inputs</h4>
        <div className="mt-2 flex flex-wrap gap-2">
          {circuit.inputs.map((name) => {
            const on = inputValues[name] ?? false;
            return (
              <button
                key={name}
                type="button"
                role="switch"
                aria-checked={on}
                onClick={() => toggle(name)}
                className={`rounded border px-3 py-1.5 font-mono text-sm transition-colors motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                  on ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                }`}
              >
                {name}: {bitLabel(on)}
              </button>
            );
          })}
        </div>

        <h4 className="mt-4 font-medium">Gates</h4>
        <ul className="mt-2 space-y-1 text-sm">
          {circuit.gates.map((gate) => (
            <li key={gate.id} className="flex items-center gap-2 font-mono">
              <span
                className={`inline-block w-14 rounded border px-2 py-0.5 text-center ${
                  values[gate.id] ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-900'
                }`}
              >
                {bitLabel(values[gate.id] ?? false)}
              </span>
              <span>
                {gate.id} = {gate.type}({gate.inputs.join(', ')})
              </span>
            </li>
          ))}
        </ul>

        <h4 className="mt-4 font-medium">Outputs</h4>
        <ul className="mt-2 flex flex-wrap gap-2 text-sm">
          {circuit.outputs.map((ref) => (
            <li
              key={ref}
              className={`rounded border px-3 py-1.5 font-mono ${
                values[ref] ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-900'
              }`}
            >
              {ref}: {bitLabel(values[ref] ?? false)}
            </li>
          ))}
        </ul>
      </div>

      <TruthTable circuit={circuit} liveInputs={inputValues} />
    </section>
  );
}

function TruthTable({
  circuit,
  liveInputs,
}: {
  circuit: Circuit;
  liveInputs: Record<string, boolean>;
}) {
  const n = circuit.inputs.length;

  if (n > MAX_TRUTH_TABLE_INPUTS) {
    return (
      <div>
        <h4 className="font-medium">Truth table</h4>
        <p className="mt-2 text-sm opacity-80">
          Truth table hidden: {n} inputs would require 2^{n} rows (more than{' '}
          {MAX_TRUTH_TABLE_INPUTS}).
        </p>
      </div>
    );
  }

  const rowCount = 2 ** n;
  // Row order = standard binary counting over the `inputs` array order: the
  // input at index 0 is the most-significant bit, so for inputs [A, B] the
  // rows go A=0,B=0 / A=0,B=1 / A=1,B=0 / A=1,B=1.
  const rows = Array.from({ length: rowCount }, (_, rowIndex) => {
    const rowInputs: Record<string, boolean> = {};
    circuit.inputs.forEach((name, bitPos) => {
      const bit = (rowIndex >> (n - 1 - bitPos)) & 1;
      rowInputs[name] = bit === 1;
    });
    const rowValues = evaluateCircuit(circuit, rowInputs);
    const isCurrent = circuit.inputs.every((name) => rowInputs[name] === liveInputs[name]);
    return { rowIndex, rowInputs, rowValues, isCurrent };
  });

  return (
    <div>
      <h4 className="font-medium">Truth table</h4>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {circuit.inputs.map((name) => (
                <th key={name} className="border-b px-2 py-1 text-left font-mono">
                  {name}
                </th>
              ))}
              {circuit.outputs.map((ref) => (
                <th key={ref} className="border-b px-2 py-1 text-left font-mono">
                  {ref}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ rowIndex, rowInputs, rowValues, isCurrent }) => (
              <tr
                key={rowIndex}
                aria-current={isCurrent ? 'true' : undefined}
                className={isCurrent ? 'bg-blue-100 font-semibold' : undefined}
              >
                {circuit.inputs.map((name) => (
                  <td key={name} className="px-2 py-1 font-mono">
                    {bitLabel(rowInputs[name] ?? false)}
                  </td>
                ))}
                {circuit.outputs.map((ref) => (
                  <td key={ref} className="px-2 py-1 font-mono">
                    {bitLabel(rowValues[ref] ?? false)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
