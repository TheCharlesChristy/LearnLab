// §6.7 host-side component set — the closed-set registry the orchestrator wires
// into component-registry.ts. Keys MUST exactly equal COMPONENT_TYPES
// (component-tree.ts); a test asserts this. FunctionPlot is intentionally
// absent: Python samples it into a Plot node, so it is not a wire type.
//
// Heavy deps stay inside the component that needs them: Recharts is lazily
// imported inside Plot, KaTeX inside Math (NFR-PERF-001). This barrel is
// therefore safe to import eagerly without pulling those into the entry chunk.

import type { PyComponentRegistry } from '../py-render-context';

import {
  Alert,
  Badge,
  CodeBlock,
  Image,
  Markdown,
  ProgressBar,
  Table,
  Text,
} from './display';
import {
  Button,
  Checkbox,
  CheckboxGroup,
  NumberInput,
  RadioGroup,
  Select,
  Slider,
  TextInput,
} from './input';
import { Card, Column, Divider, Row, Spacer } from './layout';
import { Canvas } from './viz/Canvas';
import { Math } from './viz/Math';
import { Plot } from './viz/Plot';

export const components: PyComponentRegistry = {
  // layout
  Column,
  Row,
  Card,
  Divider,
  Spacer,
  // display
  Text,
  Markdown,
  Math,
  Image,
  Alert,
  Table,
  CodeBlock,
  Badge,
  ProgressBar,
  // input
  Button,
  Slider,
  NumberInput,
  TextInput,
  Select,
  RadioGroup,
  Checkbox,
  CheckboxGroup,
  // viz
  Plot,
  Canvas,
};
