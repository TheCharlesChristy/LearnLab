// The progression engine — Brilliant rewrite Phase 1
// (docs/BRILLIANT_REWRITE_PLAN.md). Renders exactly one screen at a time;
// each screen type owns its own gating (screen-def.ts), so this component's
// only job is sequencing: mount the screen for the current index, and on
// `onAdvance` move to the next one (or report the sequence finished, on the
// last). Screen-level persistence/resume and per-screen engagement events
// are Phase 2 (docs/BRILLIANT_REWRITE_PLAN.md's phasing) — this first slice
// proves the render+gate+advance loop end to end on one real lesson.

import { useState } from 'react';

import { screenRegistry } from './registry';
import type { ScreenSequence } from './types';

export interface ScreenSequenceEngineProps {
  sequence: ScreenSequence;
  /** Used to namespace each screen's key (`${lessonId}:${screen.id}`) for future review/engagement wiring. */
  lessonId: string;
  /** Called once, when the learner advances past the last screen. */
  onSequenceComplete: () => void;
}

export function ScreenSequenceEngine({
  sequence,
  lessonId,
  onSequenceComplete,
}: ScreenSequenceEngineProps) {
  const [index, setIndex] = useState(0);
  const total = sequence.screens.length;
  const screen = sequence.screens[index];

  function advance() {
    if (index + 1 >= total) {
      onSequenceComplete();
      return;
    }
    setIndex((i) => i + 1);
  }

  if (!screen) return null;
  const Runner = screenRegistry[screen.type].component;

  return (
    <Runner
      // Remount on screen change: each screen type owns local interaction
      // state (selected choice, committed prediction, …) that must not leak
      // across screens.
      key={`${sequence.id}:${screen.id}`}
      screen={screen}
      screenKey={`${lessonId}:${screen.id}`}
      index={index}
      total={total}
      onAdvance={advance}
    />
  );
}
