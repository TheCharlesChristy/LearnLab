// Public API of the quiz subsystem (§3.5 — other subsystems import only this).

export { QuizEngine } from './QuizEngine';
export type { QuizEngineProps } from './QuizEngine';
export { markMcq, markMulti, markNumeric, markText, parseNumericInput } from './marking';
export {
  attemptSeed,
  hashStringFnv1a,
  mulberry32,
  pickN,
  shuffle,
} from './seeded';
export { prepareAttempt, toOriginalChoiceIndex } from './prepare';
export type { PreparedQuestion } from './prepare';
export type {
  Quiz,
  Question,
  McqQuestion,
  MultiQuestion,
  NumericQuestion,
  TextQuestion,
} from './types';
