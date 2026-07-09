// SVG function plotter — SRS §5.3 `function-grapher` row.
// Expressions are parsed with a mathjs *subset* built via the factory API
// (`create` + explicit dependencies) so the lazy chunk stays small
// (NFR-PERF-001) and nothing is ever eval'd (NFR-SEC-002).
// Tangent point is a focusable role="slider", draggable by pointer and
// movable with arrow keys; gradient readout lives in an aria-live region
// (NFR-A11Y-001).

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';

import {
  absDependencies,
  acosDependencies,
  addDependencies,
  asinDependencies,
  atan2Dependencies,
  atanDependencies,
  cbrtDependencies,
  ceilDependencies,
  compileDependencies,
  cosDependencies,
  coshDependencies,
  create,
  divideDependencies,
  eDependencies,
  expDependencies,
  factorialDependencies,
  floorDependencies,
  gammaDependencies,
  log10Dependencies,
  log2Dependencies,
  logDependencies,
  maxDependencies,
  minDependencies,
  modDependencies,
  multiplyDependencies,
  piDependencies,
  powDependencies,
  roundDependencies,
  signDependencies,
  sinDependencies,
  sinhDependencies,
  sqrtDependencies,
  subtractDependencies,
  tanDependencies,
  tanhDependencies,
  tauDependencies,
  unaryMinusDependencies,
  unaryPlusDependencies,
} from 'mathjs/number';
import type { EvalFunction, FactoryFunctionMap } from 'mathjs/number';

import type { FunctionGrapherProps } from './index';

// Number-only mathjs instance: expression compiler + the operators,
// functions and constants lesson authors actually need. No eval, no
// Function constructor (NFR-SEC-002), no BigNumber/Complex/Matrix weight.
// (mathjs types each dependency map as possibly-undefined under
// noUncheckedIndexedAccess, hence the narrowing collect loop.)
const dependencySets = [
  compileDependencies,
  addDependencies,
  subtractDependencies,
  multiplyDependencies,
  divideDependencies,
  powDependencies,
  modDependencies,
  unaryMinusDependencies,
  unaryPlusDependencies,
  absDependencies,
  sqrtDependencies,
  cbrtDependencies,
  expDependencies,
  logDependencies,
  log10Dependencies,
  log2Dependencies,
  sinDependencies,
  cosDependencies,
  tanDependencies,
  asinDependencies,
  acosDependencies,
  atanDependencies,
  atan2Dependencies,
  sinhDependencies,
  coshDependencies,
  tanhDependencies,
  floorDependencies,
  ceilDependencies,
  roundDependencies,
  signDependencies,
  minDependencies,
  maxDependencies,
  gammaDependencies,
  factorialDependencies,
  piDependencies,
  eDependencies,
  tauDependencies,
];
const factories: FactoryFunctionMap = {};
dependencySets.forEach((dep, i) => {
  if (dep) factories[`dep${i}`] = dep;
});
const math = create(factories);

const WIDTH = 640;
const HEIGHT = 320; // SRS §5.3: height 320, responsive width
const MARGIN = { top: 12, right: 12, bottom: 26, left: 48 };
const INNER_W = WIDTH - MARGIN.left - MARGIN.right;
const INNER_H = HEIGHT - MARGIN.top - MARGIN.bottom;
const SAMPLE_COUNT = 200;

interface PlotModel {
  /** Evaluate f(x); null when evaluation throws or yields a non-number. */
  f: (x: number) => number | null;
  /** Sampled curve points; null entries are gaps (non-finite values / asymptotes). */
  points: ({ x: number; y: number } | null)[];
  yDomain: [number, number];
}

function buildModel(
  expr: string,
  xmin: number,
  xmax: number,
  ymin: number | undefined,
  ymax: number | undefined,
): PlotModel | null {
  let code: EvalFunction;
  try {
    code = math.compile(expr);
  } catch {
    return null; // bad expr → error card
  }

  let sawNumber = false;
  const f = (x: number): number | null => {
    let value: unknown;
    try {
      value = code.evaluate({ x });
    } catch {
      return null;
    }
    if (typeof value !== 'number') return null;
    sawNumber = true;
    return value;
  };

  const points: ({ x: number; y: number } | null)[] = [];
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i <= SAMPLE_COUNT; i++) {
    const x = xmin + ((xmax - xmin) * i) / SAMPLE_COUNT;
    const y = f(x);
    if (y !== null && Number.isFinite(y)) {
      points.push({ x, y });
      if (y < lo) lo = y;
      if (y > hi) hi = y;
    } else {
      points.push(null); // break the path (asymptote handling)
    }
  }

  // Compile succeeded but no sample ever evaluated to a number → error card.
  if (!sawNumber) return null;

  let yLo = ymin;
  let yHi = ymax;
  if (yLo === undefined || yHi === undefined) {
    if (lo > hi) {
      lo = -10;
      hi = 10;
    } else if (lo === hi) {
      lo -= 1;
      hi += 1;
    }
    const pad = (hi - lo) * 0.08;
    yLo = yLo ?? lo - pad;
    yHi = yHi ?? hi + pad;
    if (yLo >= yHi) {
      const mid = (yLo + yHi) / 2;
      yLo = mid - 1;
      yHi = mid + 1;
    }
  }
  return { f, points, yDomain: [yLo, yHi] };
}

/** "Nice" tick positions covering [min, max]. */
function ticks(min: number, max: number, target = 8): number[] {
  if (!(max > min)) return [];
  const raw = (max - min) / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = mag * (norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10);
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-9; v += step) {
    out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
  }
  return out;
}

function fmt(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  if (value !== 0 && (Math.abs(value) >= 1e5 || Math.abs(value) < 1e-4)) {
    return value.toExponential(2);
  }
  return Number(value.toPrecision(4)).toString();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export default function FunctionGrapher({
  expr,
  xmin,
  xmax,
  ymin,
  ymax,
  tangent,
  grid,
  onTangentChange,
}: FunctionGrapherProps) {
  const clipId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const draggingRef = useRef(false);
  const [tangentX, setTangentX] = useState(() => (xmin + xmax) / 2);
  const [pointFocused, setPointFocused] = useState(false);

  const model = useMemo(
    () => buildModel(expr, xmin, xmax, ymin, ymax),
    [expr, xmin, xmax, ymin, ymax],
  );

  // Live gradient at the tangent point, computed before the early-return so
  // the onTangentChange effect below runs unconditionally (rules-of-hooks).
  // The render logic further down recomputes the same value from `model`
  // (one central-difference, cheap) — keeping this hook self-contained beats
  // threading a value through the early-return branch.
  const liveTx = clamp(tangentX, xmin, xmax);
  const liveGradient = useMemo(() => {
    if (!model || !tangent) return null;
    const h = (xmax - xmin) / 2000;
    const ya = model.f(liveTx - h);
    const yb = model.f(liveTx + h);
    if (ya === null || yb === null || !Number.isFinite(ya) || !Number.isFinite(yb)) return null;
    const g = (yb - ya) / (2 * h);
    return Number.isFinite(g) ? g : null;
  }, [model, tangent, liveTx, xmin, xmax]);

  useEffect(() => {
    if (tangent) onTangentChange?.({ x: liveTx, gradient: liveGradient });
  }, [liveTx, liveGradient, tangent, onTangentChange]);

  if (!model) {
    // Inline error card naming the expression (SRS §5.3, FR-WID-003 style).
    return (
      <div
        role="alert"
        className="my-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900"
      >
        <strong>function-grapher:</strong> could not plot the expression{' '}
        <code className="font-mono">{expr}</code>. Check that it is a valid formula in{' '}
        <code className="font-mono">x</code>, e.g. <code className="font-mono">x^2</code>.
      </div>
    );
  }

  const { f, points, yDomain } = model;
  const [yLo, yHi] = yDomain;
  const sx = (x: number) => MARGIN.left + ((x - xmin) / (xmax - xmin)) * INNER_W;
  const sy = (y: number) => MARGIN.top + ((yHi - y) / (yHi - yLo)) * INNER_H;

  let curvePath = '';
  let penDown = false;
  for (const p of points) {
    if (!p) {
      penDown = false;
      continue;
    }
    curvePath += `${penDown ? 'L' : 'M'}${sx(p.x).toFixed(2)} ${sy(p.y).toFixed(2)}`;
    penDown = true;
  }

  // ---- tangent ----
  const tx = clamp(tangentX, xmin, xmax);
  const ty = tangent ? f(tx) : null;
  const h = (xmax - xmin) / 2000;
  let gradient: number | null = null;
  if (tangent) {
    const ya = f(tx - h);
    const yb = f(tx + h);
    if (ya !== null && yb !== null && Number.isFinite(ya) && Number.isFinite(yb)) {
      const g = (yb - ya) / (2 * h); // central difference
      gradient = Number.isFinite(g) ? g : null;
    }
  }
  const pointVisible = tangent && ty !== null && Number.isFinite(ty);

  const xFromClientX = (clientX: number): number | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (rect.width <= 0) return null;
    const px = ((clientX - rect.left) / rect.width) * WIDTH;
    return xmin + ((px - MARGIN.left) / INNER_W) * (xmax - xmin);
  };

  const onPointerDown = (e: PointerEvent<SVGGElement>) => {
    draggingRef.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // jsdom / older browsers: dragging still works while the pointer stays over the element
    }
  };
  const onPointerMove = (e: PointerEvent<SVGGElement>) => {
    if (!draggingRef.current) return;
    const x = xFromClientX(e.clientX);
    if (x !== null) setTangentX(clamp(x, xmin, xmax));
  };
  const onPointerEnd = () => {
    draggingRef.current = false;
  };

  const onKeyDown = (e: KeyboardEvent<SVGGElement>) => {
    const step = (xmax - xmin) / 50;
    let next: number | null = null;
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        next = tx - step;
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        next = tx + step;
        break;
      case 'PageDown':
        next = tx - step * 5;
        break;
      case 'PageUp':
        next = tx + step * 5;
        break;
      case 'Home':
        next = xmin;
        break;
      case 'End':
        next = xmax;
        break;
      default:
        return;
    }
    e.preventDefault();
    setTangentX(clamp(next, xmin, xmax));
  };

  const xTicks = grid ? ticks(xmin, xmax, 8) : [];
  const yTicks = grid ? ticks(yLo, yHi, 6) : [];

  const gradientText =
    gradient !== null
      ? `Tangent at x = ${fmt(tx)}: gradient ≈ ${fmt(gradient)}`
      : `Tangent at x = ${fmt(tx)}: gradient undefined`;

  // Tangent line endpoints (clipped to the plot area via clipPath).
  let tangentLine: { x1: number; y1: number; x2: number; y2: number } | null = null;
  if (pointVisible && gradient !== null && ty !== null) {
    tangentLine = {
      x1: sx(xmin),
      y1: sy(ty + gradient * (xmin - tx)),
      x2: sx(xmax),
      y2: sy(ty + gradient * (xmax - tx)),
    };
  }

  return (
    <div className="my-4">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="block w-full rounded border border-zinc-300 bg-white"
        style={{ height: HEIGHT }}
        role={tangent ? 'group' : 'img'}
        aria-label={`Graph of y = ${expr}`}
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={MARGIN.left} y={MARGIN.top} width={INNER_W} height={INNER_H} />
          </clipPath>
        </defs>

        {grid && (
          <g data-testid="fg-grid" aria-hidden="true">
            {xTicks.map((t) => (
              <line
                key={`x${t}`}
                x1={sx(t)}
                y1={MARGIN.top}
                x2={sx(t)}
                y2={MARGIN.top + INNER_H}
                stroke={t === 0 ? '#52525b' : '#e4e4e7'}
                strokeWidth={t === 0 ? 1.5 : 1}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {yTicks.map((t) => (
              <line
                key={`y${t}`}
                x1={MARGIN.left}
                y1={sy(t)}
                x2={MARGIN.left + INNER_W}
                y2={sy(t)}
                stroke={t === 0 ? '#52525b' : '#e4e4e7'}
                strokeWidth={t === 0 ? 1.5 : 1}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {xTicks.map((t) => (
              <text
                key={`xl${t}`}
                x={sx(t)}
                y={HEIGHT - MARGIN.bottom + 16}
                textAnchor="middle"
                fontSize={11}
                fill="#3f3f46"
              >
                {fmt(t)}
              </text>
            ))}
            {yTicks.map((t) => (
              <text
                key={`yl${t}`}
                x={MARGIN.left - 6}
                y={sy(t) + 4}
                textAnchor="end"
                fontSize={11}
                fill="#3f3f46"
              >
                {fmt(t)}
              </text>
            ))}
          </g>
        )}

        <path
          data-testid="fg-curve"
          d={curvePath}
          fill="none"
          stroke="#1d4ed8"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
          clipPath={`url(#${clipId})`}
        />

        {tangentLine && (
          <line
            data-testid="fg-tangent-line"
            x1={tangentLine.x1}
            y1={tangentLine.y1}
            x2={tangentLine.x2}
            y2={tangentLine.y2}
            stroke="#b91c1c"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
            clipPath={`url(#${clipId})`}
            aria-hidden="true"
          />
        )}

        {pointVisible && ty !== null && (
          <g
            data-testid="fg-tangent-point"
            role="slider"
            tabIndex={0}
            aria-label="Tangent point"
            aria-orientation="horizontal"
            aria-valuemin={xmin}
            aria-valuemax={xmax}
            aria-valuenow={Number(tx.toFixed(3))}
            aria-valuetext={gradientText}
            onKeyDown={onKeyDown}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
            onFocus={() => setPointFocused(true)}
            onBlur={() => setPointFocused(false)}
            style={{ cursor: 'ew-resize', outline: 'none' }}
          >
            {pointFocused && (
              // Visible focus ring (NFR-A11Y-001)
              <circle
                data-testid="fg-focus-ring"
                cx={sx(tx)}
                cy={sy(clamp(ty, yLo, yHi))}
                r={11}
                fill="none"
                stroke="#1d4ed8"
                strokeWidth={2}
              />
            )}
            <circle
              cx={sx(tx)}
              cy={sy(clamp(ty, yLo, yHi))}
              r={7}
              fill="#b91c1c"
              stroke="#ffffff"
              strokeWidth={2}
            />
          </g>
        )}
      </svg>

      {tangent && (
        <p aria-live="polite" className="mt-1 text-sm text-zinc-700" data-testid="fg-readout">
          {gradientText}
        </p>
      )}
    </div>
  );
}
