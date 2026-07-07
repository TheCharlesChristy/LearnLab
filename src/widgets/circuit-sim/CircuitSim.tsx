// `circuit-sim` implementation — simple analog DC circuits (SRS §5.3 row,
// D-024). Fetches a module-relative JSON file describing one voltage source
// plus resistors wired in a restricted series/parallel TREE (not an
// arbitrary graph — see the schema note below and docs/WIDGETS.md), computes
// total resistance/current plus per-resistor current & voltage via Ohm's law,
// and renders a small schematic-ish SVG diagram alongside a results table.
//
// SCOPE (deliberately small, per the design decision this widget pins):
// this is NOT a general SPICE-like circuit solver. It only understands pure
// series/parallel combinations of resistors against a single DC voltage
// source — exactly the class of circuit where "combined resistance" and
// "branch current/voltage" have one unambiguous closed-form answer, so the
// maths below is always exact (no matrix solve, no iteration).
//
// CIRCUIT JSON SCHEMA (recursive series/parallel tree):
//   {
//     "voltage": 12,
//     "circuit": {
//       "type": "series",
//       "elements": [
//         { "type": "resistor", "id": "R1", "ohms": 10 },
//         { "type": "parallel", "elements": [
//           { "type": "resistor", "id": "R2", "ohms": 20 },
//           { "type": "resistor", "id": "R3", "ohms": 30 }
//         ] }
//       ]
//     }
//   }
// `circuit` is a tree: a "series"/"parallel" node's `elements` array holds
// EITHER a `{type:"resistor", id, ohms}` leaf OR another nested
// "series"/"parallel" node — this is how "R1 in series with (R2 parallel
// R3)" is expressed. Resistor `id`s must be unique across the WHOLE tree;
// `ohms` and `voltage` must be positive finite numbers; at least one
// resistor must exist. All validated at runtime (lenient, like
// `logic-gate-sim`'s circuit validation): a bad file renders an inline error
// naming the exact problem, never a crash.
//
// COMPUTATION (standard circuit theory, see computeCombinedResistance /
// computeBranchResults below for the exact recursive algorithm):
//   - series combined resistance = sum of each element's combined resistance
//   - parallel combined resistance = 1 / sum(1/R_i)
//   - total current = voltage / (root's combined resistance)          [Ohm's law]
//   - walking the tree from the root carrying the current INTO each node:
//     series passes the same current to every child (current is constant in
//     series); parallel splits the incoming current across children in
//     inverse proportion to each child's own combined resistance (every
//     branch of a parallel group sees the same voltage = incomingCurrent *
//     thatGroup'sCombinedResistance, so branchCurrent = thatVoltage / R_i).
//   - at a resistor leaf: voltage_across = current_through * ohms.
//
// Failure handling (FR-CONT-007 / FR-WID-003 spirit), mirrors logic-gate-sim:
//   • network/HTTP failure     → retry card
//   • malformed JSON / bad shape → error card naming the exact problem
// The widget renders an inline card rather than throwing.

import { useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { LessonContext } from '../../content';

import type { CircuitSimProps } from './index';

export interface ResistorNode {
  type: 'resistor';
  id: string;
  ohms: number;
}

export interface SeriesNode {
  type: 'series';
  elements: CircuitNode[];
}

export interface ParallelNode {
  type: 'parallel';
  elements: CircuitNode[];
}

export type CircuitNode = ResistorNode | SeriesNode | ParallelNode;

export interface Circuit {
  voltage: number;
  circuit: CircuitNode;
}

export interface BranchResult {
  id: string;
  ohms: number;
  /** Amps flowing through this resistor. */
  current: number;
  /** Volts dropped across this resistor. */
  voltage: number;
}

/** True for URLs that must not be re-based: scheme:, protocol-relative, root-relative. */
function isAbsoluteUrl(src: string): boolean {
  return /^(?:[a-z][a-z\d+\-.]*:|\/)/i.test(src);
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

/**
 * Recursively validate one circuit-tree node, threading a shared `seenIds`
 * set through the whole tree to enforce global resistor-id uniqueness.
 * Throws an Error naming the offending part of the file on the first
 * problem found (surfaced verbatim on the error card) — same style as
 * logic-gate-sim's parseCircuit.
 */
function parseNode(value: unknown, path: string, seenIds: Set<string>): CircuitNode {
  if (typeof value !== 'object' || value === null) {
    throw new Error(`${path}: must be an object with a "type" field`);
  }
  const v = value as Record<string, unknown>;

  if (v.type === 'resistor') {
    if (typeof v.id !== 'string' || v.id.trim() === '') {
      throw new Error(`${path}.id: must be a non-empty string`);
    }
    if (seenIds.has(v.id)) {
      throw new Error(`${path}.id: duplicate resistor id "${v.id}" (ids must be unique across the whole circuit)`);
    }
    if (!isFiniteNumber(v.ohms) || v.ohms <= 0) {
      throw new Error(`${path}.ohms: must be a positive number (got ${JSON.stringify(v.ohms)})`);
    }
    seenIds.add(v.id);
    return { type: 'resistor', id: v.id, ohms: v.ohms };
  }

  if (v.type === 'series' || v.type === 'parallel') {
    if (!Array.isArray(v.elements) || v.elements.length === 0) {
      throw new Error(`${path}.elements: must be a non-empty array`);
    }
    const elements = v.elements.map((el, i) => parseNode(el, `${path}.elements[${i}]`, seenIds));
    return { type: v.type, elements };
  }

  throw new Error(`${path}.type: must be "resistor", "series", or "parallel" (got ${JSON.stringify(v.type)})`);
}

/**
 * Validate the fetched value into a Circuit, or throw an Error whose message
 * names the offending part of the file (surfaced verbatim on the error
 * card). Enforces: `voltage` positive finite number; `circuit` a valid
 * series/parallel/resistor tree; resistor ids unique across the whole tree;
 * at least one resistor present.
 */
export function parseCircuitFile(value: unknown): Circuit {
  if (typeof value !== 'object' || value === null) {
    throw new Error('file must be a JSON object with "voltage" and "circuit"');
  }
  const v = value as Record<string, unknown>;

  if (!isFiniteNumber(v.voltage) || v.voltage <= 0) {
    throw new Error(`voltage: must be a positive number (got ${JSON.stringify(v.voltage)})`);
  }

  const seenIds = new Set<string>();
  const circuit = parseNode(v.circuit, 'circuit', seenIds);
  if (seenIds.size === 0) {
    // Unreachable given parseNode's "non-empty elements" check bottoms out
    // in at least one resistor leaf, but kept as an explicit, clearly-worded
    // invariant per the task contract ("at least one resistor must exist").
    throw new Error('circuit: must contain at least one resistor');
  }

  return { voltage: v.voltage, circuit };
}

/**
 * Combined resistance of a node, recursively:
 *   - resistor leaf: its own ohms
 *   - series: sum of each element's combined resistance
 *   - parallel: 1 / sum(1 / element combined resistance)
 */
export function computeCombinedResistance(node: CircuitNode): number {
  if (node.type === 'resistor') return node.ohms;
  if (node.type === 'series') {
    return node.elements.reduce((sum, el) => sum + computeCombinedResistance(el), 0);
  }
  // parallel
  const reciprocalSum = node.elements.reduce((sum, el) => sum + 1 / computeCombinedResistance(el), 0);
  return 1 / reciprocalSum;
}

/**
 * Walk the tree from `node` carrying `incomingCurrent` (the current flowing
 * INTO this node as a whole) and return one BranchResult per resistor leaf
 * beneath it. Series children each see the full `incomingCurrent` (current
 * is constant along a series path); parallel children split it in inverse
 * proportion to their own combined resistance (equivalently: every branch
 * of a parallel group drops the same voltage, `incomingCurrent *
 * combinedResistanceOfThisGroup`, and each branch's current is that voltage
 * divided by the branch's own combined resistance).
 */
export function computeBranchResults(node: CircuitNode, incomingCurrent: number): BranchResult[] {
  if (node.type === 'resistor') {
    return [{ id: node.id, ohms: node.ohms, current: incomingCurrent, voltage: incomingCurrent * node.ohms }];
  }

  if (node.type === 'series') {
    return node.elements.flatMap((el) => computeBranchResults(el, incomingCurrent));
  }

  // parallel: voltage across the group is the same for every branch.
  const groupVoltage = incomingCurrent * computeCombinedResistance(node);
  return node.elements.flatMap((el) => {
    const branchResistance = computeCombinedResistance(el);
    const branchCurrent = groupVoltage / branchResistance;
    return computeBranchResults(el, branchCurrent);
  });
}

/** Human-readable structure summary for the diagram's aria-label, e.g. "R1 in series with R2 parallel R3". */
export function describeNode(node: CircuitNode): string {
  if (node.type === 'resistor') return node.id;
  if (node.type === 'series') return node.elements.map(describeNode).join(' in series with ');
  return node.elements.map(describeNode).join(' parallel ');
}

/** Format a number to `sig` significant figures, without ugly trailing zeros. */
export function formatSig(n: number, sig = 3): string {
  if (n === 0) return '0';
  return Number(n.toPrecision(sig)).toString();
}

type LoadState =
  | { status: 'loading' }
  | { status: 'fetch-error'; message: string }
  | { status: 'data-error'; message: string }
  | { status: 'ready'; data: Circuit };

export default function CircuitSim({ src }: CircuitSimProps) {
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
        console.error(`[circuit-sim] failed to load ${url}`, err);
        if (!cancelled) {
          setState({
            status: 'fetch-error',
            message: err instanceof Error ? err.message : String(err),
          });
        }
        return;
      }
      try {
        const data = parseCircuitFile(raw);
        if (!cancelled) setState({ status: 'ready', data });
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

  return <CircuitResults data={state.data} />;
}

function CircuitResults({ data }: { data: Circuit }) {
  const totalResistance = useMemo(() => computeCombinedResistance(data.circuit), [data]);
  const totalCurrent = data.voltage / totalResistance;
  const branches = useMemo(
    () => computeBranchResults(data.circuit, totalCurrent),
    [data, totalCurrent],
  );

  return (
    <section className="my-4 grid gap-4 rounded-lg border p-4 md:grid-cols-2" aria-label="Circuit simulator">
      <div>
        <h4 className="font-medium">Diagram</h4>
        <CircuitDiagram node={data.circuit} />
      </div>

      <div>
        <h4 className="font-medium">Results</h4>
        <p className="mt-2 text-sm">
          Total resistance: {formatSig(totalResistance)} Ω · Total current: {formatSig(totalCurrent)} A
        </p>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b px-2 py-1 text-left font-mono">Resistor</th>
                <th className="border-b px-2 py-1 text-left font-mono">Ω</th>
                <th className="border-b px-2 py-1 text-left font-mono">Current (A)</th>
                <th className="border-b px-2 py-1 text-left font-mono">Voltage (V)</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((b) => (
                <tr key={b.id}>
                  <td className="px-2 py-1 font-mono">{b.id}</td>
                  <td className="px-2 py-1 font-mono">{formatSig(b.ohms)}</td>
                  <td className="px-2 py-1 font-mono">{formatSig(b.current)}</td>
                  <td className="px-2 py-1 font-mono">{formatSig(b.voltage)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// --- Diagram -----------------------------------------------------------
//
// A modest schematic-ish SVG: resistor leaves are boxes; a "series" node
// lays its children left-to-right on a shared horizontal wire (drawn full-
// width behind the boxes, so it reads as a continuous wire through the
// gaps); a "parallel" node stacks its children top-to-bottom between a pair
// of vertical rails (so it reads as branches tied together at both ends).
// Every node exposes a `portY` — the y-coordinate (local to its own box)
// where its external left/right connections sit — so nodes compose
// uniformly regardless of nesting depth. Diagram polish is explicitly out
// of scope (see D-0xx note); correctness of the results table above is the
// priority. `role="img"` + a summarising `aria-label` describing the
// topology keeps this screen-reader friendly (NFR-A11Y-001), same
// convention as the `vector-field` widget's SVG.

const RESISTOR_W = 64;
const RESISTOR_H = 36;
const HGAP = 24;
const VGAP = 16;
const LEAD = 20;

interface NodeLayout {
  width: number;
  height: number;
  /** y-coordinate, local to this layout's own box, of its external ports. */
  portY: number;
  el: ReactNode;
}

function layoutNode(node: CircuitNode, key: string): NodeLayout {
  if (node.type === 'resistor') {
    const portY = RESISTOR_H / 2;
    return {
      width: RESISTOR_W,
      height: RESISTOR_H,
      portY,
      el: (
        <g key={key}>
          <rect
            x={0}
            y={0}
            width={RESISTOR_W}
            height={RESISTOR_H}
            rx={4}
            fill="none"
            stroke="currentColor"
          />
          <text x={RESISTOR_W / 2} y={RESISTOR_H / 2 - 3} textAnchor="middle" fontSize={11}>
            {node.id}
          </text>
          <text x={RESISTOR_W / 2} y={RESISTOR_H / 2 + 11} textAnchor="middle" fontSize={9} opacity={0.75}>
            {formatSig(node.ohms)}Ω
          </text>
        </g>
      ),
    };
  }

  const children = node.elements.map((el, i) => layoutNode(el, `${key}-${i}`));

  if (node.type === 'series') {
    const height = Math.max(...children.map((c) => c.height));
    const portY = height / 2;
    let x = 0;
    const placed = children.map((c) => {
      const y = portY - c.portY;
      const g = (
        <g key={`place-${x}`} transform={`translate(${x}, ${y})`}>
          {c.el}
        </g>
      );
      x += c.width + HGAP;
      return g;
    });
    const width = children.reduce((sum, c) => sum + c.width, 0) + HGAP * (children.length - 1);
    return {
      width,
      height,
      portY,
      el: (
        <g key={key}>
          <line x1={0} y1={portY} x2={width} y2={portY} stroke="currentColor" />
          {placed}
        </g>
      ),
    };
  }

  // parallel
  const width = Math.max(...children.map((c) => c.width));
  let y = 0;
  const childPortYs: number[] = [];
  const placed = children.map((c, i) => {
    const xOffset = (width - c.width) / 2;
    const globalPortY = y + c.portY;
    childPortYs.push(globalPortY);
    const connectors = (
      <g key={`connect-${i}`}>
        {xOffset > 0 && (
          <line x1={0} y1={globalPortY} x2={xOffset} y2={globalPortY} stroke="currentColor" />
        )}
        {xOffset + c.width < width && (
          <line
            x1={xOffset + c.width}
            y1={globalPortY}
            x2={width}
            y2={globalPortY}
            stroke="currentColor"
          />
        )}
      </g>
    );
    const g = (
      <g key={`place-${i}`}>
        {connectors}
        <g transform={`translate(${xOffset}, ${y})`}>{c.el}</g>
      </g>
    );
    y += c.height + VGAP;
    return g;
  });
  const height = y - VGAP;
  const firstPortY = childPortYs[0]!;
  const lastPortY = childPortYs[childPortYs.length - 1]!;
  const portY = (firstPortY + lastPortY) / 2;

  return {
    width,
    height,
    portY,
    el: (
      <g key={key}>
        <line x1={0} y1={firstPortY} x2={0} y2={lastPortY} stroke="currentColor" />
        <line x1={width} y1={firstPortY} x2={width} y2={lastPortY} stroke="currentColor" />
        {placed}
      </g>
    ),
  };
}

function CircuitDiagram({ node }: { node: CircuitNode }) {
  const layout = useMemo(() => layoutNode(node, 'root'), [node]);
  const label = `Circuit diagram: ${describeNode(node)}`;
  const totalWidth = layout.width + LEAD * 2;
  const totalHeight = layout.height;

  return (
    <div className="mt-2 overflow-x-auto">
      <svg
        role="img"
        aria-label={label}
        width={totalWidth}
        height={totalHeight}
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        className="text-gray-900"
      >
        <line x1={0} y1={layout.portY} x2={LEAD} y2={layout.portY} stroke="currentColor" />
        <line
          x1={LEAD + layout.width}
          y1={layout.portY}
          x2={totalWidth}
          y2={layout.portY}
          stroke="currentColor"
        />
        <circle cx={0} cy={layout.portY} r={2.5} fill="currentColor" />
        <circle cx={totalWidth} cy={layout.portY} r={2.5} fill="currentColor" />
        <g transform={`translate(${LEAD}, 0)`}>{layout.el}</g>
      </svg>
    </div>
  );
}
