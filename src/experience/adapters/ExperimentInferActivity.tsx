import { useMemo, useRef, useState } from 'react';

import { normaliseActivityOutcome } from '../plugins/contracts';
import type { ActivityEvent, ActivityPluginRenderProps } from '../plugins/contracts';
import { evaluateExperimentInfer } from '../templates/experiment-infer';
import { shuffleForSeed } from '../plugins/reference/seeded';

import type { ExperimentInferActivityProps } from './experiment-infer-plugin';

const BUTTON =
  'min-h-11 rounded-md border border-slate-300 px-3 py-2 text-left text-sm font-medium hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-700';

export default function ExperimentInferActivity({
  props,
  context,
  disabled,
  reportOutcome,
}: ActivityPluginRenderProps<ExperimentInferActivityProps>) {
  const [prediction, setPrediction] = useState<string>();
  const [observations, setObservations] = useState<string[]>([]);
  const [rule, setRule] = useState<string>();
  const [transfer, setTransfer] = useState<string>();
  const events = useRef<Array<Omit<ActivityEvent, 'schemaVersion'>>>([]);
  const reported = useRef(false);
  const trials = useMemo(
    () => shuffleForSeed(props.trials, context.seed),
    [context.seed, props.trials],
  );
  const evaluation = evaluateExperimentInfer(
    {
      trials: props.trials,
      requiredTrialIds: props.requiredTrialIds,
      ruleIds: props.rules.map((option) => option.id),
      correctRuleId: props.correctRuleId,
      transferOptionIds: props.transferOptions.map((option) => option.id),
      correctTransferId: props.correctTransferId,
    },
    {
      predictionId: prediction,
      observedTrialIds: observations,
      ruleId: rule,
      transferOptionId: transfer,
    },
  );

  function record(
    type: ActivityEvent['type'],
    values: Record<`/${string}`, string | readonly string[]>,
  ) {
    events.current.push({ sequence: events.current.length, type, values });
  }

  function choosePrediction(id: string) {
    if (disabled || prediction) return;
    setPrediction(id);
    record('interaction', { '/prediction': id });
  }

  function runTrial(id: string) {
    if (disabled || !prediction || observations.includes(id)) return;
    const next = [...observations, id];
    setObservations(next);
    record('interaction', { '/observations': next });
  }

  function chooseRule(id: string) {
    if (disabled || !evaluation.canInfer || evaluation.ruleCorrect) return;
    setRule(id);
    record('interaction', { '/rule': id });
    record('attempted', { '/rule': id });
  }

  function chooseTransfer(id: string) {
    if (disabled || !evaluation.canTransfer || reported.current) return;
    setTransfer(id);
    record('interaction', { '/transfer': id });
    record('attempted', { '/transfer': id });
    if (id !== props.correctTransferId) return;
    reported.current = true;
    reportOutcome(
      normaliseActivityOutcome({
        completed: true,
        values: {
          '/prediction': prediction!,
          '/observations': evaluation.observedTrialIds,
          '/rule': props.correctRuleId,
          '/transfer': id,
        },
        events: events.current,
      }),
    );
  }

  return (
    <section aria-label="Experiment and infer activity" className="space-y-5">
      <h2 className="text-lg font-bold">{props.title}</h2>
      <fieldset>
        <legend className="font-semibold">{props.predictionPrompt}</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {props.predictions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={BUTTON}
              aria-pressed={prediction === option.id}
              disabled={disabled || !!prediction}
              onClick={() => choosePrediction(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset disabled={!prediction || disabled}>
        <legend className="font-semibold">Run controlled conditions</legend>
        <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
          Change only the authored condition, then record the observation shown for it.
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {trials.map((trial) => (
            <button
              key={trial.id}
              type="button"
              className={BUTTON}
              disabled={!prediction || disabled || observations.includes(trial.id)}
              onClick={() => runTrial(trial.id)}
            >
              {trial.controlLabel}
            </button>
          ))}
        </div>
        {observations.length ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
            {props.trials
              .filter((trial) => observations.includes(trial.id))
              .map((trial) => (
                <li key={trial.id}>{trial.observationLabel}</li>
              ))}
          </ul>
        ) : null}
      </fieldset>
      <fieldset disabled={!evaluation.canInfer || disabled}>
        <legend className="font-semibold">{props.inferencePrompt}</legend>
        <div className="mt-2 grid gap-2">
          {props.rules.map((option) => (
            <button
              key={option.id}
              type="button"
              className={BUTTON}
              aria-pressed={rule === option.id}
              disabled={!evaluation.canInfer || disabled || evaluation.ruleCorrect}
              onClick={() => chooseRule(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset disabled={!evaluation.canTransfer || disabled}>
        <legend className="font-semibold">{props.transferPrompt}</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {props.transferOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className={BUTTON}
              aria-pressed={transfer === option.id}
              disabled={!evaluation.canTransfer || disabled || reported.current}
              onClick={() => chooseTransfer(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>
      <p aria-live="polite" className="rounded-md bg-slate-100 p-3 text-sm dark:bg-slate-800">
        {evaluation.feedback.at(-1) ?? 'Commit a prediction, then run the conditions.'}
      </p>
    </section>
  );
}
