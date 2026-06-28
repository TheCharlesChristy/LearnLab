// Canvas (§6.7): executes EXACTLY the eight draw ops against a mocked 2D
// context, skips unknown ops with a single console.warn, and wires on_pointer.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen } from '@testing-library/react';

import type { JsonValue } from '../../protocol';
import { Canvas, paintCommands } from '../viz/Canvas';
import { makeNode, renderComponent } from './harness';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const canvasFixture = JSON.parse(
  readFileSync(resolve(process.cwd(), 'tests/protocol-fixtures/tree-canvas.json'), 'utf8'),
) as { props: { commands: JsonValue } };

/** A 2D context stub recording every method/property touched. */
function mockCtx() {
  const calls: Array<[string, unknown[]]> = [];
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(target, prop: string) {
      if (prop === 'canvas') return { width: 640, height: 320, style: {} };
      if (prop === '__calls') return calls;
      if (!(prop in target)) {
        target[prop] = (...args: unknown[]) => {
          calls.push([prop, args]);
        };
      }
      return target[prop];
    },
    set(target, prop: string, value) {
      calls.push([`set:${prop}`, [value]]);
      target[prop] = value;
      return true;
    },
  };
  return new Proxy({} as Record<string, unknown>, handler) as unknown as CanvasRenderingContext2D & {
    __calls: Array<[string, unknown[]]>;
  };
}

function opsCalled(ctx: ReturnType<typeof mockCtx>): Set<string> {
  return new Set(ctx.__calls.map(([m]) => m));
}

describe('paintCommands — the eight DRAW_OPS', () => {
  it('executes clear, line, circle, rect, polygon, text, arrow, grid', () => {
    const ctx = mockCtx();
    const warn = vi.fn();
    paintCommands(ctx, canvasFixture.props.commands, 640, 320, warn);
    const m = opsCalled(ctx);
    // clear/rect → fillRect; line/grid/arrow → moveTo+lineTo+stroke;
    // circle → arc; polygon → moveTo/lineTo/closePath; text → fillText.
    expect(m.has('fillRect')).toBe(true); // clear
    expect(m.has('arc')).toBe(true); // circle
    expect(m.has('strokeRect')).toBe(true); // rect (stroke set)
    expect(m.has('closePath')).toBe(true); // polygon
    expect(m.has('fillText')).toBe(true); // text
    expect(m.has('stroke')).toBe(true); // line/grid/arrow
    expect(m.has('fill')).toBe(true); // polygon fill / arrow head
    expect(warn).not.toHaveBeenCalled();
  });

  it('skips an unknown op with exactly one console.warn', () => {
    const ctx = mockCtx();
    const warn = vi.fn();
    const cmds: JsonValue = [
      { op: 'clear', color: '#000' },
      { op: 'sparkle', x: 1 },
      { op: 'glow', y: 2 },
    ];
    paintCommands(ctx, cmds, 100, 100, warn);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(opsCalled(ctx).has('fillRect')).toBe(true); // the known op still ran
  });

  it('draws an arrow as a line plus a filled head', () => {
    const ctx = mockCtx();
    paintCommands(ctx, [{ op: 'arrow', x1: 0, y1: 0, x2: 10, y2: 0 }], 100, 100, vi.fn());
    const m = opsCalled(ctx);
    expect(m.has('lineTo')).toBe(true);
    expect(m.has('fill')).toBe(true);
  });
});

describe('Canvas component', () => {
  it('renders a focusable, labelled canvas and repaints on mount', () => {
    const ctx = mockCtx();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      ctx as unknown as CanvasRenderingContext2D,
    );
    renderComponent(
      Canvas,
      makeNode('Canvas', {
        width: 640,
        height: 320,
        background: '#0b1220',
        commands: canvasFixture.props.commands,
      }),
    );
    const el = screen.getByRole('img', { name: 'Interactive canvas' });
    expect(el).toHaveAttribute('tabindex', '0');
    expect(opsCalled(ctx).has('fillText')).toBe(true);
  });

  it('fires on_pointer { type, x, y } in CSS px', () => {
    const ctx = mockCtx();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      ctx as unknown as CanvasRenderingContext2D,
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 10,
      top: 20,
      width: 640,
      height: 320,
      right: 650,
      bottom: 340,
      x: 10,
      y: 20,
      toJSON: () => ({}),
    } as DOMRect);
    const { emit } = renderComponent(
      Canvas,
      makeNode('Canvas', {
        width: 640,
        height: 320,
        commands: [],
        on_pointer: { __h: 'h_ptr' },
      }),
    );
    const el = screen.getByRole('img', { name: 'Interactive canvas' });
    fireEvent.pointerDown(el, { clientX: 110, clientY: 120 });
    expect(emit).toHaveBeenCalledWith('h_ptr', { type: 'down', x: 100, y: 100 });
  });
});
