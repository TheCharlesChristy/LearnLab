// Lesson context contract — orchestrator-pinned (T0.C).
// Provided by the app shell on lesson/assessment routes; consumed by the
// Markdown renderer (module-relative images, §4.5), widgets (`figure` src,
// `quiz` embeds) and the quiz engine (attempt recording, FR-QUIZ-003).
// Keeps subsystem boundaries clean (§3.5): widgets/quiz never import progress.

import { createContext, useContext } from 'react';

import type { Attempt } from '../progress/types';

export interface LessonContextValue {
  moduleId: string;
  /** URL prefix for module-relative files (lesson images, quiz JSON, .py items). Ends with '/'. */
  moduleBaseUrl: string;
  /** Write one attempts row (FR-QUIZ-003 / §5.5). Awaited; errors surface via toast (NFR-REL-001). */
  recordAttempt: (attempt: Omit<Attempt, 'attemptId'>) => Promise<void>;
  /**
   * Read/write a widget's persisted itemState (§5.5), pre-bound to this
   * lesson's moduleId — e.g. `flashcards` grades (§5.3). A native widget's
   * itemId is its own concern (see each widget's doc section); the same
   * itemId used across a read/write pair shares state, by design. Errors
   * surface via the progress layer's own onWriteError → toast (NFR-REL-001):
   * call `setItemState` fire-and-forget, don't wrap it in a swallowing catch.
   * Deliberately a plain context read/write (unlike PyItem's dedicated host
   * component) — native widgets have no pre-mount lifecycle sequencing to do.
   */
  getItemState: (itemId: string) => Promise<unknown>;
  setItemState: (itemId: string, state: unknown) => Promise<void>;
  /**
   * Grade one spaced-repetition review-queue item (§13 roadmap, D-021/D-022),
   * pre-bound to this lesson's moduleId. `itemId` is the caller's own
   * namespaced string (e.g. `flashcards` uses `${itemId}:${cardIndex}`,
   * `quiz`/assessments use `${quizId}:${questionId}`) — same "consumer
   * assembles it" precedent as recordAttempt/getItemState. Fire-and-forget;
   * errors surface via the progress layer's onWriteError → toast.
   */
  recordReview: (itemId: string, grade: 'again' | 'good') => Promise<void>;
  /**
   * Add an item to the review queue as if just graded "again", but ONLY if
   * it isn't already tracked — used to seed a missed quiz/assessment
   * question into the queue on first miss without disturbing a real
   * schedule a learner may already be progressing through.
   */
  seedReviewItem: (itemId: string) => Promise<void>;
}

export const LessonContext = createContext<LessonContextValue | null>(null);

export function useLessonContext(): LessonContextValue {
  const ctx = useContext(LessonContext);
  if (!ctx) throw new Error('useLessonContext must be used within a lesson route');
  return ctx;
}
