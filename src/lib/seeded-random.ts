// Shared, dependency-free seeded-randomness primitives. Originally lived
// solely in src/quiz/seeded.ts (FR-QUIZ-002); extracted here so the game
// widget kit (src/widgets/game-kit/) can reuse the exact same deterministic
// shuffle without a quiz<->widgets cross-import (§3.5 subsystem boundaries).
// src/quiz/seeded.ts re-exports these, so existing importers are unaffected.

/** FNV-1a 32-bit string hash (unsigned). */
export function hashStringFnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Mulberry32 PRNG; returns a function yielding floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seeded Fisher–Yates shuffle; returns a new array, input untouched. */
export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = out[i] as T;
    out[i] = out[j] as T;
    out[j] = a;
  }
  return out;
}

/**
 * Pick `n` distinct items uniformly at random, preserving the items' original
 * relative order (question order is decided separately by shuffleQuestions).
 */
export function pickN<T>(items: readonly T[], n: number, rng: () => number): T[] {
  if (n >= items.length) return [...items];
  const indices = shuffle(
    items.map((_, i) => i),
    rng,
  )
    .slice(0, Math.max(0, n))
    .sort((a, b) => a - b);
  return indices.map((i) => items[i] as T);
}
