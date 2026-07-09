// `tap-choice` screen — full-screen mcq (target spec #5: wrong answers
// branch to targeted feedback and a hint ladder, never a bare X). Gating:
// the learner must land on the correct choice themselves to advance; a wrong
// tap shows that choice's misconception-targeted feedback and, after the
// first miss, the next rung of the hint ladder — the ladder never bottoms
// out in the answer (backlog item 8).

import { useState } from 'react';

import { MarkdownInline } from '../markdown';
import { cx } from '../ui';

import { defineScreen } from './screen-def';
import type { ScreenRunnerProps } from './screen-def';
import { ScreenShell } from './ScreenShell';
import type { TapChoiceScreen as TapChoiceScreenType } from './types';

function TapChoiceScreenRunner({
  screen,
  index,
  total,
  onAdvance,
}: ScreenRunnerProps<TapChoiceScreenType>) {
  const [selected, setSelected] = useState<number | null>(null);
  const [wrongTried, setWrongTried] = useState<number[]>([]);
  const [hintLevel, setHintLevel] = useState(0);

  const correct = selected === screen.correctIndex;

  function choose(i: number) {
    if (correct) return; // locked in once right
    setSelected(i);
    if (i !== screen.correctIndex) {
      setWrongTried((prev) => (prev.includes(i) ? prev : [...prev, i]));
      setHintLevel((n) => Math.min(n + 1, screen.hints?.length ?? 0));
    }
  }

  const activeHint = screen.hints && hintLevel > 0 ? screen.hints[hintLevel - 1] : undefined;
  const selectedFeedback =
    !correct && selected !== null ? screen.choices[selected]?.feedback : undefined;

  return (
    <ScreenShell index={index} total={total} canAdvance={correct} onAdvance={onAdvance}>
      <p className="text-lg font-medium">
        <MarkdownInline markdown={screen.prompt} />
      </p>
      <div className="mt-4 space-y-2" role="radiogroup" aria-label="Choose one">
        {screen.choices.map((choice, i) => {
          const isSelected = selected === i;
          const isWrong = wrongTried.includes(i) && !(correct && i === screen.correctIndex);
          const isRight = correct && i === screen.correctIndex;
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={correct}
              onClick={() => choose(i)}
              className={cx(
                'flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left transition-colors motion-safe:duration-150',
                'border-slate-300 hover:bg-indigo-50 disabled:cursor-default dark:border-slate-600 dark:hover:bg-slate-700',
                isRight && 'border-emerald-600 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-950/30',
                isWrong && 'border-red-400 bg-red-50 dark:border-red-500 dark:bg-red-950/30',
              )}
            >
              {choice.text}
            </button>
          );
        })}
      </div>
      <div aria-live="polite" className="mt-3 min-h-6">
        {correct && (
          <p className="font-semibold text-emerald-700 dark:text-emerald-400">
            Correct!{screen.successFeedback ? ` ${screen.successFeedback}` : ''}
          </p>
        )}
        {!correct && selectedFeedback && (
          <p className="text-sm text-red-700 dark:text-red-400">{selectedFeedback}</p>
        )}
        {!correct && activeHint && (
          <p className="mt-1 text-sm italic opacity-80">Hint: {activeHint}</p>
        )}
      </div>
    </ScreenShell>
  );
}

export const def = defineScreen<TapChoiceScreenType>({ component: TapChoiceScreenRunner });
