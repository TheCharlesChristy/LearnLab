// `faded-step` screen — backward-faded worked example (target spec #6,
// extend-platform backlog item 4): the worked steps are shown, the final
// step is blanked for the learner to supply. Gating and marking are
// identical to `entry` (checkGenerationAnswer) — the difference is purely
// presentational: worked context precedes the blanked prompt.

import { useState } from 'react';

import { MarkdownInline } from '../markdown';
import { parseNumericInput } from '../quiz/marking';

import { checkGenerationAnswer } from './marking-helpers';
import { defineScreen } from './screen-def';
import type { ScreenRunnerProps } from './screen-def';
import { ScreenShell } from './ScreenShell';
import type { FadedStepScreen as FadedStepScreenType } from './types';

function FadedStepScreenRunner({
  screen,
  index,
  total,
  onAdvance,
}: ScreenRunnerProps<FadedStepScreenType>) {
  const [value, setValue] = useState('');
  const [correct, setCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);

  function submit() {
    if (correct || value.trim() === '') return;
    const ok = checkGenerationAnswer(screen, value);
    setShowFeedback(true);
    if (ok) setCorrect(true);
    else setAttempts((n) => n + 1);
  }

  const hints = screen.hints ?? [];
  const activeHint = !correct && attempts > 0 ? hints[Math.min(attempts - 1, hints.length - 1)] : undefined;
  const numericValue = screen.inputMode === 'numeric' ? parseNumericInput(value) : null;
  const numericInvalid =
    screen.inputMode === 'numeric' && value.trim() !== '' && numericValue === null;

  return (
    <ScreenShell index={index} total={total} canAdvance={correct} onAdvance={onAdvance}>
      <div className="text-sm">
        <MarkdownInline markdown={screen.worked} />
      </div>
      <p className="mt-4 border-t border-slate-200 pt-3 text-lg font-medium dark:border-slate-700">
        <MarkdownInline markdown={screen.prompt} />
      </p>
      <div className="mt-3">
        <label className="flex items-center gap-2" htmlFor={`${screen.id}-input`}>
          <span>Your answer{screen.inputMode === 'numeric' && screen.unit ? ` (${screen.unit})` : ''}</span>
          <input
            id={`${screen.id}-input`}
            type="text"
            inputMode={screen.inputMode === 'numeric' ? 'decimal' : 'text'}
            value={value}
            disabled={correct}
            onChange={(e) => {
              setValue(e.target.value);
              setShowFeedback(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
            className="rounded border px-2 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          />
        </label>
        {!correct && (
          <button
            type="button"
            onClick={submit}
            disabled={value.trim() === '' || numericInvalid}
            className="mt-2 rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Check
          </button>
        )}
      </div>
      <div aria-live="polite" className="mt-3 min-h-6">
        {correct && (
          <div className="font-semibold text-emerald-700 dark:text-emerald-400">
            <MarkdownInline
              markdown={screen.successFeedback ? `Correct! ${screen.successFeedback}` : 'Correct!'}
            />
          </div>
        )}
        {!correct && showFeedback && (
          <p className="text-sm text-red-700 dark:text-red-400">Not quite — try again.</p>
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

export const def = defineScreen<FadedStepScreenType>({ component: FadedStepScreenRunner });
