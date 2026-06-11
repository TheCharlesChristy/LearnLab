import { afterEach, describe, expect, it, vi } from 'vitest';

import { markMcq, markMulti, markNumeric, markText, parseNumericInput } from './marking';
import type { McqQuestion, MultiQuestion, NumericQuestion, TextQuestion } from './types';

const mcq: McqQuestion = {
  type: 'mcq',
  id: 'm1',
  text: 'Pick one',
  choices: ['a', 'b', 'c'],
  answer: 2,
  explanation: 'because',
};

const multi: MultiQuestion = {
  type: 'multi',
  id: 'm2',
  text: 'Pick some',
  choices: ['a', 'b', 'c', 'd'],
  answers: [1, 3],
  explanation: 'because',
};

const numeric: NumericQuestion = {
  type: 'numeric',
  id: 'n1',
  text: 'How much?',
  answer: 96,
  tolerance: 0.5,
  explanation: 'because',
};

function textQ(accept: string[], caseSensitive?: boolean): TextQuestion {
  return { type: 'text', id: 't1', text: 'Name it', accept, caseSensitive, explanation: 'because' };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('markMcq', () => {
  it('is correct iff the selected index equals answer', () => {
    expect(markMcq(mcq, 2)).toBe(true);
    expect(markMcq(mcq, 0)).toBe(false);
    expect(markMcq(mcq, -1)).toBe(false);
  });
});

describe('markMulti (exact set, no partial credit)', () => {
  it('accepts the exact set in any order', () => {
    expect(markMulti(multi, [1, 3])).toBe(true);
    expect(markMulti(multi, [3, 1])).toBe(true);
  });
  it('rejects subsets', () => {
    expect(markMulti(multi, [1])).toBe(false);
    expect(markMulti(multi, [])).toBe(false);
  });
  it('rejects supersets', () => {
    expect(markMulti(multi, [1, 3, 0])).toBe(false);
  });
  it('rejects disjoint and partially-overlapping sets', () => {
    expect(markMulti(multi, [0, 2])).toBe(false);
    expect(markMulti(multi, [1, 2])).toBe(false);
  });
  it('ignores duplicate selections (set semantics)', () => {
    expect(markMulti(multi, [1, 1, 3])).toBe(true);
  });
});

describe('parseNumericInput (FR-QUIZ-004)', () => {
  it('parses decimals and negatives', () => {
    expect(parseNumericInput('-0.5')).toBe(-0.5);
    expect(parseNumericInput('3.25')).toBe(3.25);
    expect(parseNumericInput('.5')).toBe(0.5);
    expect(parseNumericInput('2.')).toBe(2);
    expect(parseNumericInput('+7')).toBe(7);
  });
  it('parses scientific notation', () => {
    expect(parseNumericInput('1.2e3')).toBe(1200);
    expect(parseNumericInput('1E-2')).toBe(0.01);
    expect(parseNumericInput('-3e+2')).toBe(-300);
  });
  it('trims surrounding whitespace', () => {
    expect(parseNumericInput('  42 ')).toBe(42);
  });
  it('rejects empty, bare sign, comma decimals and garbage', () => {
    expect(parseNumericInput('')).toBeNull();
    expect(parseNumericInput('   ')).toBeNull();
    expect(parseNumericInput('-')).toBeNull();
    expect(parseNumericInput('1,2')).toBeNull();
    expect(parseNumericInput('abc')).toBeNull();
    expect(parseNumericInput('1.2.3')).toBeNull();
    expect(parseNumericInput('1e')).toBeNull();
    expect(parseNumericInput('0x10')).toBeNull();
    expect(parseNumericInput('Infinity')).toBeNull();
    expect(parseNumericInput('NaN')).toBeNull();
  });
});

describe('markNumeric (abs(value − answer) ≤ tolerance)', () => {
  it('accepts exactly at the tolerance bound', () => {
    expect(markNumeric(numeric, 96.5)).toBe(true);
    expect(markNumeric(numeric, 95.5)).toBe(true);
  });
  it('rejects just outside the bound', () => {
    expect(markNumeric(numeric, 96.500001)).toBe(false);
    expect(markNumeric(numeric, 95.499999)).toBe(false);
  });
  it('zero tolerance requires exact equality', () => {
    const exact: NumericQuestion = { ...numeric, tolerance: 0 };
    expect(markNumeric(exact, 96)).toBe(true);
    expect(markNumeric(exact, 96.0000001)).toBe(false);
  });
});

describe('markText (full-match, any accept regex)', () => {
  it('full-matches, not partial — "cat" must not match "cats"', () => {
    const q = textQ(['cat']);
    expect(markText(q, 'cat')).toBe(true);
    expect(markText(q, 'cats')).toBe(false);
    expect(markText(q, 'a cat')).toBe(false);
  });
  it('trims input before matching', () => {
    expect(markText(textQ(['cat']), '  cat  ')).toBe(true);
  });
  it('is case-insensitive by default', () => {
    expect(markText(textQ(['Cat']), 'cAT')).toBe(true);
  });
  it('honours caseSensitive: true', () => {
    const q = textQ(['Cat'], true);
    expect(markText(q, 'Cat')).toBe(true);
    expect(markText(q, 'cat')).toBe(false);
  });
  it('accepts a match against ANY accept entry', () => {
    const q = textQ(['dog', 'cat|kitten']);
    expect(markText(q, 'kitten')).toBe(true);
    expect(markText(q, 'hamster')).toBe(false);
  });
  it('supports regex syntax (alternation already anchored as a group)', () => {
    // Without the (?:...) group, ^a|b$ would match 'a anything'.
    const q = textQ(['a|b']);
    expect(markText(q, 'a')).toBe(true);
    expect(markText(q, 'b')).toBe(true);
    expect(markText(q, 'a tail')).toBe(false);
  });
  it('treats an invalid regex source as no-match with console.warn', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const q = textQ(['([']);
    expect(markText(q, '([')).toBe(false);
    expect(warn).toHaveBeenCalledOnce();
  });
  it('still matches a later valid pattern after an invalid one', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const q = textQ(['([', 'cat']);
    expect(markText(q, 'cat')).toBe(true);
  });
});
