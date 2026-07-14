/**
 * Domain-neutral, deterministic contract for F3. A caller supplies authored
 * observations and maps the accepted result to a normalised ActivityOutcome;
 * this module neither renders UI nor writes mission/run state.
 */

export interface ExperimentTrial {
  id: string;
  controlLabel: string;
  observationLabel: string;
}

export interface ExperimentInferTemplate {
  trials: readonly ExperimentTrial[];
  requiredTrialIds: readonly string[];
  ruleIds: readonly string[];
  correctRuleId: string;
  transferOptionIds: readonly string[];
  correctTransferId: string;
}

export interface ExperimentInferState {
  predictionId?: string;
  observedTrialIds: readonly string[];
  ruleId?: string;
  transferOptionId?: string;
}

export interface ExperimentInferEvaluation {
  observedTrialIds: readonly string[];
  missingTrialIds: readonly string[];
  canInfer: boolean;
  ruleCorrect: boolean;
  canTransfer: boolean;
  transferCorrect: boolean;
  completed: boolean;
  feedback: readonly string[];
}

function orderedKnown(ids: readonly string[], known: readonly string[]): string[] {
  const wanted = new Set(ids);
  return known.filter((id) => wanted.has(id));
}

/**
 * Completion requires evidence from every declared required trial, then a
 * supported rule and a correct transfer. Merely clicking controls cannot
 * complete a mechanic or manufacture a mastery-worthy result.
 */
export function evaluateExperimentInfer(
  template: ExperimentInferTemplate,
  state: ExperimentInferState,
): ExperimentInferEvaluation {
  const trialIds = template.trials.map((trial) => trial.id);
  const observedTrialIds = orderedKnown(state.observedTrialIds, trialIds);
  const observed = new Set(observedTrialIds);
  const missingTrialIds = template.requiredTrialIds.filter((id) => !observed.has(id));
  const canInfer = missingTrialIds.length === 0;
  const ruleCorrect = canInfer && state.ruleId === template.correctRuleId;
  const canTransfer = ruleCorrect;
  const transferCorrect = canTransfer && state.transferOptionId === template.correctTransferId;
  const feedback = [
    ...missingTrialIds.map((id) => `Run the ${id} condition before inferring a rule.`),
    ...(canInfer && !state.ruleId ? ['Choose the rule best supported by the observations.'] : []),
    ...(canInfer && state.ruleId && !ruleCorrect
      ? ['That rule does not account for every required observation. Compare the conditions again.']
      : []),
    ...(canTransfer && !state.transferOptionId ? ['Apply the inferred rule to the new case.'] : []),
    ...(canTransfer && state.transferOptionId && !transferCorrect
      ? ['Try the transfer case again using the rule you just supported.']
      : []),
    ...(transferCorrect
      ? ['The observations support the rule, and the rule transfers to the new case.']
      : []),
  ];
  return {
    observedTrialIds,
    missingTrialIds,
    canInfer,
    ruleCorrect,
    canTransfer,
    transferCorrect,
    completed: transferCorrect,
    feedback,
  };
}

export const EXPERIMENT_INFER_AUTHORING_METADATA = Object.freeze({
  title: 'Experiment and infer',
  learningUse:
    'Commit a prediction, vary one authored condition at a time, collect evidence, infer a rule, then transfer it.',
  masteryRule:
    'Emit mastery evidence only after every required observation, the supported rule, and the transfer case are complete.',
});
