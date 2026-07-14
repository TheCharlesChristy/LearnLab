import type { Goal, StatePath } from '../types';

import type { ActivityOutcome } from './contracts';

export interface GoalEvaluator<GoalType extends Goal = Goal> {
  operator: GoalType['operator'];
  /** Author-facing marking rule. This is part of the public capability contract. */
  markingSemantics: string;
  evaluate: (goal: GoalType, outcome: ActivityOutcome) => boolean;
}

function valueAt(outcome: ActivityOutcome, path: StatePath) {
  return outcome.values[path];
}

function exactStringSet(actual: unknown, expected: readonly string[]): boolean {
  if (!Array.isArray(actual) || !actual.every((entry) => typeof entry === 'string')) return false;
  if (new Set(actual).size !== actual.length || new Set(expected).size !== expected.length) return false;
  return actual.length === expected.length && actual.every((entry) => expected.includes(entry));
}

type GoalByOperator<Operator extends Goal['operator']> = Extract<Goal, { operator: Operator }>;

const activityComplete: GoalEvaluator<GoalByOperator<'activity-complete'>> = {
  operator: 'activity-complete',
  markingSemantics: 'Passes only when the normalised outcome has completed exactly true.',
  evaluate: (_goal, outcome) => outcome.completed === true,
};

const equals: GoalEvaluator<GoalByOperator<'equals'>> = {
  operator: 'equals',
  markingSemantics:
    'Passes only when the normalised value at path is Object.is-equal to the authored primitive.',
  evaluate: (goal, outcome) => Object.is(valueAt(outcome, goal.path), goal.value),
};

const inRange: GoalEvaluator<GoalByOperator<'in-range'>> = {
  operator: 'in-range',
  markingSemantics:
    'Passes only for a finite numeric value inclusively between authored minimum and maximum.',
  evaluate: (goal, outcome) => {
    const value = valueAt(outcome, goal.path);
    return typeof value === 'number' && Number.isFinite(value) && value >= goal.minimum && value <= goal.maximum;
  },
};

const setEquals: GoalEvaluator<GoalByOperator<'set-equals'>> = {
  operator: 'set-equals',
  markingSemantics:
    'Passes only when both authored and reported string sets contain every member exactly once, irrespective of order.',
  evaluate: (goal, outcome) => exactStringSet(valueAt(outcome, goal.path), goal.values),
};

const regexMatch: GoalEvaluator<GoalByOperator<'regex-match'>> = {
  operator: 'regex-match',
  markingSemantics:
    'Passes only when the reported value is a string matched by the authored ECMAScript pattern; invalid patterns fail safely.',
  evaluate: (goal, outcome) => {
    try {
      const value = valueAt(outcome, goal.path);
      return typeof value === 'string' && new RegExp(goal.pattern).test(value);
    } catch {
      return false;
    }
  },
};

/** Closed, pure evaluator registry. Content cannot supply executable goal code. */
export const goalEvaluatorRegistry = Object.freeze({
  'activity-complete': activityComplete,
  equals,
  'in-range': inRange,
  'set-equals': setEquals,
  'regex-match': regexMatch,
});

/** Evaluate a declared graph goal against one normalised activity outcome. */
export function evaluateActivityGoal(goal: Goal, outcome: ActivityOutcome): boolean {
  switch (goal.operator) {
    case 'activity-complete':
      return goalEvaluatorRegistry['activity-complete'].evaluate(goal, outcome);
    case 'equals':
      return goalEvaluatorRegistry.equals.evaluate(goal, outcome);
    case 'in-range':
      return goalEvaluatorRegistry['in-range'].evaluate(goal, outcome);
    case 'set-equals':
      return goalEvaluatorRegistry['set-equals'].evaluate(goal, outcome);
    case 'regex-match':
      return goalEvaluatorRegistry['regex-match'].evaluate(goal, outcome);
  }
}
