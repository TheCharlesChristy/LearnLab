import { celebrate } from '../../ui';
import type { MasteryAggregation, MasteryBand, SkillMasterySummary } from '../mastery';

import { playCelebrationHaptic, playCelebrationSound } from './feedback';
import { permitsCelebrationMotion } from './preferences';
import type { SensoryPreferences } from './preferences';

export interface MasteryCelebration {
  skillId: string;
  band: Extract<MasteryBand, 'developing' | 'secure'>;
  message: string;
}

function celebratableBand(
  summary: SkillMasterySummary | undefined,
): MasteryCelebration['band'] | undefined {
  return summary?.status === 'classified' &&
    (summary.band === 'developing' || summary.band === 'secure')
    ? summary.band
    : undefined;
}

/**
 * Finds only newly demonstrated mastery. Activity, completion, points, and
 * authored celebration effects cannot enter this API, so they cannot trigger
 * an E4 celebration by themselves.
 */
export function planMasteryCelebrations(
  before: MasteryAggregation,
  after: MasteryAggregation,
): MasteryCelebration[] {
  const previous = new Map(
    before.summaries.map((summary) => [summary.skillId, celebratableBand(summary)]),
  );
  return after.summaries.flatMap((summary) => {
    const band = celebratableBand(summary);
    if (!band || previous.get(summary.skillId) === band) return [];
    const progress = previous.get(summary.skillId);
    if (progress === 'secure') return [];
    const message =
      band === 'secure'
        ? `Mastery demonstrated: ${summary.skillId}.`
        : `Developing mastery demonstrated: ${summary.skillId}.`;
    return [{ skillId: summary.skillId, band, message }];
  });
}

/**
 * Presents a plan created from mastery evidence. The text toast remains the
 * accessible acknowledgement; every sensory channel is optional and local.
 */
function presentMasteryCelebration(
  celebration: MasteryCelebration,
  preferences: SensoryPreferences,
): void {
  celebrate({ message: celebration.message, confetti: permitsCelebrationMotion(preferences) });
  playCelebrationSound(preferences);
  playCelebrationHaptic(preferences);
}

/**
 * The public runtime entry point. It deliberately accepts aggregations rather
 * than an arbitrary event or message, making mastery evidence the required
 * precondition for every E4 sensory celebration.
 */
export function celebrateMasteryTransitions(
  before: MasteryAggregation,
  after: MasteryAggregation,
  preferences: SensoryPreferences,
): MasteryCelebration[] {
  const celebrations = planMasteryCelebrations(before, after);
  for (const celebration of celebrations) presentMasteryCelebration(celebration, preferences);
  return celebrations;
}
