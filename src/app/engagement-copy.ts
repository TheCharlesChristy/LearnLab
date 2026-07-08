// Celebration copy for engagement events — shared by the two LessonContext
// construction sites (LessonPage.tsx, AssessmentPage.tsx) so a quiz/deck/game
// milestone reads the same regardless of which page triggered it.

import type { Achievement, EngagementEvent, EngagementState } from '../progress';
import { pointsForEvent } from '../progress';

function baseMessage(event: EngagementEvent): string {
  switch (event.kind) {
    case 'lesson-complete':
      return 'Lesson complete!';
    case 'quiz-finished':
      if (event.perfect) {
        return event.isAssessment ? 'Perfect score on the assessment! 🎉' : 'Perfect score! 🎉';
      }
      return event.ratio >= 0.5 ? 'Nice work, quiz passed!' : 'Quiz finished, keep practising!';
    case 'flashcards-deck-complete':
      return 'Flashcard deck cleared! 🃏';
    case 'game-complete':
      return 'Nice, game complete! 🎮';
  }
}

function achievementSuffix(newlyUnlocked: Achievement[]): string {
  if (newlyUnlocked.length === 0) return '';
  const titles = newlyUnlocked.map((a) => a.title).join(', ');
  return `, achievement unlocked: ${titles}!`;
}

/** Full celebration message for one engagement event's recorded result. */
export function describeEngagementEvent(
  event: EngagementEvent,
  result: { state: EngagementState; newlyUnlocked: Achievement[] },
): string {
  const points = pointsForEvent(event);
  const streakSuffix =
    result.state.currentStreak >= 2 ? ` 🔥 streak of ${result.state.currentStreak} days` : '';
  return `${baseMessage(event)} +${points} points${streakSuffix}${achievementSuffix(result.newlyUnlocked)}`;
}
