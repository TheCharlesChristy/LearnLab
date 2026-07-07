// `geometry-canvas` implementation — interactive 2D geometry construction
// (docs/BUILD_PLAN.md Phase P6, D-024).
//
// Fetches a module-relative JSON "scene" file describing points, lines and
// circles in maths coordinates (y UP, same convention as the sibling
// `vector-field` widget) and renders an SVG diagram. `draggable` points are
// real drag targets (pointer events, clamped to `bounds`) AND keyboard
// operable (NFR-A11Y-001): each draggable point is backed by a focusable
// HTML `<button>` overlaid on the SVG (the SVG itself is purely visual —
// SVG focus/ARIA support is inconsistent across browsers, same rationale
// noted in the task brief), with arrow keys nudging it by a fixed step.
// Lines/circles defined in terms of a dragged point recompute live because
// they are derived every render from the same `positions` state.
//
// Scene JSON shape (this widget's own pinned schema — see docs draft):
//   {
//     "bounds": { "xmin": -5, "xmax": 5, "ymin": -5, "ymax": 5 },
//     "points": [
//       { "id": "A", "x": 0, "y": 0, "label": "A", "draggable": true },
//       { "id": "B", "x": 3, "y": 0, "draggable": false }
//     ],
//     "lines": [ { "from": "A", "to": "B" } ],
//     "circles": [ { "center": "A", "throughPoint": "B" } ]
//   }
// `points[].id` must be unique; `lines[].from/to` and
// `circles[].center/throughPoint` must reference an existing point id —
// validated at RUNTIME (lenient, mirroring logic-gate-sim's circuit
// validation), never via the content pipeline's Ajv. `draggable` defaults to
// `false`; `label` defaults to the point's `id` when omitted. `lines`/
// `circles` default to `[]` when omitted entirely.
//
// A circle's radius is the LIVE distance from `center` to `throughPoint` —
// dragging either point resizes/repositions the circle every render.
//
// Failure handling (FR-CONT-007 / FR-WID-003 spirit):
//   • network/HTTP failure       → retry card
//   • malformed JSON / bad shape → error card naming the exact problem
// The widget renders an inline card rather than throwing.

import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';

import { LessonContext } from '../../content';

import type { GeometryCanvasProps } from './index';

export interface Bounds {
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
}

export interface ScenePoint {
  id: string;
  x: number;
  y: number;
  label?: string;
  draggable: boolean;
}

export interface SceneLine {
  from: string;
  to: string;
}

export interface SceneCircle {
  center: string;
  throughPoint: string;
}

export interface Scene {
  bounds: Bounds;
  points: ScenePoint[];
  lines: SceneLine[];
  circles: SceneCircle[];
}

/** True for URLs that must not be re-based: scheme:, protocol-relative, root-relative. */
function isAbsoluteUrl(src: string): boolean {
  return /^(?:[a-z][a-z\d+\-.]*:|\/)/i.test(src);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Validate the fetched value into a Scene, or throw an Error whose message
 * names the offending part of the file (surfaced verbatim on the error
 * card). Mirrors logic-gate-sim's parseCircuit: lenient, runtime-only
 * validation (not the content pipeline's Ajv).
 */
export function parseScene(value: unknown): Scene {
  if (typeof value !== 'object' || value === null) {
    throw new Error('file must be a JSON object with "bounds" and "points"');
  }
  const v = value as Record<string, unknown>;

  if (typeof v.bounds !== 'object' || v.bounds === null) {
    throw new Error('bounds: must be an object { xmin, xmax, ymin, ymax }');
  }
  const b = v.bounds as Record<string, unknown>;
  for (const key of ['xmin', 'xmax', 'ymin', 'ymax'] as const) {
    if (!isFiniteNumber(b[key])) {
      throw new Error(`bounds.${key}: must be a finite number (got ${JSON.stringify(b[key])})`);
    }
  }
  const bounds: Bounds = {
    xmin: b.xmin as number,
    xmax: b.xmax as number,
    ymin: b.ymin as number,
    ymax: b.ymax as number,
  };
  if (!(bounds.xmin < bounds.xmax)) {
    throw new Error(
      `bounds: xmin must be less than xmax (got xmin=${bounds.xmin}, xmax=${bounds.xmax})`,
    );
  }
  if (!(bounds.ymin < bounds.ymax)) {
    throw new Error(
      `bounds: ymin must be less than ymax (got ymin=${bounds.ymin}, ymax=${bounds.ymax})`,
    );
  }

  if (!Array.isArray(v.points) || v.points.length === 0) {
    throw new Error('points: must be a non-empty array of { id, x, y }');
  }
  const seenIds = new Set<string>();
  const points: ScenePoint[] = v.points.map((raw, i) => {
    if (typeof raw !== 'object' || raw === null) {
      throw new Error(`points[${i}]: must be an object { id, x, y }`);
    }
    const p = raw as Record<string, unknown>;
    if (typeof p.id !== 'string' || p.id.trim() === '') {
      throw new Error(`points[${i}].id: must be a non-empty string`);
    }
    if (seenIds.has(p.id)) {
      throw new Error(`points[${i}].id: duplicate point id "${p.id}"`);
    }
    seenIds.add(p.id);
    if (!isFiniteNumber(p.x)) {
      throw new Error(`points[${i}].x: must be a finite number (got ${JSON.stringify(p.x)})`);
    }
    if (!isFiniteNumber(p.y)) {
      throw new Error(`points[${i}].y: must be a finite number (got ${JSON.stringify(p.y)})`);
    }
    let label: string | undefined;
    if (p.label !== undefined) {
      if (typeof p.label !== 'string' || p.label.trim() === '') {
        throw new Error(`points[${i}].label: must be a non-empty string if provided`);
      }
      label = p.label;
    }
    let draggable = false;
    if (p.draggable !== undefined) {
      if (typeof p.draggable !== 'boolean') {
        throw new Error(`points[${i}].draggable: must be a boolean if provided`);
      }
      draggable = p.draggable;
    }
    return { id: p.id, x: p.x, y: p.y, label, draggable };
  });

  const knownIds = seenIds;

  let lines: SceneLine[] = [];
  if (v.lines !== undefined) {
    if (!Array.isArray(v.lines)) {
      throw new Error('lines: must be an array of { from, to } if provided');
    }
    lines = v.lines.map((raw, i) => {
      if (typeof raw !== 'object' || raw === null) {
        throw new Error(`lines[${i}]: must be an object { from, to }`);
      }
      const l = raw as Record<string, unknown>;
      if (typeof l.from !== 'string' || l.from.trim() === '') {
        throw new Error(`lines[${i}].from: must be a non-empty string`);
      }
      if (!knownIds.has(l.from)) {
        throw new Error(`lines[${i}].from: references unknown point "${l.from}"`);
      }
      if (typeof l.to !== 'string' || l.to.trim() === '') {
        throw new Error(`lines[${i}].to: must be a non-empty string`);
      }
      if (!knownIds.has(l.to)) {
        throw new Error(`lines[${i}].to: references unknown point "${l.to}"`);
      }
      return { from: l.from, to: l.to };
    });
  }

  let circles: SceneCircle[] = [];
  if (v.circles !== undefined) {
    if (!Array.isArray(v.circles)) {
      throw new Error('circles: must be an array of { center, throughPoint } if provided');
    }
    circles = v.circles.map((raw, i) => {
      if (typeof raw !== 'object' || raw === null) {
        throw new Error(`circles[${i}]: must be an object { center, throughPoint }`);
      }
      const c = raw as Record<string, unknown>;
      if (typeof c.center !== 'string' || c.center.trim() === '') {
        throw new Error(`circles[${i}].center: must be a non-empty string`);
      }
      if (!knownIds.has(c.center)) {
        throw new Error(`circles[${i}].center: references unknown point "${c.center}"`);
      }
      if (typeof c.throughPoint !== 'string' || c.throughPoint.trim() === '') {
        throw new Error(`circles[${i}].throughPoint: must be a non-empty string`);
      }
      if (!knownIds.has(c.throughPoint)) {
        throw new Error(`circles[${i}].throughPoint: references unknown point "${c.throughPoint}"`);
      }
      return { center: c.center, throughPoint: c.throughPoint };
    });
  }

  return { bounds, points, lines, circles };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Trim trailing float noise for display, e.g. 3.0000000001 -> "3". */
function fmt(value: number): string {
  return Number(value.toFixed(2)).toString();
}

type LoadState =
  | { status: 'loading' }
  | { status: 'fetch-error'; message: string }
  | { status: 'data-error'; message: string }
  | { status: 'ready'; scene: Scene };

export default function GeometryCanvas({ src, width, height }: GeometryCanvasProps) {
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
        console.error(`[geometry-canvas] failed to load ${url}`, err);
        if (!cancelled) {
          setState({
            status: 'fetch-error',
            message: err instanceof Error ? err.message : String(err),
          });
        }
        return;
      }
      try {
        const scene = parseScene(raw);
        if (!cancelled) setState({ status: 'ready', scene });
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
        Loading geometry scene…
      </div>
    );
  }

  if (state.status === 'fetch-error') {
    return (
      <div role="alert" className="my-4 rounded-lg border border-red-300 p-4">
        <p className="font-medium">Couldn’t load geometry scene</p>
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
        <p className="font-medium">Invalid geometry scene data</p>
        <p className="mt-1 text-sm opacity-80">
          {src}: {state.message}
        </p>
      </div>
    );
  }

  return <Construction scene={state.scene} width={width} height={height} />;
}

interface Position {
  x: number;
  y: number;
}

function Construction({ scene, width, height }: { scene: Scene; width: number; height: number }) {
  const { bounds } = scene;
  const rangeX = bounds.xmax - bounds.xmin;
  const rangeY = bounds.ymax - bounds.ymin;
  // Uniform scale (not independent x/y stretch) so circles render as true
  // circles rather than ellipses; the mapped content is centred (letterboxed)
  // within the requested width x height pixel box.
  const scale = Math.min(width / rangeX, height / rangeY);
  const offsetX = (width - rangeX * scale) / 2;
  const offsetY = (height - rangeY * scale) / 2;

  // y-axis points UP (maths convention, same as the sibling vector-field
  // widget) — hence the flip in the py calculation.
  const toPx = useMemo(
    () => (x: number, y: number) => ({
      px: offsetX + (x - bounds.xmin) * scale,
      py: offsetY + (bounds.ymax - y) * scale,
    }),
    [bounds.xmin, bounds.ymax, offsetX, offsetY, scale],
  );

  const fromClientCoords = useMemo(
    () =>
      (svg: SVGSVGElement, clientX: number, clientY: number): Position | null => {
        const rect = svg.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return null;
        const px = ((clientX - rect.left) / rect.width) * width;
        const py = ((clientY - rect.top) / rect.height) * height;
        const x = bounds.xmin + (px - offsetX) / scale;
        const y = bounds.ymax - (py - offsetY) / scale;
        return {
          x: clamp(x, bounds.xmin, bounds.xmax),
          y: clamp(y, bounds.ymin, bounds.ymax),
        };
      },
    [bounds.xmin, bounds.xmax, bounds.ymin, bounds.ymax, offsetX, offsetY, scale, width, height],
  );

  const svgRef = useRef<SVGSVGElement>(null);
  const draggingIdRef = useRef<string | null>(null);

  const [positions, setPositions] = useState<Record<string, Position>>(() =>
    Object.fromEntries(scene.points.map((p) => [p.id, { x: p.x, y: p.y }])),
  );
  const [focusedId, setFocusedId] = useState<string | null>(null);

  // A newly (re)loaded scene resets live positions to its authored values.
  useEffect(() => {
    setPositions(Object.fromEntries(scene.points.map((p) => [p.id, { x: p.x, y: p.y }])));
  }, [scene]);

  // Nudge step: a sensible fraction (5%) of the larger bounds axis, per
  // NFR-A11Y-001 ("fixed step... relative to bounds size").
  const nudgeStep = Math.max(rangeX, rangeY) / 20;

  function movePoint(id: string, x: number, y: number) {
    setPositions((prev) => ({
      ...prev,
      [id]: { x: clamp(x, bounds.xmin, bounds.xmax), y: clamp(y, bounds.ymin, bounds.ymax) },
    }));
  }

  function onPointerDown(id: string) {
    return (e: ReactPointerEvent<HTMLButtonElement>) => {
      draggingIdRef.current = id;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // jsdom / older browsers: dragging still works while the pointer stays over the element.
      }
    };
  }

  function onPointerMove(e: ReactPointerEvent<HTMLButtonElement>) {
    const id = draggingIdRef.current;
    const svg = svgRef.current;
    if (!id || !svg) return;
    const coords = fromClientCoords(svg, e.clientX, e.clientY);
    if (coords) movePoint(id, coords.x, coords.y);
  }

  function onPointerEnd() {
    draggingIdRef.current = null;
  }

  function onKeyDown(id: string) {
    return (e: ReactKeyboardEvent<HTMLButtonElement>) => {
      const current = positions[id];
      if (!current) return;
      let dx = 0;
      let dy = 0;
      switch (e.key) {
        case 'ArrowLeft':
          dx = -nudgeStep;
          break;
        case 'ArrowRight':
          dx = nudgeStep;
          break;
        case 'ArrowUp':
          dy = nudgeStep;
          break;
        case 'ArrowDown':
          dy = -nudgeStep;
          break;
        default:
          return;
      }
      e.preventDefault();
      movePoint(id, current.x + dx, current.y + dy);
    };
  }

  const draggablePoints = scene.points.filter((p) => p.draggable);

  return (
    <div className="my-4">
      <div style={{ position: 'relative', width, height }} className="mx-auto">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          role="img"
          aria-label="Geometry construction"
          className="block rounded border border-zinc-300 bg-white"
        >
          {scene.lines.map((line, i) => {
            const p1 = positions[line.from];
            const p2 = positions[line.to];
            if (!p1 || !p2) return null;
            const a = toPx(p1.x, p1.y);
            const b = toPx(p2.x, p2.y);
            return (
              <line
                key={`line-${i}`}
                data-testid={`gc-line-${i}`}
                x1={a.px}
                y1={a.py}
                x2={b.px}
                y2={b.py}
                stroke="#1d4ed8"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}

          {scene.circles.map((circle, i) => {
            const c = positions[circle.center];
            const t = positions[circle.throughPoint];
            if (!c || !t) return null;
            const centerPx = toPx(c.x, c.y);
            const r = Math.hypot(t.x - c.x, t.y - c.y) * scale;
            return (
              <circle
                key={`circle-${i}`}
                data-testid={`gc-circle-${i}`}
                cx={centerPx.px}
                cy={centerPx.py}
                r={r}
                fill="none"
                stroke="#b91c1c"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}

          {scene.points.map((p) => {
            const pos = positions[p.id] ?? { x: p.x, y: p.y };
            const { px, py } = toPx(pos.x, pos.y);
            const isFocused = focusedId === p.id;
            return (
              <g key={p.id}>
                {isFocused && (
                  // Visible focus ring (NFR-A11Y-001), mirrors function-grapher's tangent point.
                  <circle
                    data-testid={`gc-focus-ring-${p.id}`}
                    cx={px}
                    cy={py}
                    r={11}
                    fill="none"
                    stroke="#1d4ed8"
                    strokeWidth={2}
                  />
                )}
                <circle
                  data-testid={`gc-point-${p.id}`}
                  cx={px}
                  cy={py}
                  r={5}
                  fill={p.draggable ? '#b91c1c' : '#3f3f46'}
                  stroke="#ffffff"
                  strokeWidth={1.5}
                />
                <text x={px + 8} y={py - 8} fontSize={12} fill="#18181b">
                  {p.label ?? p.id}
                </text>
              </g>
            );
          })}
        </svg>

        {draggablePoints.map((p) => {
          const pos = positions[p.id] ?? { x: p.x, y: p.y };
          const { px, py } = toPx(pos.x, pos.y);
          return (
            <button
              key={p.id}
              type="button"
              data-testid={`gc-handle-${p.id}`}
              aria-label={`Point ${p.label ?? p.id}, draggable, currently at (${fmt(pos.x)}, ${fmt(pos.y)})`}
              onPointerDown={onPointerDown(p.id)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerEnd}
              onPointerCancel={onPointerEnd}
              onKeyDown={onKeyDown(p.id)}
              onFocus={() => setFocusedId(p.id)}
              onBlur={() => setFocusedId((cur) => (cur === p.id ? null : cur))}
              style={{
                position: 'absolute',
                left: px,
                top: py,
                width: 22,
                height: 22,
                transform: 'translate(-50%, -50%)',
                borderRadius: '9999px',
                background: 'transparent',
                border: 'none',
                padding: 0,
                margin: 0,
                cursor: 'grab',
                touchAction: 'none',
              }}
              className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            />
          );
        })}
      </div>

      <p className="mt-1 text-xs opacity-60">
        {draggablePoints.length > 0
          ? 'Drag a highlighted point, or focus it and use the arrow keys, to explore the construction.'
          : 'This construction has no draggable points.'}
      </p>
    </div>
  );
}
