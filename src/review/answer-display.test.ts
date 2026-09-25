import { describe, expect, it } from 'vitest';

import { displayTextAnswer } from './answer-display';

describe('displayTextAnswer', () => {
  it.each([
    ['perpendicular', 'perpendicular'],
    ['same', 'same'],
    ['7\\s*(√|sqrt)\\s*2', '7√2'],
    ['3\\s*(√|sqrt)\\(?5\\)?\\s*/\\s*5', '3√5 / 5'],
    ['2\\s*-\\s*(√|sqrt)\\s*3', '2 - √3'],
    ['11\\s*\\+\\s*6\\s*(√|sqrt)\\s*3', '11 + 6√3'],
    ['2n\\s*\\+\\s*1', '2n + 1'],
    ['counter-?example', 'counterexample'],
    ['x\\s*<\\s*-2\\s*or\\s*x\\s*>\\s*3', 'x < -2 or x > 3'],
  ])('%s → %s', (src, expected) => {
    expect(displayTextAnswer([src])).toBe(expected);
  });

  it('gives up on patterns it cannot make readable', () => {
    expect(displayTextAnswer(['[a-z]+'])).toBeNull();
    expect(displayTextAnswer(['\\d{3}'])).toBeNull();
    expect(displayTextAnswer([])).toBeNull();
    expect(displayTextAnswer(undefined)).toBeNull();
  });
});
