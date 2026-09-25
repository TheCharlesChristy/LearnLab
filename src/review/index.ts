// Public API of the review subsystem (D-033): resolving review-queue rows
// back into real questions, planning sessions, and asking them.

export { ReviewCard, type CardResult, type ReviewCardProps } from './ReviewCard';
export { cardFromQuestion, cardFromScreen, resolveReviewItem, type ResolverDeps } from './resolve';
export { DEFAULT_SESSION_SIZE, interleaveByModule, planSession, predictedRecall } from './session';
export { displayTextAnswer } from './answer-display';
export type * from './types';
