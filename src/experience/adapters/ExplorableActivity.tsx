import { useCallback, useRef, useState } from 'react';

import { Button } from '../../ui';
import FunctionGrapher from '../../widgets/function-grapher/FunctionGrapher';
import SignalScope from '../../widgets/signal-scope/SignalScope';
import EigenPlayground from '../../widgets/eigen-playground/EigenPlayground';
import { normaliseActivityOutcome } from '../plugins/contracts';
import type { ActivityOutcomeValue, ActivityPluginRenderProps } from '../plugins/contracts';

import type {
  EigenPlaygroundActivityProps,
  FunctionGrapherActivityProps,
  SignalScopeActivityProps,
} from './explorable-plugins';

type ExplorableProps =
  | FunctionGrapherActivityProps
  | SignalScopeActivityProps
  | EigenPlaygroundActivityProps;
type Observation = Readonly<Record<`/${string}`, ActivityOutcomeValue>>;

function ObservationControls({
  changed,
  hints,
  disabled,
  onRecord,
  onHintRequest,
}: {
  changed: boolean;
  hints: readonly string[] | undefined;
  disabled: boolean;
  onRecord: () => void;
  onHintRequest: () => void;
}) {
  const [hintLevel, setHintLevel] = useState(0);
  return (
    <div className="mt-4 space-y-3">
      <p aria-live="polite" className="text-sm text-slate-700 dark:text-slate-200">
        {changed
          ? 'A new setting is ready to record.'
          : 'Adjust the explorable before recording an observation.'}
      </p>
      {hints?.length ? (
        <div>
          <Button
            variant="secondary"
            disabled={hintLevel >= hints.length || disabled}
            onClick={() => {
              onHintRequest();
              setHintLevel((level) => Math.min(level + 1, hints.length));
            }}
          >
            {hintLevel === 0 ? 'Need a hint?' : 'Show another hint'}
          </Button>
          {hintLevel > 0 ? (
            <p className="mt-2 text-sm italic">Hint: {hints[hintLevel - 1]}</p>
          ) : null}
        </div>
      ) : null}
      <Button disabled={!changed || disabled} onClick={onRecord}>
        Record observation
      </Button>
    </div>
  );
}

/** A lazy adapter that preserves each widget's native keyboard/pointer control. */
export default function ExplorableActivity({
  props,
  disabled,
  reportOutcome,
}: ActivityPluginRenderProps<ExplorableProps>) {
  const [observation, setObservation] = useState<Observation | null>(null);
  const changed = useRef(false);
  const reported = useRef(false);
  const hintRequests = useRef(0);

  const observe = useCallback((values: Observation, didChange: boolean) => {
    setObservation(values);
    if (didChange) changed.current = true;
  }, []);

  const functionInitial = 'xmin' in props ? (props.xmin + props.xmax) / 2 : 0;
  const signalInitial =
    'freqMin' in props ? (props.freqInit ?? (props.freqMin + props.freqMax) / 2) : 0;
  const eigenInitial = 'bMin' in props ? (props.bInit ?? (props.bMin + props.bMax) / 2) : 0;
  const onTangentChange = useCallback(
    ({ x, gradient }: { x: number; gradient: number | null }) => {
      observe(
        { '/x': x, ...(gradient === null ? {} : { '/gradient': gradient }) },
        x !== functionInitial,
      );
    },
    [functionInitial, observe],
  );
  const onFrequencyChange = useCallback(
    ({ freq, peakFreq }: { freq: number; peakFreq: number | null }) => {
      observe(
        { '/frequency': freq, ...(peakFreq === null ? {} : { '/peak-frequency': peakFreq }) },
        freq !== signalInitial,
      );
    },
    [observe, signalInitial],
  );
  const onEigenChange = useCallback(
    ({
      b,
      angleDeg,
      eigenvalues,
    }: {
      b: number;
      angleDeg: number;
      eigenvalues: [number, number];
    }) => {
      observe(
        {
          '/covariance': b,
          '/angle-degrees': Number(angleDeg.toFixed(3)),
          '/eigenvalue-major': Number(eigenvalues[0].toFixed(3)),
          '/eigenvalue-minor': Number(eigenvalues[1].toFixed(3)),
        },
        b !== eigenInitial,
      );
    },
    [eigenInitial, observe],
  );

  function record() {
    if (disabled || reported.current || !changed.current || !observation) return;
    reported.current = true;
    reportOutcome(
      normaliseActivityOutcome({
        completed: true,
        values: observation,
        events: [
          ...Array.from({ length: hintRequests.current }, (_, sequence) => ({
            sequence,
            type: 'hint-requested' as const,
          })),
          { sequence: hintRequests.current, type: 'interaction' as const, values: observation },
          { sequence: hintRequests.current + 1, type: 'attempted' as const, values: observation },
        ],
      }),
    );
  }

  if ('xmin' in props) {
    return (
      <section aria-label="Function graph exploration">
        <FunctionGrapher
          expr={props.expr}
          xmin={props.xmin}
          xmax={props.xmax}
          ymin={props.ymin}
          ymax={props.ymax}
          grid={props.grid ?? true}
          tangent
          onTangentChange={onTangentChange}
        />
        <ObservationControls
          changed={changed.current}
          hints={props.hints}
          disabled={disabled}
          onRecord={record}
          onHintRequest={() => {
            hintRequests.current += 1;
          }}
        />
      </section>
    );
  }
  if ('freqMin' in props) {
    return (
      <section aria-label="Signal scope exploration">
        <SignalScope
          {...props}
          noiseAmount={props.noiseAmount ?? 0}
          showSpectrum={props.showSpectrum ?? true}
          onFrequencyChange={onFrequencyChange}
        />
        <ObservationControls
          changed={changed.current}
          hints={props.hints}
          disabled={disabled}
          onRecord={record}
          onHintRequest={() => {
            hintRequests.current += 1;
          }}
        />
      </section>
    );
  }
  return (
    <section aria-label="Eigen playground exploration">
      <EigenPlayground
        {...props}
        showPoints={props.showPoints ?? true}
        onEigenChange={onEigenChange}
      />
      <ObservationControls
        changed={changed.current}
        hints={props.hints}
        disabled={disabled}
        onRecord={record}
        onHintRequest={() => {
          hintRequests.current += 1;
        }}
      />
    </section>
  );
}
