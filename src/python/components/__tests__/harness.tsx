// Test harness — renders a §6.7 component from a PyNode inside a stub
// PyRenderContext so handler emits and child rendering are observable without
// the real TreeRenderer (T1.1).

import { render, type RenderResult } from '@testing-library/react';
import { vi } from 'vitest';

import type { PyNode, PropValue } from '../../component-tree';
import type { JsonValue } from '../../protocol';
import {
  PyRenderContext,
  type PyComponentProps,
  type PyRenderContextValue,
} from '../../py-render-context';

export function makeNode(
  type: string,
  props: Record<string, PropValue> = {},
  children: PyNode[] = [],
  key = 'k',
): PyNode {
  return { type, key, props, children };
}

export interface Harness {
  emit: ReturnType<typeof vi.fn>;
  result: RenderResult;
}

export function renderComponent(
  Comp: React.FC<PyComponentProps>,
  node: PyNode,
  opts: { dev?: boolean } = {},
): Harness {
  const emit = vi.fn<(handler: string, value: JsonValue) => void>();
  const ctx: PyRenderContextValue = {
    emit,
    dev: opts.dev ?? false,
    renderNode: (n) => <div data-testid={`child-${n.type}`}>{n.props['text'] as string}</div>,
    renderChildren: (nodes) => (
      <>
        {nodes.map((n) => (
          <div key={n.key} data-testid={`child-${n.type}`}>
            {n.type}
          </div>
        ))}
      </>
    ),
  };
  const result = render(
    <PyRenderContext.Provider value={ctx}>
      <Comp node={node} />
    </PyRenderContext.Provider>,
  );
  return { emit, result };
}
