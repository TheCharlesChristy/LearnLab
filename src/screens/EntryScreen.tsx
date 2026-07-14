// `entry` screen — generation-format checkpoint (numeric/text), reusing
// src/quiz/marking.ts's marking semantics verbatim (target spec #8: generation
// over passive recognition). Gating: the learner must submit a correct value
// themselves; a wrong submission surfaces the next rung of the hint ladder.

import { useState } from 'react';

import { MarkdownInline } from '../markdown';
import { parseNumericInput } from '../quiz/marking';

import { checkGenerationAnswer } from './marking-helpers';
import { defineScreen } from './screen-def';
import type { ScreenRunnerProps } from './screen-def';
import { ScreenShell } from './ScreenShell';
import type { EntryScreen as EntryScreenType } from './types';

function EntryScreenRunner({
  screen,
  index,
  total,
  onAdvance,
  onInteraction,
}: ScreenRunnerProps<EntryScreenType>) {
  const [value, setValue] = useState('');
  const [correct, setCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);

  function submit() {
    if (correct || value.trim() === '') return;
    const ok = checkGenerationAnswer(screen, value);
    const answer = screen.inputMode === 'numeric' ? parseNumericInput(value) : value;
    const values = {
      '/answer': answer ?? value,
      '/correct': ok,
    } as const;
    onInteraction?.({ type: 'interaction', values });
    onInteraction?.({ type: 'attempted', values });
    setShowFeedback(true);
    if (ok) {
      setCorrect(true);
    } else {
      setAttempts((n) => n + 1);
    }
  }

  const hints = screen.hints ?? [];
  const activeHint =
    !correct && attempts > 0 ? hints[Math.min(attempts - 1, hints.length - 1)] : undefined;
  const numericValue = screen.inputMode === 'numeric' ? parseNumericInput(value) : null;
  const numericInvalid =
    screen.inputMode === 'numeric' && value.trim() !== '' && numericValue === null;

  return (
    <ScreenShell index={index} total={total} canAdvance={correct} onAdvance={onAdvance}>
      <p className="text-lg font-medium">
        <MarkdownInline markdown={screen.prompt} />
      </p>
      <div className="mt-4">
        <label className="flex items-center gap-2" htmlFor={`${screen.id}-input`}>
          <span>
            Your answer{screen.inputMode === 'numeric' && screen.unit ? ` (${screen.unit})` : ''}
          </span>
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

export const def = defineScreen<EntryScreenType>({ component: EntryScreenRunner });
