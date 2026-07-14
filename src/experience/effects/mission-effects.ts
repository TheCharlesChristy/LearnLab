import type { Effect } from '../types';
import type { MissionRunState } from '../mission';

export interface MissionEffectPlan {
  effects: Effect[];
  suppressed: Effect[];
}

function evidenceAlreadyRecorded(run: MissionRunState, effect: Extract<Effect, { operator: 'emit-evidence' }>): boolean {
  return run.evidence.some((evidence) =>
    evidence.skillId === effect.skillId
    && evidence.outcome === effect.outcome
    && evidence.independence === effect.independence
    && evidence.confidence === effect.confidence,
  );
}

/**
 * Select effects for an explicit checkpoint replay. State-writing effects are
 * deliberately omitted: a replay resumes the existing materialised run, not
 * a fresh attempt. Already-earned milestones and semantically identical
 * evidence are omitted as a second safety belt for runtime integrations.
 */
export function planCheckpointReplayEffects(
  run: MissionRunState,
  effects: readonly Effect[],
): MissionEffectPlan {
  // A reset without a persisted checkpoint is not a replay at all.  Refusing
  // to emit any effect makes that invalid request harmless at this boundary.
  if (!run.checkpoint) return { effects: [], suppressed: [...effects] };
  const selected: Effect[] = [];
  const suppressed: Effect[] = [];
  for (const effect of effects) {
    const replaySafe = effect.operator === 'checkpoint';
    const duplicateReward = effect.operator === 'celebrate' && run.celebrations.includes(effect.milestoneId);
    const duplicateUnlock = effect.operator === 'unlock-capability' && run.unlockedCapabilityIds.includes(effect.capabilityId);
    const duplicateEvidence = effect.operator === 'emit-evidence' && evidenceAlreadyRecorded(run, effect);
    if (replaySafe && !duplicateReward && !duplicateUnlock && !duplicateEvidence) selected.push(effect);
    else suppressed.push(effect);
  }
  return { effects: selected, suppressed };
}

export interface MissionEffectAnnouncement {
  key: string;
  message: string;
}

/**
 * Produces concise, non-decorative event text from registered effects only.
 * A UI can use the boundary event id as the key to announce each event once.
 */
export function describeMissionEffects(eventId: string, effects: readonly Effect[]): MissionEffectAnnouncement[] {
  return effects.flatMap((effect, index) => {
    switch (effect.operator) {
      case 'unlock-capability':
        return [{ key: `${eventId}:${index}`, message: `New capability unlocked: ${effect.capabilityId}.` }];
      case 'checkpoint':
        return [{ key: `${eventId}:${index}`, message: effect.label ? `Checkpoint saved: ${effect.label}.` : 'Checkpoint saved.' }];
      case 'celebrate':
        return [{ key: `${eventId}:${index}`, message: 'Mission milestone reached.' }];
      default:
        return [];
    }
  });
}
