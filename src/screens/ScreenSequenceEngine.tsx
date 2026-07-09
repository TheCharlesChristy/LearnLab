// The progression engine — Brilliant rewrite (docs/BRILLIANT_REWRITE_PLAN.md).
// Renders exactly one screen at a time; each screen type owns its own
// gating (screen-def.ts), so this component's job is sequencing: mount the
// screen for the current index, and on `onAdvance` move to the next one (or
// report the sequence finished, on the last).
//
// Persistence/engagement, both via the existing LessonContext primitives
// (no new progress-subsystem API): the current position is round-tripped
// through getItemState/setItemState under itemId `screens:<sequence.id>` so
// a reload resumes where the learner left off, and each screen completion
// fires notifyEngagement({kind:'screen-complete'}) so the existing points/
// streak/celebration layer reacts per screen, not just per lesson.

import { useContext, useEffect, useState } from 'react';

import { LessonContext } from '../content';
import { Spinner } from '../ui';

import { screenRegistry } from './registry';
import type { ScreenSequence } from './types';

export interface ScreenSequenceEngineProps {
  sequence: ScreenSequence;
  /** Used to namespace the itemState key and each screen's screenKey. */
  lessonId: string;
  /** Called once, when the learner advances past the last screen. */
  onSequenceComplete: () => void;
}

interface SavedPosition {
  screenIndex: number;
}

function isSavedPosition(value: unknown): value is SavedPosition {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { screenIndex?: unknown }).screenIndex === 'number'
  );
}

export function ScreenSequenceEngine({
  sequence,
  lessonId,
  onSequenceComplete,
}: ScreenSequenceEngineProps) {
  const ctx = useContext(LessonContext); // optional: null outside lesson routes (tests)
  const total = sequence.screens.length;
  const itemId = `screens:${sequence.id}`;

  // null while the saved position is still being resolved (or there is none
  // to resolve, e.g. no LessonContext) — avoids a flash of screen 1 before
  // jumping to a resumed position.
  const [index, setIndex] = useState<number | null>(ctx ? null : 0);

  useEffect(() => {
    if (!ctx) return;
    let cancelled = false;
    void ctx.getItemState(itemId).then((state) => {
      if (cancelled) return;
      const saved = isSavedPosition(state) ? state.screenIndex : 0;
      setIndex(saved >= 0 && saved < total ? saved : 0);
    });
    return () => {
      cancelled = true;
    };
    // itemId is stable per sequence; ctx is a stable LessonContext value per route.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  function advance() {
    if (index === null) return;
    ctx?.notifyEngagement({ kind: 'screen-complete' });
    const next = index + 1;
    void ctx?.setItemState(itemId, { screenIndex: Math.min(next, total - 1) } satisfies SavedPosition);
    if (next >= total) {
      onSequenceComplete();
      return;
    }
    setIndex(next);
  }

  if (index === null) return <Spinner label="Resuming…" />;

  const screen = sequence.screens[index];
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
