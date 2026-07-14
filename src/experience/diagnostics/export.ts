import {
  PLAYTEST_EXPORT_MAX_BYTES,
  PLAYTEST_EXPORT_SCHEMA_VERSION,
  type DiagnosticsSummary,
  type PlaytestExport,
  type PlaytestExportField,
  type TesterExportConsent,
} from './types';

export const PLAYTEST_EXPORT_FIELDS: readonly PlaytestExportField[] = [
  { name: 'sessionLabel', description: 'Tester-provided session label, not a learner identity.' },
  {
    name: 'generatedAt',
    description: 'When the local summary was generated (epoch milliseconds).',
  },
  {
    name: 'timeToFirstAction',
    description: 'Sample count and median milliseconds to the first recorded activity boundary.',
  },
  { name: 'nodeExits', description: 'Counts by authored node id; no answers or state values.' },
  { name: 'attempts', description: 'Reported attempt totals and missing telemetry count.' },
  { name: 'hints', description: 'Reported hint totals and missing telemetry count.' },
  {
    name: 'branches',
    description:
      'Counts by reached authored node/destination ids; no branch labels or learner choices text.',
  },
  {
    name: 'continuation',
    description: 'Aggregate completed-to-later-run count and rate within local data.',
  },
  {
    name: 'delayedOutcomes',
    description: 'Aggregate delayed review evidence count and success rate.',
  },
  {
    name: 'bounds',
    description: 'Retained, dropped, and corrupt-record counts for the bounded projection.',
  },
];

function byteLength(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

/**
 * Builds an export only after a caller supplies an explicit tester consent.
 * This pure function has no persistence, network, fetch, or upload side effect.
 */
export function createPlaytestExport(
  sessions: readonly DiagnosticsSummary[],
  consent: TesterExportConsent,
  exportedAt = Date.now(),
): PlaytestExport {
  if (consent.confirmed !== true || !Number.isFinite(consent.confirmedAt)) {
    throw new Error('Playtest export requires an explicit tester confirmation.');
  }
  const result: PlaytestExport = {
    kind: 'learnlab-playtest-diagnostics',
    schemaVersion: PLAYTEST_EXPORT_SCHEMA_VERSION,
    exportedAt,
    consentedAt: consent.confirmedAt,
    includedFields: PLAYTEST_EXPORT_FIELDS,
    sessions: [...sessions],
  };
  if (byteLength(result) > PLAYTEST_EXPORT_MAX_BYTES) {
    throw new Error(`Playtest export exceeds its ${PLAYTEST_EXPORT_MAX_BYTES} byte cap.`);
  }
  return result;
}

function isSummary(value: unknown): value is DiagnosticsSummary {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.sessionLabel === 'string' &&
    typeof item.generatedAt === 'number' &&
    !!item.bounds &&
    !!item.timeToFirstAction &&
    Array.isArray(item.nodeExits) &&
    !!item.attempts &&
    !!item.hints &&
    Array.isArray(item.branches) &&
    !!item.continuation &&
    !!item.delayedOutcomes
  );
}

/** Read-only parser for a tester-selected export; it never writes to local storage. */
export function parsePlaytestExport(value: unknown): PlaytestExport {
  if (!value || typeof value !== 'object' || byteLength(value) > PLAYTEST_EXPORT_MAX_BYTES) {
    throw new Error('Playtest import rejected: file is malformed or exceeds the local size cap.');
  }
  const data = value as Record<string, unknown>;
  if (
    data.kind !== 'learnlab-playtest-diagnostics' ||
    data.schemaVersion !== PLAYTEST_EXPORT_SCHEMA_VERSION
  ) {
    throw new Error(
      'Playtest import rejected: this is not a supported LearnLab diagnostics export.',
    );
  }
  if (
    !Number.isFinite(data.exportedAt) ||
    !Number.isFinite(data.consentedAt) ||
    !Array.isArray(data.includedFields) ||
    !Array.isArray(data.sessions) ||
    !data.sessions.every(isSummary)
  ) {
    throw new Error('Playtest import rejected: required named summary fields are invalid.');
  }
  return data as unknown as PlaytestExport;
}

/** Browser-only, explicitly invoked download helper. Nothing calls it automatically. */
export function downloadPlaytestExport(exportData: PlaytestExport): void {
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `learnlab-playtest-diagnostics-${exportData.exportedAt}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
