// Screen-type registry — the src/screens/ twin of src/widgets/registry.ts.
// One map; a new screen type = one component file + one entry here (Phase 3
// adds the docs/SCREENS.md coverage check that mirrors FR-WID-002 for
// widgets). Registering a type here is what makes it a legal `type` value in
// a `*.screens.json` file, alongside its schema branch in
// schemas/screen-sequence.schema.json.

import { def as entryDef } from './EntryScreen';
import { def as manipulableTargetDef } from './ManipulableTargetScreen';
import { def as predictDef } from './PredictScreen';
import type { ScreenDef } from './screen-def';
import { def as tapChoiceDef } from './TapChoiceScreen';
import type { Screen } from './types';

export const screenRegistry: Record<Screen['type'], ScreenDef> = {
  predict: predictDef,
  'tap-choice': tapChoiceDef,
  entry: entryDef,
  'manipulable-target': manipulableTargetDef,
};

export const SCREEN_TYPES: readonly Screen['type'][] = Object.keys(screenRegistry) as Screen['type'][];
