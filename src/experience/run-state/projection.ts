import { applyEffects } from './effects';
import {
  RUN_STATE_SCHEMA_VERSION,
  type ExperienceEvent,
  type ExperienceRun,
  type RunBoundaryEvent,
  type StartExperienceRunInput,
} from './types';

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function projectRunStart(input: StartExperienceRunInput): ExperienceRun {
  const at = input.occurredAt ?? Date.now();
  return {
    runId: input.runId,
    schemaVersion: RUN_STATE_SCHEMA_VERSION,
    packId: input.packId,
    experienceId: input.experienceId,
    packVersion: input.packVersion,
    experienceVersion: input.experienceVersion,
    stateVersion: input.stateVersion,
    currentNodeId: input.entryNodeId,
    variables: { ...(input.initialVariables ?? {}) },
    unlockedCapabilityIds: [],
    branchHistory: [input.entryNodeId],
    evidence: [],
    celebrations: [],
    eventCount: 1,
    createdAt: at,
    updatedAt: at,
  };
}

export function createRunEvent(
  input: StartExperienceRunInput,
  run: ExperienceRun,
): ExperienceEvent {
  return {
    runId: input.runId,
    schemaVersion: RUN_STATE_SCHEMA_VERSION,
    sequence: 0,
    eventId: input.eventId,
    occurredAt: run.createdAt,
    kind: 'run-created',
    initial: {
      runId: run.runId,
      schemaVersion: run.schemaVersion,
      packId: run.packId,
      experienceId: run.experienceId,
      packVersion: run.packVersion,
      experienceVersion: run.experienceVersion,
      stateVersion: run.stateVersion,
      currentNodeId: run.currentNodeId,
      variables: run.variables,
      unlockedCapabilityIds: run.unlockedCapabilityIds,
      branchHistory: run.branchHistory,
      evidence: run.evidence,
      celebrations: run.celebrations,
    },
  };
}

/** Applies one progress boundary. It intentionally performs no persistence. */
export function projectRunBoundary(run: ExperienceRun, event: RunBoundaryEvent): ExperienceRun {
  if (event.runId !== run.runId) throw new Error('Run event belongs to a different run.');
  if (event.sequence !== run.eventCount) throw new Error('Run event sequence is not contiguous.');
  const withEffects = applyEffects(run, event.effects, event);
  const nextNodeId = event.nextNodeId ?? event.nodeId;
  return {
    ...withEffects,
    currentNodeId: nextNodeId,
    branchHistory:
      run.branchHistory[run.branchHistory.length - 1] === nextNodeId
        ? withEffects.branchHistory
        : [...withEffects.branchHistory, nextNodeId],
    ...(event.ending ? { ending: event.ending } : {}),
    eventCount: run.eventCount + 1,
    updatedAt: event.occurredAt,
  };
}

/** Rebuild a projection from an append-only event stream, rejecting gaps and corruption. */
export function replayExperienceEvents(events: readonly ExperienceEvent[]): ExperienceRun {
  if (events.length === 0) throw new Error('Cannot replay an empty event log.');
  const ordered = [...events].sort((a, b) => a.sequence - b.sequence);
  const first = ordered[0];
  if (!first || first.kind !== 'run-created' || first.sequence !== 0) {
    throw new Error('Event log must begin with a run-created event at sequence 0.');
  }
  let run: ExperienceRun = {
    ...first.initial,
    variables: { ...first.initial.variables },
    unlockedCapabilityIds: [...first.initial.unlockedCapabilityIds],
    branchHistory: [...first.initial.branchHistory],
    evidence: [...first.initial.evidence],
    celebrations: [...first.initial.celebrations],
    eventCount: 1,
    createdAt: first.occurredAt,
    updatedAt: first.occurredAt,
  };
  const eventIds = new Set<string>([first.eventId]);
  for (let index = 1; index < ordered.length; index++) {
    const event = ordered[index]!;
    if (
      event.kind !== 'boundary-applied' ||
      event.sequence !== index ||
      eventIds.has(event.eventId)
    ) {
      throw new Error('Event log contains an invalid sequence or duplicate event id.');
    }
    eventIds.add(event.eventId);
    run = projectRunBoundary(run, event);
  }
  return run;
}

/** Validates the source-of-truth log agrees with its stored materialised projection. */
export function assertProjectionMatchesEvents(
  run: ExperienceRun,
  events: readonly ExperienceEvent[],
): void {
  const replayed = replayExperienceEvents(events);
  if (!sameJson(replayed, run)) {
    throw new Error(`Run ${run.runId} is corrupt: its projection does not match its event log.`);
  }
}
