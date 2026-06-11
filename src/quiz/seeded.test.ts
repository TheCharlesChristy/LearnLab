import { describe, expect, it } from 'vitest';

import { attemptSeed, hashStringFnv1a, mulberry32, pickN, shuffle } from './seeded';

describe('hashStringFnv1a', () => {
  it('is deterministic and unsigned 32-bit', () => {
    const h = hashStringFnv1a('quiz-1:1');
    expect(h).toBe(hashStringFnv1a('quiz-1:1'));
    expect(Number.isInteger(h)).toBe(true);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThanOrEqual(0xffffffff);
  });
  it('differs across inputs', () => {
    expect(hashStringFnv1a('quiz-1:1')).not.toBe(hashStringFnv1a('quiz-1:2'));
    expect(hashStringFnv1a('a')).not.toBe(hashStringFnv1a('b'));
  });
});

describe('mulberry32', () => {
  it('yields the same sequence for the same seed', () => {
    const a = mulberry32(123);
    const b = mulberry32(123);
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    expect(seqA).toEqual(seqB);
  });
  it('yields different sequences for different seeds', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(Array.from({ length: 5 }, () => a())).not.toEqual(
      Array.from({ length: 5 }, () => b()),
    );
  });
  it('stays in [0, 1)', () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('attemptSeed', () => {
  it('equals hash(quizId + ":" + attemptNumber)', () => {
    expect(attemptSeed('quiz-1', 3)).toBe(hashStringFnv1a('quiz-1:3'));
  });
});

describe('shuffle', () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8];

  it('is a permutation and does not mutate the input', () => {
    const copy = [...items];
    const out = shuffle(items, mulberry32(7));
    expect(items).toEqual(copy);
    expect([...out].sort((a, b) => a - b)).toEqual(copy);
  });
  it('is reproducible for the same seed', () => {
    expect(shuffle(items, mulberry32(7))).toEqual(shuffle(items, mulberry32(7)));
  });
  it('differs for different seeds', () => {
    expect(shuffle(items, mulberry32(1))).not.toEqual(shuffle(items, mulberry32(2)));
  });
  it('handles empty and single-element arrays', () => {
    expect(shuffle([], mulberry32(1))).toEqual([]);
    expect(shuffle(['x'], mulberry32(1))).toEqual(['x']);
  });
});

describe('pickN', () => {
  const items = ['a', 'b', 'c', 'd', 'e', 'f'];

  it('picks n distinct items preserving original relative order', () => {
    const out = pickN(items, 3, mulberry32(9));
    expect(out).toHaveLength(3);
    expect(new Set(out).size).toBe(3);
    const positions = out.map((x) => items.indexOf(x));
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });
  it('is reproducible for the same seed and differs across seeds', () => {
    expect(pickN(items, 3, mulberry32(9))).toEqual(pickN(items, 3, mulberry32(9)));
    expect(pickN(items, 3, mulberry32(1))).not.toEqual(pickN(items, 3, mulberry32(4)));
  });
  it('returns a copy of everything when n >= length', () => {
    expect(pickN(items, 6, mulberry32(1))).toEqual(items);
    expect(pickN(items, 99, mulberry32(1))).toEqual(items);
  });
});
