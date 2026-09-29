import { hashStringFnv1a } from '../lib/seeded-random.ts';
import { parseNumericInput } from '../quiz/marking.ts';

/** A deliberately small arithmetic vocabulary; course data never contains executable code. */
export type NumericExpression =
  | { kind: 'number'; value: number }
  | { kind: 'variable'; name: string }
  | {
      kind: 'operation';
      op: 'add' | 'subtract' | 'multiply' | 'divide';
      left: NumericExpression;
      right: NumericExpression;
    };

export interface NumericVariantActivity {
  type: 'numeric-variant';
  question: string;
  variables: { name: string; values: number[] }[];
  answer: NumericExpression;
  /** Each factor converts the displayed unit into the formula's base unit. */
  units: { symbol: string; factor: number }[];
  /** Inclusive absolute tolerance, measured in the formula's base unit. */
  tolerance: number;
  /** Hand-derived endpoint and interior answers, checked against the formula. */
  checks: { values: Record<string, number>; answer: number }[];
}

const namePattern = /^[a-z][a-z0-9-]{0,31}$/;
const own = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key);
const close = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

function evaluate(expression: NumericExpression, values: Record<string, number>, depth = 0): number {
  if (depth > 6) throw new Error('Numeric answer formula is too deep');
  if (expression.kind === 'number') {
    if (!Number.isFinite(expression.value) || Object.keys(expression).length !== 2)
      throw new Error('Invalid numeric constant');
    return expression.value;
  }
  if (expression.kind === 'variable') {
    if (!own(values, expression.name) || Object.keys(expression).length !== 2)
      throw new Error(`Unknown numeric variable ${expression.name}`);
    return values[expression.name]!;
  }
  if (expression.kind !== 'operation' || Object.keys(expression).length !== 4)
    throw new Error('Unknown numeric answer operation');
  const left = evaluate(expression.left, values, depth + 1);
  const right = evaluate(expression.right, values, depth + 1);
  let result: number;
  switch (expression.op) {
    case 'add': result = left + right; break;
    case 'subtract': result = left - right; break;
    case 'multiply': result = left * right; break;
    case 'divide':
      if (Math.abs(right) < 1e-9) throw new Error('Numeric answer divides by zero or near-zero');
      result = left / right;
      break;
    default: throw new Error('Unknown numeric answer operation');
  }
  if (!Number.isFinite(result) || Math.abs(result) > 1e9)
    throw new Error('Numeric answer is non-finite or outside the supported range');
  return result;
}

/** Product order is stable, so an event log replays the same instance after reload. */
export function numericVariants(activity: NumericVariantActivity): Record<string, number>[] {
  return activity.variables.reduce<Record<string, number>[]>(
    (variants, variable) => variants.flatMap((values) =>
      variable.values.map((value) => ({ ...values, [variable.name]: value }))),
    [{}],
  );
}

export function numericAnswer(activity: NumericVariantActivity, values: Record<string, number>): number {
  return evaluate(activity.answer, values);
}

export function validateNumericVariant(activity: NumericVariantActivity, at: string): void {
  if (activity.variables.length < 1 || activity.variables.length > 4)
    throw new Error(`${at}: numeric task needs one to four variables`);
  const names = activity.variables.map((variable) => variable.name);
  if (new Set(names).size !== names.length || names.some((name) => !namePattern.test(name)))
    throw new Error(`${at}: invalid or duplicate numeric variable`);
  for (const variable of activity.variables) {
    if (variable.values.length < 2 || variable.values.length > 8 ||
        variable.values.some((value) => !Number.isFinite(value) || Math.abs(value) > 1e6) ||
        new Set(variable.values).size !== variable.values.length)
      throw new Error(`${at}: invalid values for ${variable.name}`);
  }
  const variants = numericVariants(activity);
  if (variants.length < 3 || variants.length > 128)
    throw new Error(`${at}: numeric task needs 3 to 128 bounded variants`);
  const placeholders = [...activity.question.matchAll(/\{([^{}]+)\}/g)].map((match) => match[1]!);
  if (activity.question.length < 10 || activity.question.length > 1200 ||
      /[{}]/.test(activity.question.replace(/\{[^{}]+\}/g, '')) ||
      placeholders.some((name) => !names.includes(name)) ||
      names.some((name) => !placeholders.includes(name)))
    throw new Error(`${at}: numeric question must use declared placeholders`);
  if (activity.units.length < 1 || activity.units.length > 4 ||
      activity.units[0]?.factor !== 1 ||
      new Set(activity.units.map((unit) => unit.symbol)).size !== activity.units.length ||
      activity.units.some((unit) => !/^[A-Za-zµΩ%]{1,12}$/.test(unit.symbol) ||
        !Number.isFinite(unit.factor) || unit.factor <= 0 || unit.factor > 1e9))
    throw new Error(`${at}: invalid numeric units`);
  if (!Number.isFinite(activity.tolerance) || activity.tolerance < 0 || activity.tolerance > 1000)
    throw new Error(`${at}: invalid numeric tolerance`);
  const answers = variants.map((values) => numericAnswer(activity, values));
  const distinct = [...new Set(answers.map((answer) => answer.toPrecision(12)))];
  if (distinct.length < 3) throw new Error(`${at}: numeric variants must yield fresh answers`);
  for (const name of names) {
    const changesAnswer = variants.some((first, i) => variants.some((second, j) =>
      first[name] !== second[name] &&
      names.every((other) => other === name || first[other] === second[other]) &&
      Math.abs(answers[i]! - answers[j]!) > activity.tolerance * 2));
    if (!changesAnswer) throw new Error(`${at}: ${name} does not materially change the answer`);
  }
  const sorted = [...answers].sort((a, b) => a - b);
  const positiveGaps = sorted.slice(1).map((answer, index) => answer - sorted[index]!)
    .filter((gap) => gap > 1e-12);
  const gap = Math.min(...positiveGaps);
  if (activity.tolerance * 2 >= gap)
    throw new Error(`${at}: numeric tolerance overlaps variant answers`);
  if (activity.checks.length < 3 || activity.checks.length > 8)
    throw new Error(`${at}: record at least three hand-derived numeric checks`);
  const checked = new Set<number>();
  for (const check of activity.checks) {
    if (!Number.isFinite(check.answer) || Object.keys(check.values).length !== names.length ||
        names.some((name) => !own(check.values, name)))
      throw new Error(`${at}: invalid hand-derived numeric check`);
    const index = variants.findIndex((values) => names.every((name) => values[name] === check.values[name]));
    if (index < 0 || checked.has(index) || !close(answers[index]!, check.answer))
      throw new Error(`${at}: hand-derived numeric check disagrees with formula`);
    checked.add(index);
  }
  if (!checked.has(0) || !checked.has(variants.length - 1))
    throw new Error(`${at}: numeric checks must include both range endpoints`);
}

export function numericVariantIndex(activity: NumericVariantActivity, startedAt: number, nodeId: string, restarts: number): number {
  return (hashStringFnv1a(`${startedAt}:${nodeId}`) + restarts) % numericVariants(activity).length;
}

export function numericQuestion(activity: NumericVariantActivity, index: number): string {
  const values = numericVariants(activity)[index];
  if (!values) throw new Error('Unknown numeric variant');
  return activity.question.replace(/\{([^{}]+)\}/g, (_, name: string) => String(values[name]));
}

export function markNumericVariant(activity: NumericVariantActivity, index: number, raw: string, unit: string): boolean {
  const value = parseNumericInput(raw);
  const selected = activity.units.find((candidate) => candidate.symbol === unit);
  const variables = numericVariants(activity)[index];
  if (value === null || !selected || !variables) return false;
  const converted = value * selected.factor;
  return Number.isFinite(converted) &&
    Math.abs(converted - numericAnswer(activity, variables)) <= activity.tolerance;
}
