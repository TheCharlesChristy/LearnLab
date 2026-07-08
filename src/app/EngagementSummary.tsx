// Streak/points/achievements summary — delight-layer UI (D-027), not
// SRS-normative. Reads via useEngagement() (FR-PROG-001 read pattern); shows
// nothing until the learner's first tracked activity rather than a
// zero-value placeholder, since "no engagement row yet" and "streak of zero"
// aren't the same thing to show a brand-new learner.

import { Award, Flame, Footprints, Gamepad2, Layers, Star, Trophy, type LucideIcon } from 'lucide-react';

import { ACHIEVEMENTS, useEngagement } from '../progress';
import { Card } from '../ui';

const ACHIEVEMENT_ICONS: Record<string, LucideIcon> = {
  Footprints,
  Flame,
  Trophy,
  Star,
  Award,
  Layers,
  Gamepad2,
};

export function EngagementSummary() {
  const engagement = useEngagement();
  if (!engagement) return null;

  const unlocked = new Set(engagement.unlockedAchievements);

  return (
    <section className="mt-5" aria-label="Your streak and achievements">
      <Card className="flex flex-wrap items-center gap-6 py-4">
        <div className="flex items-center gap-2">
          <Flame
            aria-hidden
            className={
              engagement.currentStreak > 0
                ? 'h-6 w-6 text-orange-500'
                : 'h-6 w-6 text-slate-400 dark:text-slate-600'
            }
          />
          <div>
            <p className="text-lg font-semibold leading-tight">{engagement.currentStreak}</p>
            <p className="text-xs text-slate-600 dark:text-slate-300">day streak</p>
          </div>
        </div>
        <div>
          <p className="text-lg font-semibold leading-tight">{engagement.points}</p>
          <p className="text-xs text-slate-600 dark:text-slate-300">points</p>
        </div>
        <div>
          <p className="text-lg font-semibold leading-tight">{engagement.longestStreak}</p>
          <p className="text-xs text-slate-600 dark:text-slate-300">best streak</p>
        </div>
      </Card>

      <ul className="mt-3 flex flex-wrap gap-2" aria-label="Achievements">
        {ACHIEVEMENTS.map((achievement) => {
          const Icon = ACHIEVEMENT_ICONS[achievement.icon] ?? Star;
          const isUnlocked = unlocked.has(achievement.id);
          return (
            <li key={achievement.id}>
              <div
                title={`${achievement.title} — ${achievement.description}`}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${
                  isUnlocked
                    ? 'motion-safe:animate-pop border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200'
                    : 'border-slate-300 text-slate-400 dark:border-slate-700 dark:text-slate-600'
                }`}
              >
                <Icon aria-hidden className="h-4 w-4" />
                <span>{achievement.title}</span>
                <span className="sr-only">{isUnlocked ? ' — unlocked' : ' — locked'}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
