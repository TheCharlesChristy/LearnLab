import type { Condition, StatePath } from '../types';
import type { RunCheckpoint, RunEvidence, RunVariables } from '../run-state';

/**
 * The renderable part of a persisted run.  Mission chrome is deliberately a
 * projection: it never owns a second copy of learner state.
 */
export interface MissionRunState {
  currentNodeId: string;
  variables: RunVariables;
  unlockedCapabilityIds: readonly string[];
  celebrations: readonly string[];
  evidence: readonly RunEvidence[];
  checkpoint?: RunCheckpoint;
}

export interface MissionObjectiveStage {
  id: string;
  label: string;
  description?: string;
  /** A registered graph condition; never an executable author callback. */
  completeWhen: Condition;
}

export interface MissionObjective {
  title?: string;
  stages: readonly MissionObjectiveStage[];
}

export type MissionObjectiveStatus = 'complete' | 'current' | 'locked';

export interface DerivedMissionObjectiveStage extends MissionObjectiveStage {
  status: MissionObjectiveStatus;
}

/** A textual, bounded meter derived from a declared numeric run-state path. */
export interface WorldMeter {
  id: string;
  label: string;
  path: StatePath;
  minimum: number;
  maximum: number;
  unit?: string;
  /** Optional plain-language meaning of the low/high ends. */
  rangeLabel?: string;
}

export interface DerivedWorldMeter extends WorldMeter {
  value: number | null;
  percentage: number | null;
  text: string;
}

export interface MissionCapability {
  id: string;
  label: string;
  description?: string;
}

export interface DerivedMissionCapability extends MissionCapability {
  unlocked: boolean;
}

export interface MissionCheckpoint {
  nodeId: string;
  eventId: string;
  label?: string;
}
