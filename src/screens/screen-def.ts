// Screen registry contract — the src/screens/ twin of
// src/widgets/widget-def.ts's WidgetDef. A screen type registers a component
// that owns its own gating logic; ScreenShell (./ScreenShell.tsx) is the only
// way to render the Continue affordance, and it takes `canAdvance` as a prop
// the screen component computes from real interaction state — there is no
// path from "screen mounts" to "Continue enabled" that skips an interaction.

import type { ComponentType } from 'react';

import type { Screen } from './types';

export interface ScreenRunnerProps<S extends Screen = Screen> {
  screen: S;
  /** Stable per-screen namespace for future review/engagement item ids, e.g. `${lessonId}:${screen.id}`. */
  screenKey: string;
  /** 0-based index of this screen within the sequence. */
  index: number;
  total: number;
  /** Advance to the next screen (or finish, on the last). Call only once the screen is genuinely complete. */
  onAdvance: () => void;
  /**
   * Retrieval-evidence hook (D-033), for checkpoint screens that can be
   * re-asked later in a review session: report whether the learner got it
   * on their first attempt (for `flash-recall`, their self-grade). May be
   * called more than once; the engine commits the latest report when the
   * learner advances, seeding the screen into the spaced-review queue.
   * Non-checkpoint screens (predict, reveal-mechanism, manipulable-target)
   * never call it.
   */
  onOutcome?: (outcome: ScreenOutcome) => void;
}

export interface ScreenOutcome {
  firstTry: boolean;
}

export interface ScreenDef<S extends Screen = Screen> {
  component: ComponentType<ScreenRunnerProps<S>>;
}

/** Type-erase a screen definition for storage in the heterogeneous registry (mirrors defineWidget). */
export function defineScreen<S extends Screen>(def: ScreenDef<S>): ScreenDef {
  return def as unknown as ScreenDef;
}
