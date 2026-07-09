// `manipulable-target` screen — wraps an existing explorable widget with a
// goal to hit instead of a bare manipulable (target spec #4: interaction
// first, formalism second). Phase 1 wraps `function-grapher` only, via its
// `onTangentChange` hook (src/widgets/function-grapher). Gating: Continue
// stays disabled until the live value satisfies the goal.

import { lazy, Suspense, useCallback, useState } from 'react';

import { MarkdownInline } from '../markdown';
import { Spinner } from '../ui';

import { defineScreen } from './screen-def';
import type { ScreenRunnerProps } from './screen-def';
import { ScreenShell } from './ScreenShell';
import type { ManipulableTargetScreen as ManipulableTargetScreenType } from './types';

const LazyFunctionGrapher = lazy(() => import('../widgets/function-grapher/FunctionGrapher'));

function goalMet(screen: ManipulableTargetScreenType, gradient: number | null): boolean {
  if (gradient === null) return false;
  return gradient >= screen.goal.min && gradient <= screen.goal.max;
}

function ManipulableTargetScreenRunner({
  screen,
  index,
  total,
  onAdvance,
}: ScreenRunnerProps<ManipulableTargetScreenType>) {
  const [gradient, setGradient] = useState<number | null>(null);
  const [hintLevel, setHintLevel] = useState(0);

  const handleTangentChange = useCallback((info: { x: number; gradient: number | null }) => {
    setGradient(info.gradient);
  }, []);

  const met = goalMet(screen, gradient);
  const hints = screen.hints ?? [];

  return (
    <ScreenShell index={index} total={total} canAdvance={met} onAdvance={onAdvance}>
      <p className="text-lg font-medium">
        <MarkdownInline markdown={screen.prompt} />
      </p>
      <p className="mt-1 text-sm italic opacity-80">{screen.goal.description}</p>
      <div className="mt-3">
        <Suspense fallback={<Spinner label="Loading graph…" />}>
          <LazyFunctionGrapher
            expr={screen.widgetProps.expr}
            xmin={screen.widgetProps.xmin ?? -10}
            xmax={screen.widgetProps.xmax ?? 10}
            ymin={screen.widgetProps.ymin}
            ymax={screen.widgetProps.ymax}
            tangent
            grid={screen.widgetProps.grid ?? true}
            onTangentChange={handleTangentChange}
          />
        </Suspense>
      </div>
      <div aria-live="polite" className="mt-2 min-h-6">
        {met && (
          <p className="font-semibold text-emerald-700 dark:text-emerald-400">
            {screen.successFeedback ?? "That's the target."}
          </p>
        )}
      </div>
      {!met && hints.length > 0 && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setHintLevel((n) => Math.min(n + 1, hints.length))}
            disabled={hintLevel >= hints.length}
            className="text-sm font-medium text-indigo-700 underline-offset-2 hover:underline disabled:opacity-50 dark:text-indigo-300"
          >
            {hintLevel === 0 ? 'Need a hint?' : 'Show another hint'}
          </button>
          {hintLevel > 0 && (
            <p className="mt-1 text-sm italic opacity-80">Hint: {hints[hintLevel - 1]}</p>
          )}
        </div>
      )}
    </ScreenShell>
  );
}

export const def = defineScreen<ManipulableTargetScreenType>({
  component: ManipulableTargetScreenRunner,
});
