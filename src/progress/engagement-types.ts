// Engagement (streaks/points/achievements) — additive, non-normative.
// Not part of SRS §5.5's pinned schema (./types.ts); grown the same way
// D-021 grew reviewState onto it: a new Dexie table plus an
// exportVersion bump, old exports without it treated as empty on import.

/** Singleton row (id is always 'me' — one learner, no accounts). */
export interface EngagementState {
  id: 'me';
  points: number;
  currentStreak: number;
  longestStreak: number;
  /** Local date key (YYYY-MM-DD) of the last day that counted toward the streak. */
  lastActiveDateKey: string;
  unlockedAchievements: string[];
  updatedAt: number;
}

export type EngagementEvent =
  | { kind: 'lesson-complete' }
  | { kind: 'quiz-finished'; ratio: number; perfect: boolean; isAssessment: boolean }
  | { kind: 'flashcards-deck-complete' }
  | { kind: 'game-complete' };

export interface Achievement {
  id: string;
  title: string;
  description: string;
  /** lucide-react icon name, resolved by the UI layer — kept as a string so this file stays presentation-free. */
  icon: string;
}
