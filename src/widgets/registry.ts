// Native widget registry — SRS §3.5, §5.3.
// One map; a new widget = one component file + one entry here + a keys.json
// entry + a WIDGETS.md section (FR-WID-002). keys.json is the plain-data twin
// of this map so the Node content pipeline can validate ::widget types without
// importing TS; scripts/dump-widget-keys.mjs copies it to
// schemas/widget-keys.json (§4.7). A unit test asserts map and keys agree.
//
// ORCHESTRATOR-OWNED WIRING: widget tasks export a WidgetDef from their own
// folder; the orchestrator adds the entry here.

import type { WidgetDef } from './widget-def';
import keys from './keys.json';

export type { WidgetDef, RawWidgetProps, ParsedProps } from './widget-def';

export const widgetRegistry: Record<string, WidgetDef> = {
  // wired by the orchestrator as widget tasks land:
  // 'function-grapher' (T0.5), 'figure' (T0.5), 'quiz' (T0.6)
};

export const WIDGET_KEYS: readonly string[] = keys;
