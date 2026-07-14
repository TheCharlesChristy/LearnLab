import type { Effect, JsonPrimitive, StatePath } from '../types';

/** The first persisted version of the v2 run projection/event-log contract. */
export const RUN_STATE_SCHEMA_VERSION = 1 as const;

export type RunStateValue = JsonPrimitive | string[];
export type RunVariables = Record<StatePath, RunStateValue>;

export interface RunEvidence {
  skillId: string;
  outcome: 'success' | 'partial' | 'failure';
  independence: 'independent' | 'hinted' | 'assisted';
  confidence?: 'guessing' | 'think-so' | 'sure';
  eventId: string;
}

export interface RunCheckpoint {
  nodeId: string;
  eventId: string;
  label?: string;
}

export interface RunActivityTelemetry {
  attempts?: number;
  errors?: number;
  hintsUsed?: number;
  confidence?: 'guessing' | 'think-so' | 'sure';
  responseTimeMs?: number;
}

/** A materialised view used for rendering/resume; events remain the diagnostic source of truth. */
export interface ExperienceRun {
  runId: string;
  schemaVersion: typeof RUN_STATE_SCHEMA_VERSION;
  packId: string;
  experienceId: string;
  packVersion: string;
  experienceVersion: string;
  stateVersion: string;
  currentNodeId: string;
  variables: RunVariables;
  unlockedCapabilityIds: string[];
  branchHistory: string[];
  evidence: RunEvidence[];
  celebrations: string[];
  checkpoint?: RunCheckpoint;
  ending?: 'complete' | 'failed' | 'abandoned';
  eventCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface RunCreatedEvent {
  runId: string;
  schemaVersion: typeof RUN_STATE_SCHEMA_VERSION;
  sequence: 0;
  eventId: string;
  occurredAt: number;
  kind: 'run-created';
  initial: Omit<ExperienceRun, 'eventCount' | 'createdAt' | 'updatedAt'>;
}

export interface RunBoundaryEvent {
  runId: string;
  schemaVersion: typeof RUN_STATE_SCHEMA_VERSION;
  sequence: number;
  eventId: string;
  occurredAt: number;
  kind: 'boundary-applied';
  nodeId: string;
  nextNodeId?: string;
  ending?: 'complete' | 'failed' | 'abandoned';
  effects: Effect[];
  telemetry?: RunActivityTelemetry;
}

export type ExperienceEvent = RunCreatedEvent | RunBoundaryEvent;

export interface StartExperienceRunInput {
  runId: string;
  eventId: string;
  packId: string;
  experienceId: string;
  packVersion: string;
  experienceVersion: string;
  stateVersion: string;
  entryNodeId: string;
  initialVariables?: RunVariables;
  occurredAt?: number;
}

export interface RunBoundaryInput {
  eventId: string;
  nodeId: string;
  effects: Effect[];
  nextNodeId?: string;
  ending?: 'complete' | 'failed' | 'abandoned';
  telemetry?: RunActivityTelemetry;
  occurredAt?: number;
}
