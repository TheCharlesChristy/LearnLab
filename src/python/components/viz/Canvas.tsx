// Canvas component — SRS §6.7. Immediate-mode 2D drawing: the host repaints a
// <canvas> from the command list on every render. Implements EXACTLY the eight
// learnsdk.draw ops (clear, line, circle, rect, polygon, text, arrow, grid);
// any unknown op is skipped with ONE console.warn. Coordinate origin is
// top-left, y-down, CSS pixels.
//
// on_pointer fires { type: 'down'|'move'|'up', x, y } in CSS px. The canvas is
// focusable (tabIndex) and labelled so it is reachable by keyboard
// (NFR-A11Y-001); pointer interaction itself is mouse/touch (per task: keyboard
// pointer control not required).

import { useEffect, useRef } from 'react';

import type { DrawCommand, DrawOp } from '../../component-tree';
import { DRAW_OPS } from '../../component-tree';
import type { JsonValue } from '../../protocol';
import type { PyComponentProps } from '../../py-render-context';
import { usePyRender } from '../../py-render-context';
import { handler, num, optStr } from '../props';

const DRAW_OP_SET = new Set<string>(DRAW_OPS);

// ---- typed readers over a command's loosely-typed args -------------------
function n(cmd: DrawCommand, key: string, fallback = 0): number {
  const v = cmd[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}
function s(cmd: DrawCommand, key: string, fallback: string): string {
  const v = cmd[key];
  return typeof v === 'string' ? v : fallback;
}
function colorOrNull(cmd: DrawCommand, key: string): string | null {
  const v = cmd[key];
  return typeof v === 'string' ? v : null;
}
function pointList(v: JsonValue): Array<[number, number]> {
  if (!Array.isArray(v)) return [];
  const out: Array<[number, number]> = [];
  for (const p of v) {
    if (Array.isArray(p) && typeof p[0] === 'number' && typeof p[1] === 'number') {
      out.push([p[0], p[1]]);
    }
  }
  return out;
}

// `cssW`/`cssH` are the canvas dimensions in CSS px (the ctx transform already
// maps CSS px → device px, so all drawing here is in CSS-px space).
function paintOne(
  ctx: CanvasRenderingContext2D,
  cmd: DrawCommand,
  cssW: number,
  cssH: number,
): void {
  const op = cmd.op as DrawOp;
  switch (op) {
    case 'clear': {
      ctx.save();
      ctx.fillStyle = s(cmd, 'color', '#0b1220');
      ctx.fillRect(0, 0, cssW, cssH);
      ctx.restore();
      break;
    }
    case 'line': {
      ctx.save();
      ctx.strokeStyle = s(cmd, 'color', '#e2e8f0');
      ctx.lineWidth = n(cmd, 'width', 1);
      ctx.beginPath();
      ctx.moveTo(n(cmd, 'x1'), n(cmd, 'y1'));
      ctx.lineTo(n(cmd, 'x2'), n(cmd, 'y2'));
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'circle': {
      const fill = colorOrNull(cmd, 'fill');
      const stroke = colorOrNull(cmd, 'stroke');
      ctx.save();
      ctx.beginPath();
      ctx.arc(n(cmd, 'x'), n(cmd, 'y'), Math.max(0, n(cmd, 'r')), 0, Math.PI * 2);
      if (fill !== null) {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      if (stroke !== null) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = n(cmd, 'width', 1);
        ctx.stroke();
      }
      ctx.restore();
      break;
    }
    case 'rect': {
      const fill = colorOrNull(cmd, 'fill');
      const stroke = colorOrNull(cmd, 'stroke');
      const x = n(cmd, 'x');
      const y = n(cmd, 'y');
      const w = n(cmd, 'w');
      const h = n(cmd, 'h');
      ctx.save();
      if (fill !== null) {
        ctx.fillStyle = fill;
        ctx.fillRect(x, y, w, h);
      }
      if (stroke !== null) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = n(cmd, 'width', 1);
        ctx.strokeRect(x, y, w, h);
      }
      ctx.restore();
      break;
    }
    case 'polygon': {
      const pts = pointList(cmd['points'] ?? []);
      if (pts.length === 0) break;
      const fill = colorOrNull(cmd, 'fill');
      const stroke = colorOrNull(cmd, 'stroke');
      ctx.save();
      ctx.beginPath();
      const [first, ...rest] = pts;
      ctx.moveTo(first![0], first![1]);
      for (const [px, py] of rest) ctx.lineTo(px, py);
      ctx.closePath();
      if (fill !== null) {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      if (stroke !== null) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = n(cmd, 'width', 1);
        ctx.stroke();
      }
      ctx.restore();
      break;
    }
    case 'text': {
      ctx.save();
      ctx.fillStyle = s(cmd, 'color', '#e2e8f0');
      ctx.font = `${n(cmd, 'size', 12)}px ui-sans-serif, system-ui, sans-serif`;
      const align = s(cmd, 'align', 'left');
      ctx.textAlign = align === 'center' || align === 'right' ? align : 'left';
      ctx.fillText(s(cmd, 's', ''), n(cmd, 'x'), n(cmd, 'y'));
      ctx.restore();
      break;
    }
    case 'arrow': {
      const x1 = n(cmd, 'x1');
      const y1 = n(cmd, 'y1');
      const x2 = n(cmd, 'x2');
      const y2 = n(cmd, 'y2');
      const color = s(cmd, 'color', '#e2e8f0');
      const width = n(cmd, 'width', 2);
      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      // Arrow head.
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const head = 6 + width * 2;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(
        x2 - head * Math.cos(angle - Math.PI / 6),
        y2 - head * Math.sin(angle - Math.PI / 6),
      );
      ctx.lineTo(
        x2 - head * Math.cos(angle + Math.PI / 6),
        y2 - head * Math.sin(angle + Math.PI / 6),
      );
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'grid': {
      const spacing = Math.max(1, n(cmd, 'spacing', 20));
      const color = s(cmd, 'color', '#1e293b');
      const w = cssW;
      const h = cssH;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= w; x += spacing) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      for (let y = 0; y <= h; y += spacing) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();
      ctx.restore();
      break;
    }
    default: {
      // Exhaustiveness guard: every DrawOp is handled above.
      const _never: never = op;
      void _never;
    }
  }
}

/** Repaint the whole command list (immediate mode). Exported for testing. */
export function paintCommands(
  ctx: CanvasRenderingContext2D,
  commands: JsonValue,
  cssW: number,
  cssH: number,
  warn: (msg: string) => void,
): void {
  const list = Array.isArray(commands) ? commands : [];
  let warned = false;
  for (const raw of list) {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) continue;
    const op = (raw as { op?: unknown }).op;
    if (typeof op !== 'string' || !DRAW_OP_SET.has(op)) {
      if (!warned) {
        warn(`Canvas: skipping unknown draw op ${JSON.stringify(op)}`);
        warned = true;
      }
      continue;
    }
    paintOne(ctx, raw as DrawCommand, cssW, cssH);
  }
}

export const Canvas: React.FC<PyComponentProps> = ({ node }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const { emit } = usePyRender();
  const width = num(node.props, 'width', 320);
  const height = num(node.props, 'height', 240);
  const background = optStr(node.props, 'background') ?? '#0b1220';
  const pointerToken = handler(node.props, 'on_pointer');
  const rawCommands = node.props['commands'];

  useEffect(() => {
    const canvas = ref.current;
    if (canvas === null) return;
    const ctx = canvas.getContext('2d');
    if (ctx === null) return;
    // HiDPI: back the canvas at devicePixelRatio while drawing in CSS px.
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Paint the background first, then the command list (immediate mode).
    ctx.save();
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
    // `commands` is always a JSON array on the wire; a HandlerRef here would be
    // a malformed tree — treat anything non-array as empty (paintCommands
    // re-guards each entry too).
    const commands: JsonValue = Array.isArray(rawCommands) ? rawCommands : [];
    paintCommands(ctx, commands, width, height, (msg) => console.warn(msg));
  }, [width, height, background, rawCommands]);

  function pointerPos(e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }
  function firePointer(type: 'down' | 'move' | 'up', e: React.PointerEvent<HTMLCanvasElement>) {
    if (pointerToken === undefined) return;
    const { x, y } = pointerPos(e);
    emit(pointerToken, { type, x, y });
  }

  return (
    <canvas
      ref={ref}
      role="img"
      tabIndex={0}
      aria-label="Interactive canvas"
      className="rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-indigo-300"
      onPointerDown={pointerToken === undefined ? undefined : (e) => firePointer('down', e)}
      onPointerMove={pointerToken === undefined ? undefined : (e) => firePointer('move', e)}
      onPointerUp={pointerToken === undefined ? undefined : (e) => firePointer('up', e)}
    />
  );
};
