// Render contract between the TreeRenderer (T1.1) and the §6.7 component set
// (T1.2). Pinned by the orchestrator so both build in parallel.
//
// The TreeRenderer walks a PyNode tree and, for each node, looks up
// pyComponentRegistry[node.type] and renders it. Every component receives just
// its node; it pulls `emit` (to fire a handler token → EVENT) and child-
// rendering helpers from this context. This keeps component files decoupled
// from the host/worker plumbing.

import { createContext, useContext, type ReactNode } from 'react';

import type { JsonValue } from './protocol';
import type { PyNode } from './component-tree';

export interface PyRenderContextValue {
  /** Fire a handler reference's token with a JSON-safe value (→ EVENT, §6.3). */
  emit: (handler: string, value: JsonValue) => void;
  /** Render a single child node (recurses through the registry). */
  renderNode: (node: PyNode) => ReactNode;
  /** Render an ordered list of child nodes (keyed). */
  renderChildren: (nodes: PyNode[]) => ReactNode;
  /** True in dev builds — components may show richer diagnostics. */
  dev: boolean;
}

export const PyRenderContext = createContext<PyRenderContextValue | null>(null);

export function usePyRender(): PyRenderContextValue {
  const ctx = useContext(PyRenderContext);
  if (!ctx) throw new Error('usePyRender must be used within a PyRenderContext provider');
  return ctx;
}

/** Props every §6.7 component receives from the TreeRenderer. */
export interface PyComponentProps {
  node: PyNode;
}

/** A registry mapping a component `type` to its React implementation. */
export type PyComponentRegistry = Record<string, React.FC<PyComponentProps>>;
