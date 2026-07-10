import { describe, expect, it } from 'vitest';

import { humanizeLatex } from './humanize-latex';

describe('humanizeLatex', () => {
  it('never throws and always returns a non-empty string for empty input', () => {
    expect(() => humanizeLatex('')).not.toThrow();
    expect(humanizeLatex('')).toBe('');
  });

  it('converts a simple power to "squared"/"cubed"', () => {
    expect(humanizeLatex('x^2')).toBe('x squared');
    expect(humanizeLatex('x^{2}')).toBe('x squared');
    expect(humanizeLatex('x^3')).toBe('x cubed');
  });

  it('converts a general power to "to the power of"', () => {
    expect(humanizeLatex('x^n')).toBe('x to the power of n');
    expect(humanizeLatex('x^{n-1}')).toBe('x to the power of n-1');
  });

  it('converts a fraction to "... over ..."', () => {
    expect(humanizeLatex('\\frac{1}{2}')).toBe('1 over 2');
    expect(humanizeLatex('\\dfrac{dy}{dx}')).toBe('dy over dx');
  });

  it('converts a real shipped example (differentiation-1: first-principles limit definition)', () => {
    const out = humanizeLatex('\\frac{f(x+h) - f(x)}{h}');
    expect(out).toBe('f(x+h) - f(x) over h');
  });

  it('converts \\lim_{h \\to 0} to spoken words', () => {
    const out = humanizeLatex('\\lim_{h \\to 0}');
    expect(out).toContain('the limit');
    expect(out).toContain('approaches');
    expect(out).not.toContain('\\');
    expect(out).not.toContain('{');
  });

  it('converts \\times to "times"', () => {
    expect(humanizeLatex('12 \\times 8')).toBe('12 times 8');
  });

  it('converts a square root', () => {
    expect(humanizeLatex('\\sqrt{2}')).toBe('the square root of 2');
  });

  it('strips unrecognised commands rather than throwing or leaving raw backslashes', () => {
    const out = humanizeLatex('\\operatorname{Re}(z)');
    expect(out).not.toContain('\\');
    expect(out).not.toContain('{');
    expect(out).not.toContain('}');
  });

  it('a real shipped polynomial expression reads sensibly', () => {
    const out = humanizeLatex('3x^4 - 5x^2 + 2');
    expect(out).toBe('3x to the power of 4 - 5x squared + 2');
  });
});
