// Python component registry — SRS §6.4/§6.7. Maps each closed-set component
// `type` to its React implementation. The TreeRenderer (T1.1) reads this;
// component files (T1.2) export the implementations; the ORCHESTRATOR wires
// the entries here (shared-wiring rule). Unknown types are handled by the
// renderer (error card), so a missing entry is visible, never silent.

import type { PyComponentRegistry } from './py-render-context';

export const pyComponentRegistry: PyComponentRegistry = {
  // wired by the orchestrator as T1.2 lands the §6.7 components:
  // Column, Row, Card, Divider, Spacer, Text, Markdown, Math, Image, Alert,
  // Table, CodeBlock, Badge, ProgressBar, Button, Slider, NumberInput,
  // TextInput, Select, RadioGroup, Checkbox, CheckboxGroup, Plot, Canvas
};

export const PY_COMPONENT_KEYS: string[] = Object.keys(pyComponentRegistry);
