// Python component registry — SRS §6.4/§6.7. Maps each closed-set component
// `type` to its React implementation. The TreeRenderer reads this; component
// files (src/python/components) export the implementations; the ORCHESTRATOR
// wires them here (shared-wiring rule). Unknown types are handled by the
// renderer (visible error card), so a missing entry is never silent.

import { components } from './components';
import type { PyComponentRegistry } from './py-render-context';

export const pyComponentRegistry: PyComponentRegistry = { ...components };

export const PY_COMPONENT_KEYS: string[] = Object.keys(pyComponentRegistry);
