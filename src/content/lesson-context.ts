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
}

export const LessonContext = createContext<LessonContextValue | null>(null);

export function useLessonContext(): LessonContextValue {
  const ctx = useContext(LessonContext);
  if (!ctx) throw new Error('useLessonContext must be used within a lesson route');
  return ctx;
}
