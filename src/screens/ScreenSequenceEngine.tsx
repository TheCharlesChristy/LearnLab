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
//
// Retrieval evidence (D-033): checkpoint screens report a first-try outcome
// via `onOutcome`; on advance the engine seeds that screen into the spaced-
// review queue (item id `screen:<lessonId>:<screenId>`, mirroring
// screenReviewItemId in src/progress/srs.ts) — `good` if the learner got it
// first time, `again` (due tomorrow) if they needed feedback or hints. This
// is what connects the primary lesson format to spaced retrieval: without
// it, nothing a learner did in a lesson would ever come back.

import { useContext, useEffect, useRef, useState } from 'react';

import { LessonContext } from '../content';
import { Spinner } from '../ui';

import { screenRegistry } from './registry';
import type { ScreenOutcome } from './screen-def';
import type { ScreenSequence } from './types';

/** What this run of the lesson produced — shown in the lesson-complete debrief. */
export interface LessonRunSummary {
  /** Checkpoint screens completed in this run (resumed runs count only what was done now). */
  checkpoints: number;
  /** Of those, answered correctly on the first attempt. */
  firstTry: number;
}

export interface ScreenSequenceEngineProps {
  sequence: ScreenSequence;
  /** Used to namespace the itemState key and each screen's screenKey. */
  lessonId: string;
  /** Called once, when the learner advances past the last screen. */
  onSequenceComplete: (summary: LessonRunSummary) => void;
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
  // Set once the learner advances past the last screen. Guards against the
  // last screen's "Finish" button staying mounted (and enabled) and firing
  // advance() — and therefore notifyEngagement({kind:'screen-complete'}) and
  // onSequenceComplete() — again on every repeat click.
  const [finished, setFinished] = useState(false);
  // Latest outcome reported by the current screen (it may change its mind,
  // e.g. a flash-recall self-grade), committed on advance.
  const pendingOutcome = useRef<ScreenOutcome | null>(null);
  const summary = useRef<LessonRunSummary>({ checkpoints: 0, firstTry: 0 });

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
    if (index === null || finished) return;
    const current = sequence.screens[index];
    const outcome = pendingOutcome.current;
    pendingOutcome.current = null;
    if (current && outcome) {
      summary.current.checkpoints += 1;
      if (outcome.firstTry) summary.current.firstTry += 1;
      void ctx?.seedReviewItem(`screen:${lessonId}:${current.id}`, outcome.firstTry ? 'good' : 'again');
    }
    ctx?.notifyEngagement({ kind: 'screen-complete' });
    const next = index + 1;
    void ctx?.setItemState(itemId, { screenIndex: Math.min(next, total - 1) } satisfies SavedPosition);
    if (next >= total) {
      setFinished(true);
      onSequenceComplete({ ...summary.current });
      return;
    }
    setIndex(next);
  }

  if (index === null) return <Spinner label="Resuming…" />;
  // Once finished, stop rendering the last screen's Runner entirely — its
  // "Finish" button would otherwise stay mounted and enabled, letting
  // repeat clicks re-fire advance(). The caller (LessonPage) swaps this out
  // for its own completed-lesson view once onSequenceComplete resolves.
  if (finished) return null;

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
      onOutcome={(o) => {
        pendingOutcome.current = o;
      }}
    />
  );
}
