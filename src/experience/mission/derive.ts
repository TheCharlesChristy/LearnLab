import { evaluateCondition } from '../runtime';

import type {
  DerivedMissionCapability,
  DerivedMissionObjectiveStage,
  DerivedWorldMeter,
  MissionCapability,
  MissionObjective,
  MissionRunState,
  WorldMeter,
} from './types';

/**
 * Objective completion is calculated only from the materialised run.  The
 * same projection is therefore obtained after a reload/resume.
 */
export function deriveObjectiveStages(
  objective: MissionObjective,
  run: Pick<MissionRunState, 'variables'>,
): DerivedMissionObjectiveStage[] {
  let waitingForFirstIncomplete = true;
  return objective.stages.map((stage) => {
    const complete = evaluateCondition(stage.completeWhen, { state: run.variables });
    const status = complete
      ? 'complete'
      : waitingForFirstIncomplete
        ? 'current'
        : 'locked';
    if (!complete) waitingForFirstIncomplete = false;
    return { ...stage, status };
  });
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

/** Produces a colour-independent textual status plus a bounded visual value. */
export function deriveWorldMeters(
  meters: readonly WorldMeter[],
  run: Pick<MissionRunState, 'variables'>,
): DerivedWorldMeter[] {
  return meters.map((meter) => {
    const raw = run.variables[meter.path];
    if (typeof raw !== 'number') {
      return { ...meter, value: null, percentage: null, text: 'Status unavailable' };
    }
    const value = clamp(raw, meter.minimum, meter.maximum);
    const span = meter.maximum - meter.minimum;
    const percentage = span === 0 ? 100 : ((value - meter.minimum) / span) * 100;
    return {
      ...meter,
      value,
      percentage,
      text: `${value}${meter.unit ?? ''} of ${meter.maximum}${meter.unit ?? ''}`,
    };
  });
}

export function deriveCapabilities(
  capabilities: readonly MissionCapability[],
  run: Pick<MissionRunState, 'unlockedCapabilityIds'>,
): DerivedMissionCapability[] {
  const unlocked = new Set(run.unlockedCapabilityIds);
  return capabilities.map((capability) => ({ ...capability, unlocked: unlocked.has(capability.id) }));
}
