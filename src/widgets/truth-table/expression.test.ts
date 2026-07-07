// Behaviour tests for the `truth-table` expression parser/evaluator: every
// operator, precedence, parenthesized grouping, and every documented error
// case (each error names the exact problem, per the widget's contract).

import { describe, expect, it } from 'vitest';

import { evaluate, parseExpression } from './expression';
import type { Node } from './expression';

function parseOk(expr: string, maxInputs?: number) {
  const result = parseExpression(expr, maxInputs);
  if (!result.ok) throw new Error(`expected parse success for ${JSON.stringify(expr)}: ${result.error}`);
  return result;
}

function parseErr(expr: string, maxInputs?: number) {
  const result = parseExpression(expr, maxInputs);
  if (result.ok) throw new Error(`expected parse failure for ${JSON.stringify(expr)}`);
  return result.error;
}

describe('parseExpression — precedence', () => {
  it('parses "A AND B OR C" as (A AND B) OR C, not A AND (B OR C)', () => {
    const { ast } = parseOk('A AND B OR C');
    const expected: Node = {
      kind: 'binop',
      op: 'OR',
      left: { kind: 'binop', op: 'AND', left: { kind: 'var', name: 'A' }, right: { kind: 'var', name: 'B' } },
      right: { kind: 'var', name: 'C' },
    };
    expect(ast).toEqual(expected);
  });

  it('parses "NOT A AND B" as (NOT A) AND B', () => {
    const { ast } = parseOk('NOT A AND B');
    const expected: Node = {
      kind: 'binop',
      op: 'AND',
      left: { kind: 'not', operand: { kind: 'var', name: 'A' } },
      right: { kind: 'var', name: 'B' },
    };
    expect(ast).toEqual(expected);
  });

  it('parses "A OR B AND C" as A OR (B AND C) — AND binds tighter than OR', () => {
    const { ast } = parseOk('A OR B AND C');
    const expected: Node = {
      kind: 'binop',
      op: 'OR',
      left: { kind: 'var', name: 'A' },
      right: { kind: 'binop', op: 'AND', left: { kind: 'var', name: 'B' }, right: { kind: 'var', name: 'C' } },
    };
    expect(ast).toEqual(expected);
  });

  it('parses "A AND B XOR C" as (A AND B) XOR C — AND binds tighter than XOR', () => {
    const { ast } = parseOk('A AND B XOR C');
    const expected: Node = {
      kind: 'binop',
      op: 'XOR',
      left: { kind: 'binop', op: 'AND', left: { kind: 'var', name: 'A' }, right: { kind: 'var', name: 'B' } },
      right: { kind: 'var', name: 'C' },
    };
    expect(ast).toEqual(expected);
  });

  it('parses "A XOR B OR C" as (A XOR B) OR C — XOR binds tighter than OR', () => {
    const { ast } = parseOk('A XOR B OR C');
    const expected: Node = {
      kind: 'binop',
      op: 'OR',
      left: { kind: 'binop', op: 'XOR', left: { kind: 'var', name: 'A' }, right: { kind: 'var', name: 'B' } },
      right: { kind: 'var', name: 'C' },
    };
    expect(ast).toEqual(expected);
  });

  it('parses the worked example "A AND (B OR NOT C)" correctly', () => {
    const { ast, variables } = parseOk('A AND (B OR NOT C)');
    const expected: Node = {
      kind: 'binop',
      op: 'AND',
      left: { kind: 'var', name: 'A' },
      right: {
        kind: 'binop',
        op: 'OR',
        left: { kind: 'var', name: 'B' },
        right: { kind: 'not', operand: { kind: 'var', name: 'C' } },
      },
    };
    expect(ast).toEqual(expected);
    expect(variables).toEqual(['A', 'B', 'C']);
  });

  it('parenthesized grouping overrides default precedence: "(A OR B) AND C"', () => {
    const { ast } = parseOk('(A OR B) AND C');
    const expected: Node = {
      kind: 'binop',
      op: 'AND',
      left: { kind: 'binop', op: 'OR', left: { kind: 'var', name: 'A' }, right: { kind: 'var', name: 'B' } },
      right: { kind: 'var', name: 'C' },
    };
    expect(ast).toEqual(expected);
  });

  it('keywords are case-insensitive', () => {
    const { ast } = parseOk('A and B');
    expect(ast).toEqual({
      kind: 'binop',
      op: 'AND',
      left: { kind: 'var', name: 'A' },
      right: { kind: 'var', name: 'B' },
    });
  });
});

describe('parseExpression — variable order (first-appearance, left-to-right)', () => {
  it('lists variables in first-appearance order regardless of parenthesization', () => {
    const { variables } = parseOk('(C OR A) AND B');
    expect(variables).toEqual(['C', 'A', 'B']);
  });

  it('deduplicates repeated variables, keeping the first occurrence position', () => {
    const { variables } = parseOk('A AND B OR A');
    expect(variables).toEqual(['A', 'B']);
  });
});

describe('evaluate — all 6 operators against hand-computed 2-variable truth values', () => {
  const cases: [string, [boolean, boolean], boolean][] = [
    // AND
    ['A AND B', [false, false], false],
    ['A AND B', [false, true], false],
    ['A AND B', [true, false], false],
    ['A AND B', [true, true], true],
    // OR
    ['A OR B', [false, false], false],
    ['A OR B', [false, true], true],
    ['A OR B', [true, false], true],
    ['A OR B', [true, true], true],
    // XOR
    ['A XOR B', [false, false], false],
    ['A XOR B', [false, true], true],
    ['A XOR B', [true, false], true],
    ['A XOR B', [true, true], false],
    // NAND
    ['A NAND B', [false, false], true],
    ['A NAND B', [false, true], true],
    ['A NAND B', [true, false], true],
    ['A NAND B', [true, true], false],
    // NOR
    ['A NOR B', [false, false], true],
    ['A NOR B', [false, true], false],
    ['A NOR B', [true, false], false],
    ['A NOR B', [true, true], false],
  ];

  for (const [expr, [a, b], expected] of cases) {
    it(`"${expr}" with A=${a}, B=${b} => ${expected}`, () => {
      const { ast } = parseOk(expr);
      expect(evaluate(ast, { A: a, B: b })).toBe(expected);
    });
  }

  it('unary NOT negates its operand', () => {
    const { ast } = parseOk('NOT A');
    expect(evaluate(ast, { A: true })).toBe(false);
    expect(evaluate(ast, { A: false })).toBe(true);
  });

  it('double NOT is an identity', () => {
    const { ast } = parseOk('NOT NOT A');
    expect(evaluate(ast, { A: true })).toBe(true);
    expect(evaluate(ast, { A: false })).toBe(false);
  });
});

describe('parseExpression — reject (errors name the exact problem)', () => {
  it('rejects an empty expression', () => {
    expect(parseErr('')).toMatch(/expression is empty/);
    expect(parseErr('   ')).toMatch(/expression is empty/);
  });

  it('rejects unbalanced parens: missing close', () => {
    expect(parseErr('(A AND B')).toMatch(/unbalanced parentheses.*opened at position 0/);
  });

  it('rejects unbalanced parens: unmatched close', () => {
    expect(parseErr('A AND B)')).toMatch(/unbalanced parentheses.*unexpected "\)" at position 7/);
  });

  it('rejects unbalanced parens: opened but never closed with no content after', () => {
    expect(parseErr('A AND (')).toMatch(/unbalanced parentheses.*opened at position 6/);
  });

  it('rejects an unknown token/character', () => {
    expect(parseErr('A & B')).toMatch(/unexpected character "&" at position 2/);
  });

  it('rejects a lowercase variable name', () => {
    expect(parseErr('a AND B')).toMatch(/invalid variable name "a" at position 0/);
  });

  it('rejects an invalid/unknown operator name (adjacent atoms with no valid operator between them)', () => {
    expect(parseErr('A XAND B')).toMatch(/unexpected token "XAND" at position 2/);
  });

  it('rejects more than maxInputs (default 6) distinct variables', () => {
    const error = parseErr('A AND B AND C AND D AND E AND F AND G');
    expect(error).toMatch(/too many variables: found 7/);
    expect(error).toMatch(/max is 6/);
  });

  it('respects a custom smaller maxInputs', () => {
    expect(parseOk('A AND B', 2).variables).toEqual(['A', 'B']);
    expect(parseErr('A AND B AND C', 2)).toMatch(/too many variables: found 3.*max is 2/);
  });
});
