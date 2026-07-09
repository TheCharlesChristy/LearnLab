// Shared chrome for every screen type — Brilliant rewrite Phase 1
// (docs/BRILLIANT_REWRITE_PLAN.md, target spec #2 and #7). Single column,
// one screen at a time, a progress sense across the sequence, and exactly
// one Continue/Finish action whose `disabled` state is owned entirely by the
// calling screen component. ScreenShell itself has no prop that lets a
// caller default `canAdvance` to true — every screen type must compute it
// from real interaction state.

import type { ReactNode } from 'react';

import { Button, ProgressBar } from '../ui';

export interface ScreenShellProps {
  index: number;
  total: number;
  canAdvance: boolean;
  onAdvance: () => void;
  children: ReactNode;
}

export function ScreenShell({ index, total, canAdvance, onAdvance, children }: ScreenShellProps) {
  const isLast = index === total - 1;
  return (
    <section
      aria-label={`Screen ${index + 1} of ${total}`}
      className="mx-auto flex max-w-xl flex-col gap-4"
    >
      <ProgressBar value={(index / total) * 100} label={`Screen ${index + 1} of ${total}`} />
      <div className="rounded-lg border border-slate-200 bg-surface p-4 dark:border-slate-700 dark:bg-surface-dark">
        {children}
      </div>
      <div className="flex justify-end">
        <Button onClick={onAdvance} disabled={!canAdvance}>
          {isLast ? 'Finish' : 'Continue'}
        </Button>
      </div>
    </section>
  );
}
