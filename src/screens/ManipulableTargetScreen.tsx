// `manipulable-target` screen — wraps an existing explorable widget with a
// goal to hit instead of a bare manipulable (target spec #4: interaction
// first, formalism second). Three (widget, goal.kind) pairs are supported:
// `function-grapher`/`tangent-gradient-in-range` (src/widgets/function-grapher),
// `signal-scope`/`match-frequency-in-range` (src/widgets/signal-scope),
// `eigen-playground`/`eigenvector-angle-in-range` (src/widgets/eigen-playground).
// Gating: Continue stays disabled until the live value satisfies the goal.

import { lazy, Suspense, useCallback, useState } from 'react';

import { MarkdownInline } from '../markdown';
import { Spinner } from '../ui';

import { defineScreen } from './screen-def';
import type { ScreenRunnerProps } from './screen-def';
import { ScreenShell } from './ScreenShell';
import type { ManipulableTargetScreen as ManipulableTargetScreenType } from './types';

const LazyFunctionGrapher = lazy(() => import('../widgets/function-grapher/FunctionGrapher'));
const LazySignalScope = lazy(() => import('../widgets/signal-scope/SignalScope'));
const LazyEigenPlayground = lazy(() => import('../widgets/eigen-playground/EigenPlayground'));

function inRange(value: number | null, min: number, max: number): boolean {
  if (value === null) return false;
  return value >= min && value <= max;
}

function ManipulableTargetScreenRunner({
  screen,
  index,
  total,
  onAdvance,
}: ScreenRunnerProps<ManipulableTargetScreenType>) {
  const [liveValue, setLiveValue] = useState<number | null>(null);
  const [hintLevel, setHintLevel] = useState(0);

  const handleTangentChange = useCallback((info: { x: number; gradient: number | null }) => {
    setLiveValue(info.gradient);
  }, []);
  const handleFrequencyChange = useCallback((info: { freq: number; peakFreq: number | null }) => {
    setLiveValue(info.peakFreq);
  }, []);
  const handleEigenChange = useCallback((info: { angleDeg: number }) => {
    setLiveValue(info.angleDeg);
  }, []);

  const met = inRange(liveValue, screen.goal.min, screen.goal.max);
  const hints = screen.hints ?? [];

  return (
    <ScreenShell index={index} total={total} canAdvance={met} onAdvance={onAdvance}>
      <p className="text-lg font-medium">
        <MarkdownInline markdown={screen.prompt} />
      </p>
      <p className="mt-1 text-sm italic opacity-80">{screen.goal.description}</p>
      <div className="mt-3">
        <Suspense fallback={<Spinner label="Loading widget…" />}>
          {screen.widget === 'function-grapher' && (
            <LazyFunctionGrapher
              expr={screen.widgetProps.expr ?? 'x'}
              xmin={screen.widgetProps.xmin ?? -10}
              xmax={screen.widgetProps.xmax ?? 10}
              ymin={screen.widgetProps.ymin}
              ymax={screen.widgetProps.ymax}
              tangent
              grid={screen.widgetProps.grid ?? true}
              onTangentChange={handleTangentChange}
            />
          )}
          {screen.widget === 'signal-scope' && (
            <LazySignalScope
              expr={screen.widgetProps.expr ?? 'sin(2*pi*f*t)'}
              sampleRate={screen.widgetProps.sampleRate ?? 64}
              duration={screen.widgetProps.duration ?? 4}
              noiseAmount={screen.widgetProps.noiseAmount ?? 0}
              freqMin={screen.widgetProps.freqMin ?? 0.5}
              freqMax={screen.widgetProps.freqMax ?? 8}
              freqInit={screen.widgetProps.freqInit}
              showSpectrum={screen.widgetProps.showSpectrum ?? true}
              onFrequencyChange={handleFrequencyChange}
            />
          )}
          {screen.widget === 'eigen-playground' && (
            <LazyEigenPlayground
              a={screen.widgetProps.a ?? 2}
              c={screen.widgetProps.c ?? 1}
              bMin={screen.widgetProps.bMin ?? -1.5}
              bMax={screen.widgetProps.bMax ?? 1.5}
              bInit={screen.widgetProps.bInit}
              showPoints={screen.widgetProps.showPoints ?? true}
              onEigenChange={handleEigenChange}
            />
          )}
        </Suspense>
      </div>
      <div aria-live="polite" className="mt-2 min-h-6">
        {met && (
          <div className="font-semibold text-emerald-700 dark:text-emerald-400">
            <MarkdownInline markdown={screen.successFeedback ?? "That's the target."} />
          </div>
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
            <div className="mt-1 text-sm italic opacity-80">
              <MarkdownInline markdown={`Hint: ${hints[hintLevel - 1]}`} />
            </div>
          )}
        </div>
      )}
    </ScreenShell>
  );
}

export const def = defineScreen<ManipulableTargetScreenType>({
  component: ManipulableTargetScreenRunner,
});
