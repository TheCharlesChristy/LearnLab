// SVG eigen-decomposition visualizer for a symmetric 2x2 matrix [[a,b],[b,c]]
// — SRS §5.3 `eigen-playground` row. Closed-form eigen-solution (2x2
// symmetric has an exact formula, no iterative solver needed —
// NFR-PERF-001). The off-diagonal term `b` is a focusable role="slider",
// draggable by pointer and movable with arrow keys, mirroring
// function-grapher's tangent-point interaction pattern; the eigenvector
// angle readout lives in an aria-live region (NFR-A11Y-001).

import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';

import type { EigenPlaygroundProps } from './index';

const WIDTH = 640;
const PLOT_H = 320;
const SLIDER_H = 64;
const HEIGHT = PLOT_H + SLIDER_H;
const MARGIN = { top: 12, right: 12, bottom: 12, left: 12 };
const INNER_W = WIDTH - MARGIN.left - MARGIN.right;
const INNER_H = PLOT_H - MARGIN.top - MARGIN.bottom;
const POINT_COUNT = 140;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function fmt(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  return Number(value.toPrecision(4)).toString();
}

/** Deterministic PRNG (mulberry32) — stable point cloud across re-renders. */
function mulberry32(seed: number): () => number {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** n standard-normal pairs via Box-Muller, generated once from a fixed seed. */
function standardNormalPairs(n: number): { x: number; y: number }[] {
  const rand = mulberry32(0xc0ffee);
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const u1 = Math.max(rand(), 1e-12);
    const u2 = rand();
    const r = Math.sqrt(-2 * Math.log(u1));
    out.push({ x: r * Math.cos(2 * Math.PI * u2), y: r * Math.sin(2 * Math.PI * u2) });
  }
  return out;
}

interface EigenSolution {
  /** Eigenvalues, larger first. */
  values: [number, number];
  /** Angle in degrees of the eigenvector for the larger eigenvalue, in (-90, 90]. */
  angleDeg: number;
  /** True when the matrix is a valid covariance matrix (positive semi-definite). */
  validCovariance: boolean;
}

function eigenSolve(a: number, b: number, c: number): EigenSolution {
  const mid = (a + c) / 2;
  const rad = Math.sqrt(((a - c) / 2) ** 2 + b * b);
  const values: [number, number] = [mid + rad, mid - rad];
  const angleDeg = (0.5 * Math.atan2(2 * b, a - c) * 180) / Math.PI;
  return { values, angleDeg, validCovariance: values[1] >= -1e-9 };
}

export default function EigenPlayground({
  a,
  c,
  bMin,
  bMax,
  bInit,
  showPoints,
  onEigenChange,
}: EigenPlaygroundProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const draggingRef = useRef(false);
  const [b, setB] = useState(() => bInit ?? (bMin + bMax) / 2);
  const [focused, setFocused] = useState(false);
  const basePoints = useMemo(() => standardNormalPairs(POINT_COUNT), []);

  const solution = eigenSolve(a, b, c);
  const { values, angleDeg, validCovariance } = solution;

  useEffect(() => {
    onEigenChange?.({ b, angleDeg, eigenvalues: values });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [b, angleDeg, values[0], values[1], onEigenChange]);

  // Plot scaling: fixed data window of [-4, 4] in "standard deviations" units
  // scaled by the larger axis length, so the ellipse/points always fit.
  const scale = Math.max(1, Math.sqrt(Math.max(values[0], 0.01)));
  const halfRange = scale * 3.2;
  const cx = MARGIN.left + INNER_W / 2;
  const cyPlot = MARGIN.top + INNER_H / 2;
  const px = (x: number) => cx + (x / halfRange) * (INNER_W / 2);
  const py = (y: number) => cyPlot - (y / halfRange) * (INNER_H / 2);

  // Cholesky factor of [[a,b],[b,c]] (valid whenever a > 0 and det >= 0).
  const l11 = Math.sqrt(a);
  const l21 = b / l11;
  const l22 = Math.sqrt(Math.max(c - l21 * l21, 0));
  const points = validCovariance
    ? basePoints.map((p) => ({ x: l11 * p.x, y: l21 * p.x + l22 * p.y }))
    : [];

  // Ellipse contour (1 std) as a parametric SVG path from the eigenbasis.
  const theta = (angleDeg * Math.PI) / 180;
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const r1 = Math.sqrt(Math.max(values[0], 0));
  const r2 = Math.sqrt(Math.max(values[1], 0));
  const ellipseSteps = 48;
  let ellipsePath = '';
  if (validCovariance) {
    for (let i = 0; i <= ellipseSteps; i++) {
      const t = (2 * Math.PI * i) / ellipseSteps;
      const ex = r1 * Math.cos(t);
      const ey = r2 * Math.sin(t);
      const x = ex * cosT - ey * sinT;
      const y = ex * sinT + ey * cosT;
      ellipsePath += `${i === 0 ? 'M' : 'L'}${px(x).toFixed(2)} ${py(y).toFixed(2)}`;
    }
    ellipsePath += 'Z';
  }

  // Eigenvector arrows, scaled by sqrt(eigenvalue).
  const v1 = { x: r1 * cosT, y: r1 * sinT };
  const v2 = { x: -r2 * sinT, y: r2 * cosT };

  // ---- slider (drag/keyboard control of b) ----
  const sliderY = PLOT_H + SLIDER_H / 2;
  const sliderX0 = MARGIN.left + 8;
  const sliderX1 = WIDTH - MARGIN.right - 8;
  const bToSx = (value: number) =>
    sliderX0 + ((value - bMin) / (bMax - bMin)) * (sliderX1 - sliderX0);
  const sxToB = (sx: number) => bMin + ((sx - sliderX0) / (sliderX1 - sliderX0)) * (bMax - bMin);

  const xFromClientX = (clientX: number): number | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (rect.width <= 0) return null;
    return ((clientX - rect.left) / rect.width) * WIDTH;
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
    const sx = xFromClientX(e.clientX);
    if (sx !== null) setB(clamp(sxToB(sx), bMin, bMax));
  };
  const onPointerEnd = () => {
    draggingRef.current = false;
  };

  const onKeyDown = (e: KeyboardEvent<SVGGElement>) => {
    const step = (bMax - bMin) / 50;
    let next: number | null = null;
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        next = b - step;
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        next = b + step;
        break;
      case 'Home':
        next = bMin;
        break;
      case 'End':
        next = bMax;
        break;
      default:
        return;
    }
    e.preventDefault();
    setB(clamp(next, bMin, bMax));
  };

  const readout = validCovariance
    ? `b = ${fmt(b)}: principal eigenvector at ${fmt(angleDeg)}°, eigenvalues ${fmt(values[0])} and ${fmt(values[1])}`
    : `b = ${fmt(b)}: not a valid covariance matrix (needs a·c ≥ b²) — drag b back toward 0`;

  return (
    <div className="my-4">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="block w-full rounded border border-zinc-300 bg-white"
        style={{ height: HEIGHT }}
        role="group"
        aria-label="Eigen playground: drag b to change the covariance matrix"
      >
        <rect
          x={MARGIN.left}
          y={MARGIN.top}
          width={INNER_W}
          height={INNER_H}
          fill="none"
          stroke="#e4e4e7"
        />
        <line
          x1={cx}
          y1={MARGIN.top}
          x2={cx}
          y2={MARGIN.top + INNER_H}
          stroke="#e4e4e7"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1={MARGIN.left}
          y1={cyPlot}
          x2={MARGIN.left + INNER_W}
          y2={cyPlot}
          stroke="#e4e4e7"
          vectorEffect="non-scaling-stroke"
        />

        {showPoints &&
          points.map((p, i) => (
            <circle
              key={i}
              cx={px(p.x)}
              cy={py(p.y)}
              r={2}
              fill="#a1a1aa"
              opacity={0.55}
              data-testid="ep-point"
            />
          ))}

        {validCovariance && (
          <path
            data-testid="ep-ellipse"
            d={ellipsePath}
            fill="none"
            stroke="#1d4ed8"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        )}

        {validCovariance && (
          <>
            <line
              data-testid="ep-eigvec-1"
              x1={px(-v1.x)}
              y1={py(-v1.y)}
              x2={px(v1.x)}
              y2={py(v1.y)}
              stroke="#b91c1c"
              strokeWidth={2.5}
              vectorEffect="non-scaling-stroke"
            />
            <line
              data-testid="ep-eigvec-2"
              x1={px(-v2.x)}
              y1={py(-v2.y)}
              x2={px(v2.x)}
              y2={py(v2.y)}
              stroke="#059669"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
          </>
        )}

        {/* slider track */}
        <line
          x1={sliderX0}
          y1={sliderY}
          x2={sliderX1}
          y2={sliderY}
          stroke="#a1a1aa"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
        <g
          data-testid="ep-handle"
          role="slider"
          tabIndex={0}
          aria-label="Off-diagonal covariance term b"
          aria-orientation="horizontal"
          aria-valuemin={bMin}
          aria-valuemax={bMax}
          aria-valuenow={Number(b.toFixed(3))}
          aria-valuetext={readout}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ cursor: 'ew-resize', outline: 'none' }}
        >
          {focused && (
            <circle
              cx={bToSx(b)}
              cy={sliderY}
              r={12}
              fill="none"
              stroke="#1d4ed8"
              strokeWidth={2}
            />
          )}
          <circle cx={bToSx(b)} cy={sliderY} r={8} fill="#1d4ed8" stroke="#ffffff" strokeWidth={2} />
        </g>
      </svg>
      <p aria-live="polite" className="mt-1 text-sm text-zinc-700" data-testid="ep-readout">
        {readout}
      </p>
    </div>
  );
}
