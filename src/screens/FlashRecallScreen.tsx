// `flash-recall` screen — single retrieval-practice card, generalizing the
// `flashcards` widget's flip/self-grade loop. Gating is two-part: the
// learner must commit to "I tried — show the answer" (an attempt, not a
// skip) before the back is revealed, then self-grade before Continue.

import { useState } from 'react';

import { MarkdownInline } from '../markdown';
import { Button, cx } from '../ui';

import { defineScreen } from './screen-def';
import type { ScreenRunnerProps } from './screen-def';
import { ScreenShell } from './ScreenShell';
import type { FlashRecallScreen as FlashRecallScreenType } from './types';

function FlashRecallScreenRunner({
  screen,
  index,
  total,
  onAdvance,
}: ScreenRunnerProps<FlashRecallScreenType>) {
  const [revealed, setRevealed] = useState(false);
  const [grade, setGrade] = useState<'again' | 'good' | null>(null);

  return (
    <ScreenShell index={index} total={total} canAdvance={grade !== null} onAdvance={onAdvance}>
      <p className="text-lg font-medium">
        <MarkdownInline markdown={screen.front} />
      </p>
      {!revealed ? (
        <Button className="mt-4" onClick={() => setRevealed(true)}>
          I've got an answer — show me
        </Button>
      ) : (
        <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-700">
          <MarkdownInline markdown={screen.back} />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setGrade('again')}
              className={cx(
                'rounded-md border px-3 py-1.5 text-sm font-medium',
                grade === 'again'
                  ? 'border-amber-600 bg-amber-50 dark:border-amber-400 dark:bg-amber-950/40'
                  : 'border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700',
              )}
            >
              Didn't get it
            </button>
            <button
              type="button"
              onClick={() => setGrade('good')}
              className={cx(
                'rounded-md border px-3 py-1.5 text-sm font-medium',
                grade === 'good'
                  ? 'border-emerald-600 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-950/30'
                  : 'border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700',
              )}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </ScreenShell>
  );
}

export const def = defineScreen<FlashRecallScreenType>({ component: FlashRecallScreenRunner });
