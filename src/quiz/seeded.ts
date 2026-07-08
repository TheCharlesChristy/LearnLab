// Seeded randomness for reproducible quiz attempts — FR-QUIZ-002.
// seed = hash(quizId + ':' + attemptNumber); PRNG = mulberry32.
//
// The generic primitives (hash/PRNG/shuffle/pickN) now live in the
// dependency-free ../lib/seeded-random.ts, shared with the game-widget kit
// (src/widgets/game-kit/) so both can use one deterministic-shuffle
// implementation without a quiz<->widgets cross-import (§3.5). Re-exported
// here so existing importers of this module are unaffected.

import { hashStringFnv1a, mulberry32, pickN, shuffle } from '../lib/seeded-random';

export { hashStringFnv1a, mulberry32, pickN, shuffle };

/** Deterministic seed for one quiz attempt (FR-QUIZ-002). */
export function attemptSeed(quizId: string, attemptNumber: number): number {
  return hashStringFnv1a(`${quizId}:${attemptNumber}`);
}
