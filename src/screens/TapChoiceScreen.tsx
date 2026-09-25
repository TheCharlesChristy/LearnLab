// `tap-choice` screen — full-screen mcq (target spec #5: wrong answers
// branch to targeted feedback and a hint ladder, never a bare X). Gating:
// the learner must land on the correct choice themselves to advance; a wrong
// tap shows that choice's misconception-targeted feedback and, after the
// first miss, the next rung of the hint ladder — the ladder never bottoms
// out in the answer (backlog item 8).

import { useState } from 'react';

import { MarkdownInline } from '../markdown';
import { choiceClassName } from '../ui';

import { defineScreen } from './screen-def';
import type { ScreenRunnerProps } from './screen-def';
import { ScreenShell } from './ScreenShell';
import type { TapChoiceScreen as TapChoiceScreenType } from './types';

function TapChoiceScreenRunner({
  screen,
  index,
  total,
  onAdvance,
  onOutcome,
}: ScreenRunnerProps<TapChoiceScreenType>) {
  const [selected, setSelected] = useState<number | null>(null);
  const [wrongTried, setWrongTried] = useState<number[]>([]);
  const [hintLevel, setHintLevel] = useState(0);

  const correct = selected === screen.correctIndex;

  function choose(i: number) {
    if (correct) return; // locked in once right
    setSelected(i);
    if (i === screen.correctIndex) onOutcome?.({ firstTry: wrongTried.length === 0 });
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
              className={choiceClassName(isRight ? 'correct' : isWrong ? 'wrong' : 'idle')}
            >
              <MarkdownInline markdown={choice.text} />
            </button>
          );
        })}
      </div>
      <div aria-live="polite" className="mt-3 min-h-6">
        {correct && (
          <div className="font-semibold text-emerald-700 dark:text-emerald-400">
            <MarkdownInline
              markdown={screen.successFeedback ? `Correct! ${screen.successFeedback}` : 'Correct!'}
            />
          </div>
        )}
        {!correct && selectedFeedback && (
          <div className="text-sm text-red-700 dark:text-red-400">
            <MarkdownInline markdown={selectedFeedback} />
          </div>
        )}
        {!correct && activeHint && (
          <div className="mt-1 text-sm italic opacity-80">
            <MarkdownInline markdown={`Hint: ${activeHint}`} />
          </div>
        )}
      </div>
    </ScreenShell>
  );
}

export const def = defineScreen<TapChoiceScreenType>({ component: TapChoiceScreenRunner });
