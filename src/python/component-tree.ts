// Component-tree serialisation contract — normative per SRS §6.4 and §6.7.
// CLOSED SETS: COMPONENT_TYPES (§6.7) and DRAW_OPS (§6.7) are exhaustive.
// Unknown component type → host renders an "Unknown component" error card
// naming it (§6.4 rule 1). Unknown draw op → skipped with one console warning.
// Shared by the host renderer (src/python) and the Python `_bridge`, asserted
// against the golden fixtures in tests/protocol-fixtures/ (§11).

import type { JsonValue } from './protocol';

/** A handler reference: any Python callable prop becomes `{ __h: token }` (§6.4 rule 2). */
export interface HandlerRef {
  __h: string;
}
export function isHandlerRef(value: unknown): value is HandlerRef {
  return (
    typeof value === 'object' &&
    value !== null &&
    '__h' in value &&
    typeof (value as { __h: unknown }).__h === 'string'
  );
}

/** A serialised prop value: JSON-safe, or a handler reference (§6.4 rules 2 & 4). */
export type PropValue = JsonValue | HandlerRef;

/** A serialised UI node (§6.4). Trees are full snapshots; React reconciles. */
export interface PyNode {
  type: string; // must be a key in COMPONENT_TYPES (host validates)
  key: string; // defaults to position path; authors pass key= for dynamic lists
  props: Record<string, PropValue>;
  children: PyNode[];
}

/** Soft cap warns; hard cap raises SerializationError (§6.4 rule 5). */
export const TREE_SOFT_CAP = 2000;
export const TREE_HARD_CAP = 5000;

/**
 * The closed set of component `type` values (§6.7). NOTE: `FunctionPlot` is a
 * Python-only convenience that samples in Python and emits a `Plot` node, so it
 * is NOT a wire type — the host registry only needs the types below.
 */
export const COMPONENT_TYPES = [
  // layout
  'Column',
  'Row',
  'Card',
  'Divider',
  'Spacer',
  // display
  'Text',
  'Markdown',
  'Math',
  'Image',
  'Alert',
  'Table',
  'CodeBlock',
  'Badge',
  'ProgressBar',
  // input
  'Button',
  'Slider',
  'NumberInput',
  'TextInput',
  'Select',
  'RadioGroup',
  'Checkbox',
  'CheckboxGroup',
  // viz
  'Plot',
  'Canvas',
] as const;
export type ComponentType = (typeof COMPONENT_TYPES)[number];

/** The eight canvas draw ops the host implements exactly (§6.7 `learnsdk.draw`). */
export const DRAW_OPS = [
  'clear',
  'line',
  'circle',
  'rect',
  'polygon',
  'text',
  'arrow',
  'grid',
] as const;
export type DrawOp = (typeof DRAW_OPS)[number];

/** A single canvas draw command — `{ op, ...args }` (produced by `learnsdk.draw`). */
export interface DrawCommand {
  op: DrawOp;
  [arg: string]: JsonValue;
}
