// `predict` screen — commit-before-reveal (target spec #3). Gating: the
// Continue button stays disabled until the learner commits a choice; the
// reveal appears immediately on commit (never worded as pass/fail — a wrong
// guess is productive, not a failure, per learnlab-lesson-pedagogy).

import { useState } from 'react';

import { MarkdownInline } from '../markdown';
import { choiceClassName } from '../ui';

import { defineScreen } from './screen-def';
import type { ScreenRunnerProps } from './screen-def';
import { ScreenShell } from './ScreenShell';
import type { PredictScreen as PredictScreenType } from './types';

function PredictScreenRunner({
  screen,
  index,
  total,
  onAdvance,
}: ScreenRunnerProps<PredictScreenType>) {
  const [committed, setCommitted] = useState<number | null>(null);

  return (
    <ScreenShell index={index} total={total} canAdvance={committed !== null} onAdvance={onAdvance}>
      <p className="text-lg font-medium">
        <MarkdownInline markdown={screen.prompt} />
      </p>
      <div className="mt-4 space-y-2" role="radiogroup" aria-label="Your prediction">
        {screen.choices.map((choice, i) => {
          const isSelected = committed === i;
          const isMarkedCorrect =
            committed !== null && screen.correctChoiceIndex !== undefined && i === screen.correctChoiceIndex;
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={committed !== null}
              onClick={() => setCommitted(i)}
              className={choiceClassName(
                isMarkedCorrect ? 'correct' : isSelected ? 'selected' : 'idle',
              )}
            >
              <MarkdownInline markdown={choice} />
            </button>
          );
        })}
      </div>
      {committed !== null && (
        <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-700">
          <MarkdownInline markdown={screen.reveal} />
        </div>
      )}
    </ScreenShell>
  );
}

export const def = defineScreen<PredictScreenType>({ component: PredictScreenRunner });
