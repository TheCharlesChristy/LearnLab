// SVG vector-field plotter — SRS §5.3 roadmap row / BUILD_PLAN.md D-024.
// Expressions are parsed with a mathjs *subset* built via the factory API
// (`create` + explicit dependencies), the same approach as `function-grapher`,
// so the lazy chunk stays small (NFR-PERF-001) and nothing is ever eval'd
// (NFR-SEC-002). Every widget keeps its own self-contained mathjs instance —
// widgets are import-isolated (SRS §3.5) and each is its own lazy chunk.

import { useMemo } from 'react';

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

import type { VectorFieldProps } from './index';

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

const SIZE = 480; // SRS: "sized reasonably e.g. 480x480 viewBox"
const MARGIN = 16;
const ARROW_HEAD_LEN = 5; // screen px
const ARROW_HEAD_ANGLE = Math.PI / 7;
const DOT_RADIUS = 2.5; // screen px, for critical points (fx=fy=0)
const ZERO_EPS = 1e-9;

interface FieldModel {
  fx: EvalFunction;
  fy: EvalFunction;
}

/** Compile both component expressions; null if either fails to compile (bad syntax). */
function compileField(fxExpr: string, fyExpr: string): FieldModel | null {
  try {
    const fx = math.compile(fxExpr);
    const fy = math.compile(fyExpr);
    return { fx, fy };
  } catch {
    return null;
  }
}

/** Evaluate (fx, fy) at a point; null if either throws or yields a non-finite number. */
function evalVector(model: FieldModel, x: number, y: number): { vx: number; vy: number } | null {
  let vx: unknown;
  let vy: unknown;
  try {
    vx = model.fx.evaluate({ x, y });
  } catch {
    return null;
  }
  try {
    vy = model.fy.evaluate({ x, y });
  } catch {
    return null;
  }
  if (typeof vx !== 'number' || typeof vy !== 'number') return null;
  if (!Number.isFinite(vx) || !Number.isFinite(vy)) return null;
  return { vx, vy };
}

/** Grid coordinates from `min` to `max` (inclusive of `min`) spaced `step` apart. */
function axisPoints(min: number, max: number, step: number): number[] {
  const n = Math.floor((max - min) / step + 1e-9);
  const pts: number[] = [];
  for (let i = 0; i <= n; i++) {
    pts.push(min + i * step);
  }
  return pts;
}

interface Arrow {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mag: number;
}

export default function VectorField({
  fx,
  fy,
  xmin,
  xmax,
  ymin,
  ymax,
  step,
  scale,
  grid,
}: VectorFieldProps) {
  const model = useMemo(() => compileField(fx, fy), [fx, fy]);
  const xs = useMemo(() => axisPoints(xmin, xmax, step), [xmin, xmax, step]);
  const ys = useMemo(() => axisPoints(ymin, ymax, step), [ymin, ymax, step]);

  const arrows = useMemo<Arrow[] | null>(() => {
    if (!model) return null;
    const out: Arrow[] = [];
    for (const x of xs) {
      for (const y of ys) {
        const v = evalVector(model, x, y);
        if (!v) continue;
        out.push({ x, y, vx: v.vx, vy: v.vy, mag: Math.hypot(v.vx, v.vy) });
      }
    }
    return out;
  }, [model, xs, ys]);

  if (!model || !arrows || arrows.length === 0) {
    // Inline error card naming the expressions (SRS §5.3, FR-WID-003 style).
    return (
      <div
        role="alert"
        className="my-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900"
      >
        <strong>vector-field:</strong> could not plot the field{' '}
        <code className="font-mono">
          ({fx}, {fy})
        </code>
        . Check that both are valid formulas in <code className="font-mono">x</code> and{' '}
        <code className="font-mono">y</code>, e.g. <code className="font-mono">fx="y"</code>,{' '}
        <code className="font-mono">fy="-x"</code>.
      </div>
    );
  }

  const xRange = xmax - xmin;
  const yRange = ymax - ymin;
  const aspect = xRange / yRange;
  const innerW = aspect >= 1 ? SIZE : SIZE * aspect;
  const innerH = aspect >= 1 ? SIZE / aspect : SIZE;
  const width = innerW + MARGIN * 2;
  const height = innerH + MARGIN * 2;

  const sx = (x: number) => MARGIN + ((x - xmin) / xRange) * innerW;
  const sy = (y: number) => MARGIN + ((ymax - y) / yRange) * innerH; // y-up, flip vs screen space

  const maxMag = arrows.reduce((m, a) => Math.max(m, a.mag), 0);
  const cellMax = step * 0.42 * scale; // "fits nicely between grid points" cap, then user scale

  const ariaLabel = `Vector field plot of (${fx}, ${fy}) for x in [${xmin}, ${xmax}], y in [${ymin}, ${ymax}]`;

  return (
    <div className="my-4">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="block w-full rounded border border-zinc-300 bg-white"
        role="img"
        aria-label={ariaLabel}
      >
        {grid && (
          <g data-testid="vf-grid" aria-hidden="true">
            {xs.map((x) => (
              <line
                key={`gx${x}`}
                x1={sx(x)}
                y1={MARGIN}
                x2={sx(x)}
                y2={MARGIN + innerH}
                stroke="#e4e4e7"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {ys.map((y) => (
              <line
                key={`gy${y}`}
                x1={MARGIN}
                y1={sy(y)}
                x2={MARGIN + innerW}
                y2={sy(y)}
                stroke="#e4e4e7"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </g>
        )}

        <g data-testid="vf-axes" aria-hidden="true">
          {xmin <= 0 && 0 <= xmax && (
            <line
              x1={sx(0)}
              y1={MARGIN}
              x2={sx(0)}
              y2={MARGIN + innerH}
              stroke="#52525b"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
          )}
          {ymin <= 0 && 0 <= ymax && (
            <line
              x1={MARGIN}
              y1={sy(0)}
              x2={MARGIN + innerW}
              y2={sy(0)}
              stroke="#52525b"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
          )}
        </g>

        <g data-testid="vf-arrows">
          {arrows.map((a, i) => {
            if (a.mag < ZERO_EPS) {
              // Critical point: direction undefined, render a dot (never invisible).
              return (
                <circle
                  key={i}
                  data-testid="vf-dot"
                  cx={sx(a.x)}
                  cy={sy(a.y)}
                  r={DOT_RADIUS}
                  fill="#1d4ed8"
                />
              );
            }
            const len = (a.mag / maxMag) * cellMax;
            const ux = a.vx / a.mag;
            const uy = a.vy / a.mag;
            const endX = a.x + ux * len;
            const endY = a.y + uy * len;
            const x1 = sx(a.x);
            const y1 = sy(a.y);
            const x2 = sx(endX);
            const y2 = sy(endY);
            const angle = Math.atan2(y2 - y1, x2 - x1);
            const leftX = x2 - ARROW_HEAD_LEN * Math.cos(angle - ARROW_HEAD_ANGLE);
            const leftY = y2 - ARROW_HEAD_LEN * Math.sin(angle - ARROW_HEAD_ANGLE);
            const rightX = x2 - ARROW_HEAD_LEN * Math.cos(angle + ARROW_HEAD_ANGLE);
            const rightY = y2 - ARROW_HEAD_LEN * Math.sin(angle + ARROW_HEAD_ANGLE);
            return (
              <g key={i} data-testid="vf-arrow">
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#1d4ed8"
                  strokeWidth={1.5}
                  vectorEffect="non-scaling-stroke"
                />
                <polygon
                  points={`${x2},${y2} ${leftX},${leftY} ${rightX},${rightY}`}
                  fill="#1d4ed8"
                />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
