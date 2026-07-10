// Shared chrome for every screen type — Brilliant rewrite Phase 1
// (docs/BRILLIANT_REWRITE_PLAN.md, target spec #2 and #7). Single column,
// one screen at a time, a progress sense across the sequence, and exactly
// one Continue/Finish action whose `disabled` state is owned entirely by the
// calling screen component. ScreenShell itself has no prop that lets a
// caller default `canAdvance` to true — every screen type must compute it
// from real interaction state.

import { useRef } from 'react';
import type { ReactNode } from 'react';

import { Button, ProgressBar } from '../ui';
import { ReadAloudControl } from '../tts';

export interface ScreenShellProps {
  index: number;
  total: number;
  canAdvance: boolean;
  onAdvance: () => void;
  children: ReactNode;
}

export function ScreenShell({ index, total, canAdvance, onAdvance, children }: ScreenShellProps) {
  const isLast = index === total - 1;
  // Read-aloud (docs/BRILLIANT_REWRITE_PLAN.md) reads whatever's currently
  // rendered in this content box — no screen-type-specific wiring needed;
  // as a screen's own interaction reveals more content (a reveal, feedback),
  // a later "Read aloud" press picks that up automatically. `index` is
  // passed as the reset key even though each screen already gets a fresh
  // ScreenShell mount (defense in depth, costs nothing).
  const contentRef = useRef<HTMLDivElement>(null);
  return (
    <section
      aria-label={`Screen ${index + 1} of ${total}`}
      className="mx-auto flex max-w-xl flex-col gap-4"
    >
      <ProgressBar value={(index / total) * 100} label={`Screen ${index + 1} of ${total}`} />
      <div
        ref={contentRef}
        className="rounded-lg border border-slate-200 bg-surface p-4 dark:border-slate-700 dark:bg-surface-dark"
      >
        {children}
      </div>
      <ReadAloudControl targetRef={contentRef} resetKey={index} />
      <div className="flex justify-end">
        <Button onClick={onAdvance} disabled={!canAdvance}>
          {isLast ? 'Finish' : 'Continue'}
        </Button>
      </div>
    </section>
  );
}
