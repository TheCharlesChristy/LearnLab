// Pure engagement logic — streak rollover, points, achievement unlocking.
// Deliberately dependency-free (no Dexie import) so it's unit-testable in
// isolation; ./db.ts is the only caller and supplies the Dexie-derived
// totals achievement checks need.

import type { Achievement, EngagementEvent, EngagementState } from './engagement-types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const INITIAL_ENGAGEMENT_STATE: EngagementState = {
  id: 'me',
  points: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDateKey: '',
  unlockedAchievements: [],
  updatedAt: 0,
};

/** Local (not UTC) date key, so a streak matches the learner's own day boundary. */
export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

type StreakFields = Pick<EngagementState, 'currentStreak' | 'longestStreak' | 'lastActiveDateKey'>;

/**
 * Same day as last activity -> unchanged. Exactly one calendar day later ->
 * streak +1. Any bigger gap (or first-ever activity) -> streak resets to 1.
 */
export function applyDailyActivity(prev: StreakFields, now: Date = new Date()): StreakFields {
  const today = dateKey(now);
  if (prev.lastActiveDateKey === today) return { ...prev };

  const prevDate = prev.lastActiveDateKey ? new Date(`${prev.lastActiveDateKey}T00:00:00`) : null;
  const todayDate = new Date(`${today}T00:00:00`);
  const isConsecutive = prevDate !== null && todayDate.getTime() - prevDate.getTime() === MS_PER_DAY;
  const currentStreak = isConsecutive ? prev.currentStreak + 1 : 1;

  return {
    currentStreak,
    longestStreak: Math.max(prev.longestStreak, currentStreak),
    lastActiveDateKey: today,
  };
}

/** Points awarded for one event. Quiz points scale with pass/perfect and assessment vs inline. */
export function pointsForEvent(event: EngagementEvent): number {
  switch (event.kind) {
    case 'lesson-complete':
      return 10;
    case 'flashcards-deck-complete':
      return 10;
    case 'game-complete':
      return 15;
    case 'quiz-finished': {
      const pass = event.ratio >= 0.5;
      if (!pass) return 0;
      if (event.isAssessment) return event.perfect ? 30 : 20;
      return event.perfect ? 25 : 15;
    }
  }
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-lesson', title: 'First Step', description: 'Complete your first lesson.', icon: 'Footprints' },
  { id: 'streak-3', title: 'On a Roll', description: 'Reach a 3-day learning streak.', icon: 'Flame' },
  { id: 'streak-7', title: 'Week Warrior', description: 'Reach a 7-day learning streak.', icon: 'Flame' },
  { id: 'first-module', title: 'Module Master', description: 'Complete your first module.', icon: 'Trophy' },
  { id: 'perfect-quiz', title: 'Perfectionist', description: 'Score 100% on an in-lesson quiz.', icon: 'Star' },
  {
    id: 'perfect-assessment',
    title: 'Top Marks',
    description: 'Score 100% on a module assessment.',
    icon: 'Award',
  },
  { id: 'flashcards-deck', title: 'Card Shark', description: 'Clear a full flashcard deck.', icon: 'Layers' },
  { id: 'game-complete', title: 'Playtime', description: 'Finish an interactive game widget.', icon: 'Gamepad2' },
];

export interface AchievementTotals {
  /** Count of completed lessons across all modules, after this event is applied. */
  totalLessonsCompleted: number;
  /** Count of completed modules, after this event is applied. */
  totalModulesCompleted: number;
}

interface AchievementInputs extends AchievementTotals {
  state: EngagementState;
  event: EngagementEvent;
}

const ACHIEVEMENT_CHECKS: Record<string, (i: AchievementInputs) => boolean> = {
  'first-lesson': (i) => i.event.kind === 'lesson-complete' && i.totalLessonsCompleted >= 1,
  'streak-3': (i) => i.state.currentStreak >= 3,
  'streak-7': (i) => i.state.currentStreak >= 7,
  'first-module': (i) => i.totalModulesCompleted >= 1,
  'perfect-quiz': (i) => i.event.kind === 'quiz-finished' && i.event.perfect && !i.event.isAssessment,
  'perfect-assessment': (i) => i.event.kind === 'quiz-finished' && i.event.perfect && i.event.isAssessment,
  'flashcards-deck': (i) => i.event.kind === 'flashcards-deck-complete',
  'game-complete': (i) => i.event.kind === 'game-complete',
};

/**
 * Apply one engagement event to the previous state: rolls the daily streak,
 * adds points, and unlocks any newly-earned achievements. Pure — the caller
 * (./db.ts) is responsible for persisting the result and for computing
 * `totals` from the rest of the database.
 */
export function applyEngagementEvent(
  prev: EngagementState,
  event: EngagementEvent,
  totals: AchievementTotals,
  now: Date = new Date(),
): { state: EngagementState; newlyUnlocked: Achievement[] } {
  const daily = applyDailyActivity(prev, now);
  const state: EngagementState = {
    ...prev,
    ...daily,
    points: prev.points + pointsForEvent(event),
    updatedAt: now.getTime(),
  };

  const inputs: AchievementInputs = { ...totals, state, event };
  const newlyUnlocked: Achievement[] = [];
  for (const achievement of ACHIEVEMENTS) {
    if (state.unlockedAchievements.includes(achievement.id)) continue;
    if (ACHIEVEMENT_CHECKS[achievement.id]?.(inputs)) newlyUnlocked.push(achievement);
  }
  if (newlyUnlocked.length > 0) {
    state.unlockedAchievements = [...state.unlockedAchievements, ...newlyUnlocked.map((a) => a.id)];
  }

  return { state, newlyUnlocked };
}
