import type { MasteryEvidence } from '../mastery';
import type { ExperienceEvent, ExperienceRun } from '../run-state';
import type { ExperienceGraph } from '../types';

export const PLAYTEST_EXPORT_SCHEMA_VERSION = 1 as const;
export const DIAGNOSTICS_MAX_RUNS = 1_000;
export const DIAGNOSTICS_MAX_EVENTS = 10_000;
export const DIAGNOSTICS_MAX_EVIDENCE = 10_000;
export const PLAYTEST_EXPORT_MAX_BYTES = 256 * 1024;
export const DELAYED_OUTCOME_MIN_MS = 24 * 60 * 60 * 1000;

export interface DiagnosticSource {
  runs: readonly ExperienceRun[];
  events: readonly ExperienceEvent[];
  evidence: readonly MasteryEvidence[];
  graphs: readonly ExperienceGraph[];
}

export interface CountById {
  id: string;
  count: number;
}

export interface DiagnosticsBounds {
  retainedRuns: number;
  retainedEvents: number;
  retainedEvidence: number;
  droppedRuns: number;
  droppedEvents: number;
  droppedEvidence: number;
  ignoredCorruptEvents: number;
}

export interface DiagnosticsSummary {
  /** Caller-owned test-session label; it is never a learner identity. */
  sessionLabel: string;
  generatedAt: number;
  bounds: DiagnosticsBounds;
  timeToFirstAction: { samples: number; medianMs?: number };
  nodeExits: CountById[];
  attempts: { reported: number; boundariesMissingAttemptCount: number };
  hints: { reported: number; boundariesMissingHintCount: number };
  branches: CountById[];
  continuation: { eligibleCompletions: number; continued: number; rate?: number };
  delayedOutcomes: { eligibleEvidence: number; successes: number; rate?: number };
}

export interface DiagnosticsSessionInput extends DiagnosticSource {
  sessionLabel: string;
  generatedAt?: number;
}

export interface TesterExportConsent {
  /** The UI must set this only after an explicit tester confirmation. */
  confirmed: true;
  confirmedAt: number;
}

export interface PlaytestExport {
  kind: 'learnlab-playtest-diagnostics';
  schemaVersion: typeof PLAYTEST_EXPORT_SCHEMA_VERSION;
  exportedAt: number;
  consentedAt: number;
  includedFields: readonly PlaytestExportField[];
  sessions: readonly DiagnosticsSummary[];
}

export interface PlaytestExportField {
  name: string;
  description: string;
}

export interface DiagnosticsComparisonRow {
  metric: string;
  baseline?: number;
  verticalSlice?: number;
  delta?: number;
  unit: 'ms' | 'count' | 'rate';
}

export interface DiagnosticsComparison {
  baseline: DiagnosticsSummary;
  verticalSlice: DiagnosticsSummary;
  rows: DiagnosticsComparisonRow[];
}
