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
}

export const LessonContext = createContext<LessonContextValue | null>(null);

export function useLessonContext(): LessonContextValue {
  const ctx = useContext(LessonContext);
  if (!ctx) throw new Error('useLessonContext must be used within a lesson route');
  return ctx;
}
