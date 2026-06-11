// Widget registry contract — normative per SRS §5.3 (FR-WID-001).
// Pinned by the orchestrator (T0.C). Widgets register in registry.ts; this
// type does not change without an orchestrator-approved SRS re-read.

import type { ComponentType, LazyExoticComponent } from 'react';

/** Raw directive attributes as parsed from Markdown (§4.5): strings/numbers/booleans. */
export type RawWidgetProps = Record<string, string | number | boolean>;

/** Hand-rolled prop guard result (no Zod — §5.3). */
export type ParsedProps<P> =
  | { ok: true; props: P }
  | { ok: false; errors: string[] }; // each error names the bad prop (FR-WID-003)

export interface WidgetDef<P extends object = object> {
  component: LazyExoticComponent<ComponentType<P>>;
  parseProps: (raw: RawWidgetProps) => ParsedProps<P>;
}

/** Type-erase a widget definition for storage in the heterogeneous registry. */
export function defineWidget<P extends object>(def: WidgetDef<P>): WidgetDef<object> {
  return def as unknown as WidgetDef<object>;
}
