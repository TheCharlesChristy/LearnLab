// `reveal-mechanism` screen — a worked mechanism with a MANDATORY
// self-explanation prompt (target spec #2: never a passive reveal). The
// learner must write their own answer before the model self-explanation and
// Continue become available; the answer isn't graded (self-explanation is
// generation, not a checkable fact), but genuine input is required.

import { useState } from 'react';

import { MarkdownInline } from '../markdown';

import { defineScreen } from './screen-def';
import type { ScreenRunnerProps } from './screen-def';
import { ScreenShell } from './ScreenShell';
import type { RevealMechanismScreen as RevealMechanismScreenType } from './types';

function RevealMechanismScreenRunner({
  screen,
  index,
  total,
  onAdvance,
  onInteraction,
}: ScreenRunnerProps<RevealMechanismScreenType>) {
  const [explanation, setExplanation] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <ScreenShell index={index} total={total} canAdvance={submitted} onAdvance={onAdvance}>
      <div className="text-lg">
        <MarkdownInline markdown={screen.body} />
      </div>
      <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-700">
        <label className="block font-medium" htmlFor={`${screen.id}-explain`}>
          <MarkdownInline markdown={screen.selfExplainPrompt} />
        </label>
        <textarea
          id={`${screen.id}-explain`}
          value={explanation}
          disabled={submitted}
          onChange={(e) => setExplanation(e.target.value)}
          rows={3}
          placeholder="Say it in your own words, then check…"
          className="mt-2 w-full rounded border px-2 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        />
        {!submitted && (
          <button
            type="button"
            onClick={() => {
              setSubmitted(true);
              const values = { '/self-explanation': explanation } as const;
              onInteraction?.({ type: 'interaction', values });
              onInteraction?.({ type: 'attempted', values });
            }}
            disabled={explanation.trim() === ''}
            className="mt-2 rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Check my thinking
          </button>
        )}
        {submitted && (
          <div className="mt-3 rounded-md bg-indigo-50 p-3 text-sm dark:bg-indigo-950/40">
            <MarkdownInline markdown={screen.selfExplainAnswer} />
          </div>
        )}
      </div>
    </ScreenShell>
  );
}

export const def = defineScreen<RevealMechanismScreenType>({
  component: RevealMechanismScreenRunner,
});
