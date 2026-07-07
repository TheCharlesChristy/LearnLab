// Public API of the Python subsystem (SRS §3.5 — import-isolated). The app
// shell and other subsystems import only from this barrel. Orchestrator-owned.

export { PyHost, pyHost } from './host';
export type {
  RuntimeState,
  RuntimeStatus,
  LoadItemRequest,
  ItemError,
  ItemHandle,
  WorkerLike,
  WorkerFactory,
} from './host';

export { PyItem } from './PyItem';
export type { PyItemProps } from './PyItem';

export { usePyRuntime, useEnsureRuntimeOnVisible, useRuntimeReady } from './runtime';
export { usePyItem } from './use-py-item';
export type { UsePyItemOptions, UsePyItemResult } from './use-py-item';

export { TreeRenderer } from './tree-renderer';

// Protocol + tree contracts (re-exported for consumers that wire persistence).
export type { JsonValue, JsonObject, ProgressPayload } from './protocol';
export type { PyNode } from './component-tree';
