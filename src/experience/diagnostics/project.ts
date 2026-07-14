import type { ExperienceEvent } from '../run-state';

import {
  DELAYED_OUTCOME_MIN_MS,
  DIAGNOSTICS_MAX_EVENTS,
  DIAGNOSTICS_MAX_EVIDENCE,
  DIAGNOSTICS_MAX_RUNS,
  type CountById,
  type DiagnosticSource,
  type DiagnosticsComparison,
  type DiagnosticsSessionInput,
  type DiagnosticsSummary,
} from './types';

function orderedCount(counts: ReadonlyMap<string, number>): CountById[] {
  return [...counts]
    .map(([id, count]) => ({ id, count }))
    .sort((left, right) => left.id.localeCompare(right.id));
}

function median(values: readonly number[]): number | undefined {
  if (!values.length) return undefined;
  const ordered = [...values].sort((left, right) => left - right);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1]! + ordered[middle]!) / 2;
}

function isFiniteTimestamp(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function boundSource(source: DiagnosticSource) {
  const runs = [...source.runs]
    .filter((run) => isFiniteTimestamp(run.createdAt) && isFiniteTimestamp(run.updatedAt))
    .sort(
      (left, right) => right.updatedAt - left.updatedAt || left.runId.localeCompare(right.runId),
    )
    .slice(0, DIAGNOSTICS_MAX_RUNS);
  const runIds = new Set(runs.map((run) => run.runId));
  const retainedEvents: ExperienceEvent[] = [];
  let ignoredCorruptEvents = 0;
  const seenEvents = new Set<string>();
  for (const event of [...source.events].sort(
    (left, right) =>
      left.occurredAt - right.occurredAt || left.eventId.localeCompare(right.eventId),
  )) {
    const key = `${event.runId}:${event.sequence}`;
    if (!runIds.has(event.runId) || !isFiniteTimestamp(event.occurredAt) || seenEvents.has(key)) {
      ignoredCorruptEvents++;
      continue;
    }
    seenEvents.add(key);
    if (retainedEvents.length < DIAGNOSTICS_MAX_EVENTS) retainedEvents.push(event);
  }
  const evidence = [...source.evidence]
    .filter((item) => isFiniteTimestamp(item.occurredAt) && !!item.id && !!item.content.packId)
    .sort((left, right) => right.occurredAt - left.occurredAt || left.id.localeCompare(right.id))
    .slice(0, DIAGNOSTICS_MAX_EVIDENCE);
  return {
    runs,
    events: retainedEvents,
    evidence,
    bounds: {
      retainedRuns: runs.length,
      retainedEvents: retainedEvents.length,
      retainedEvidence: evidence.length,
      droppedRuns: Math.max(0, source.runs.length - runs.length),
      droppedEvents: Math.max(
        0,
        source.events.length - retainedEvents.length - ignoredCorruptEvents,
      ),
      droppedEvidence: Math.max(0, source.evidence.length - evidence.length),
      ignoredCorruptEvents,
    },
  };
}

function completionAtByRun(events: readonly ExperienceEvent[]): Map<string, number> {
  const result = new Map<string, number>();
  for (const event of events) {
    if (event.kind === 'boundary-applied' && event.ending === 'complete')
      result.set(event.runId, event.occurredAt);
  }
  return result;
}

function graphBranchNodes(source: DiagnosticSource): Set<string> {
  return new Set(
    source.graphs.flatMap((graph) =>
      graph.nodes.flatMap((node) =>
        node.kind === 'scene' && node.transitions.branches.length ? [`${graph.id}:${node.id}`] : [],
      ),
    ),
  );
}

/**
 * Project local event/evidence records into a bounded summary. It contains no
 * learner identity, answers, free text, state variables, or raw event log.
 */
export function buildDiagnostics(input: DiagnosticsSessionInput): DiagnosticsSummary {
  const bounded = boundSource(input);
  const runById = new Map(bounded.runs.map((run) => [run.runId, run]));
  const firstAction = new Map<string, number>();
  const nodeExits = new Map<string, number>();
  const branches = new Map<string, number>();
  let reportedAttempts = 0;
  let missingAttempts = 0;
  let reportedHints = 0;
  let missingHints = 0;
  const branchNodes = graphBranchNodes(input);
  for (const event of bounded.events) {
    if (event.kind !== 'boundary-applied') continue;
    const run = runById.get(event.runId)!;
    const first = firstAction.get(event.runId);
    if (first === undefined || event.occurredAt < first)
      firstAction.set(event.runId, event.occurredAt);
    nodeExits.set(event.nodeId, (nodeExits.get(event.nodeId) ?? 0) + 1);
    if (branchNodes.has(`${run.experienceId}:${event.nodeId}`)) {
      const key = `${event.nodeId} → ${event.nextNodeId ?? event.nodeId}`;
      branches.set(key, (branches.get(key) ?? 0) + 1);
    }
    if (typeof event.telemetry?.attempts === 'number') reportedAttempts += event.telemetry.attempts;
    else missingAttempts++;
    if (typeof event.telemetry?.hintsUsed === 'number') reportedHints += event.telemetry.hintsUsed;
    else missingHints++;
  }
  const timeToFirstAction = [...firstAction].flatMap(([runId, at]) => {
    const createdAt = runById.get(runId)?.createdAt;
    return createdAt !== undefined && at >= createdAt ? [at - createdAt] : [];
  });
  const completionByRun = completionAtByRun(bounded.events);
  const completionRuns = bounded.runs.filter((run) => completionByRun.has(run.runId));
  const continued = completionRuns.filter((completed) =>
    bounded.runs.some(
      (candidate) =>
        candidate.packId === completed.packId &&
        candidate.runId !== completed.runId &&
        candidate.createdAt > completionByRun.get(completed.runId)!,
    ),
  ).length;
  const completionByPack = new Map<string, number>();
  for (const run of completionRuns) {
    const completedAt = completionByRun.get(run.runId)!;
    const previous = completionByPack.get(run.packId);
    if (previous === undefined || completedAt < previous)
      completionByPack.set(run.packId, completedAt);
  }
  const delayed = bounded.evidence.filter((item) => {
    const completion = completionByPack.get(item.content.packId);
    return (
      item.source === 'review' &&
      completion !== undefined &&
      item.occurredAt - completion >= DELAYED_OUTCOME_MIN_MS
    );
  });
  return {
    sessionLabel: input.sessionLabel,
    generatedAt: input.generatedAt ?? Date.now(),
    bounds: bounded.bounds,
    timeToFirstAction: {
      samples: timeToFirstAction.length,
      ...(median(timeToFirstAction) !== undefined ? { medianMs: median(timeToFirstAction) } : {}),
    },
    nodeExits: orderedCount(nodeExits),
    attempts: { reported: reportedAttempts, boundariesMissingAttemptCount: missingAttempts },
    hints: { reported: reportedHints, boundariesMissingHintCount: missingHints },
    branches: orderedCount(branches),
    continuation: {
      eligibleCompletions: completionRuns.length,
      continued,
      ...(completionRuns.length ? { rate: continued / completionRuns.length } : {}),
    },
    delayedOutcomes: {
      eligibleEvidence: delayed.length,
      successes: delayed.filter((item) => item.outcome === 'success').length,
      ...(delayed.length
        ? { rate: delayed.filter((item) => item.outcome === 'success').length / delayed.length }
        : {}),
    },
  };
}

function metric(
  metric: string,
  baseline: number | undefined,
  verticalSlice: number | undefined,
  unit: 'ms' | 'count' | 'rate',
) {
  return {
    metric,
    ...(baseline === undefined ? {} : { baseline }),
    ...(verticalSlice === undefined ? {} : { verticalSlice }),
    ...(baseline === undefined || verticalSlice === undefined
      ? {}
      : { delta: verticalSlice - baseline }),
    unit,
  };
}

/** Compare two local summaries. It is descriptive, never a release decision or ranking. */
export function compareDiagnostics(
  baseline: DiagnosticsSummary,
  verticalSlice: DiagnosticsSummary,
): DiagnosticsComparison {
  return {
    baseline,
    verticalSlice,
    rows: [
      metric(
        'Median time to first action',
        baseline.timeToFirstAction.medianMs,
        verticalSlice.timeToFirstAction.medianMs,
        'ms',
      ),
      metric(
        'Reported attempts',
        baseline.attempts.reported,
        verticalSlice.attempts.reported,
        'count',
      ),
      metric('Reported hints', baseline.hints.reported, verticalSlice.hints.reported, 'count'),
      metric(
        'Recorded branch decisions',
        baseline.branches.reduce((sum, item) => sum + item.count, 0),
        verticalSlice.branches.reduce((sum, item) => sum + item.count, 0),
        'count',
      ),
      metric(
        'Continuation rate',
        baseline.continuation.rate,
        verticalSlice.continuation.rate,
        'rate',
      ),
      metric(
        'Delayed outcome success rate',
        baseline.delayedOutcomes.rate,
        verticalSlice.delayedOutcomes.rate,
        'rate',
      ),
    ],
  };
}
