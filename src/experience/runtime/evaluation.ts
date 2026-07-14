// Pure, registered evaluation for Experience Runtime v2/B3.  Course packs
// provide data only: this module intentionally has no expression language or
// callback escape hatch.

import type { Condition, Goal, JsonPrimitive, StatePath } from '../types';
import type { RunStateValue, RunVariables } from '../run-state';

export type MasteryBand = 'low' | 'developing' | 'secure';

export interface ActivityOutcome {
  /** Activities must explicitly report completion; mounting is never evidence. */
  completed?: boolean;
  /** Normalised activity values, addressed with the same stable paths as goals. */
  values?: Partial<Record<StatePath, RunStateValue>>;
}

export interface EvaluationContext {
  state: RunVariables;
  outcome?: ActivityOutcome;
  masteryBySkill?: Readonly<Record<string, MasteryBand | undefined>>;
}

function sameValue(left: unknown, right: unknown): boolean {
  return Object.is(left, right);
}

function readOutcome(
  outcome: ActivityOutcome | undefined,
  path: StatePath,
): RunStateValue | undefined {
  return outcome?.values?.[path];
}

function setEquals(actual: unknown, expected: readonly string[]): boolean {
  if (!Array.isArray(actual) || !actual.every((value) => typeof value === 'string')) return false;
  if (actual.length !== expected.length) return false;
  return (
    new Set(actual).size === actual.length && actual.every((value) => expected.includes(value))
  );
}

/**
 * Evaluate a scene goal from an actual activity outcome.  Goals deliberately
 * do not read world state: the effect boundary is reached only after the
 * activity supplied evidence for this scene.
 */
export function evaluateGoal(goal: Goal, outcome: ActivityOutcome | undefined): boolean {
  switch (goal.operator) {
    case 'activity-complete':
      return outcome?.completed === true;
    case 'equals':
      return sameValue(readOutcome(outcome, goal.path), goal.value);
    case 'in-range': {
      const value = readOutcome(outcome, goal.path);
      return typeof value === 'number' && value >= goal.minimum && value <= goal.maximum;
    }
    case 'set-equals':
      return setEquals(readOutcome(outcome, goal.path), goal.values);
  }

  // Regex construction is intentionally contained in this registered
  // evaluator. Invalid authored patterns fail safely at the runner boundary;
  // they are never executable content.
  try {
    const value = readOutcome(outcome, goal.path);
    return typeof value === 'string' && new RegExp(goal.pattern).test(value);
  } catch {
    return false;
  }
}

/** Pure, deterministic condition registry used for ordered graph branches. */
export function evaluateCondition(condition: Condition, context: EvaluationContext): boolean {
  switch (condition.operator) {
    case 'state-equals':
      return sameValue(context.state[condition.path], condition.value);
    case 'state-in':
      return condition.values.some((value) => sameValue(context.state[condition.path], value));
    case 'outcome-equals':
      return sameValue(readOutcome(context.outcome, condition.path), condition.value);
    case 'mastery-band':
      return context.masteryBySkill?.[condition.skillId] === condition.band;
    case 'all':
      return condition.conditions.every((child) => evaluateCondition(child, context));
    case 'any':
      return condition.conditions.some((child) => evaluateCondition(child, context));
    case 'not':
      return !evaluateCondition(condition.condition, context);
  }
}

/** Narrow type used by conditions which only compare JSON primitives. */
export function outcomeValue(
  outcome: ActivityOutcome | undefined,
  path: StatePath,
): JsonPrimitive | undefined {
  const value = readOutcome(outcome, path);
  return Array.isArray(value) ? undefined : value;
}
