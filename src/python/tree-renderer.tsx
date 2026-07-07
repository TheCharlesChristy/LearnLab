// TreeRenderer — walks a serialised PyNode tree (§6.4) and renders each node via
// pyComponentRegistry, providing the PyRenderContext (emit + child helpers) that
// every §6.7 component pulls from. Pure render of a full snapshot; React
// reconciles by node.key (§6.4 rule 3).
//
// §6.4 rule 1: a node whose `type` is not in the registry renders a VISIBLE
// "Unknown component" error card naming the type — never silent, never throws.

import { useMemo, type ReactNode } from 'react';

import { pyComponentRegistry } from './component-registry';
import { PyRenderContext, type PyRenderContextValue } from './py-render-context';
import type { JsonValue } from './protocol';
import type { PyNode } from './component-tree';

export interface TreeRendererProps {
  tree: PyNode;
  /** Fire a handler token (§6.4 rule 2) with a JSON-safe value → EVENT (§6.3). */
  emit: (handler: string, value: JsonValue) => void;
  /** Dev builds may show richer diagnostics inside components. */
  dev?: boolean;
}

/** Visible, named fallback for an unregistered component type (§6.4 rule 1). */
function UnknownComponentCard({ type }: { type: string }) {
  return (
    <div
      role="alert"
      className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
    >
      Unknown component: <code className="font-mono">{type}</code>
    </div>
  );
}

function renderNodeWith(node: PyNode): ReactNode {
  const Impl = pyComponentRegistry[node.type];
  if (!Impl) return <UnknownComponentCard type={node.type} />;
  return <Impl node={node} />;
}

function renderChildrenWith(nodes: PyNode[]): ReactNode {
  // Keyed by node.key for stable reconciliation (§6.4 rule 3).
  return nodes.map((child) => <RenderKeyed key={child.key} node={child} />);
}

/** Thin wrapper so each child carries its own key in the React tree. */
function RenderKeyed({ node }: { node: PyNode }): ReactNode {
  return renderNodeWith(node);
}

export function TreeRenderer({ tree, emit, dev = false }: TreeRendererProps): ReactNode {
  const ctx = useMemo<PyRenderContextValue>(
    () => ({
      emit,
      renderNode: renderNodeWith,
      renderChildren: renderChildrenWith,
      dev,
    }),
    [emit, dev],
  );

  return (
    <PyRenderContext.Provider value={ctx}>{renderNodeWith(tree)}</PyRenderContext.Provider>
  );
}
