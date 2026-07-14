import { useMemo, useState } from 'react';

import {
  createPlaytestExport,
  downloadPlaytestExport,
  parsePlaytestExport,
  PLAYTEST_EXPORT_FIELDS,
} from './export';
import { compareDiagnostics } from './project';
import type { DiagnosticsSummary, PlaytestExport } from './types';
import { DiagnosticsDashboard } from './DiagnosticsDashboard';

export interface TesterDiagnosticsPanelProps {
  baseline: DiagnosticsSummary;
  verticalSlice: DiagnosticsSummary;
  /** Injection keeps the consent UI testable; the route owner may call the browser download helper here. */
  onExport?: (data: PlaytestExport) => void;
}

/**
 * Local-only consent and import surface for a tester. It owns no learner
 * storage and does not send data; a confirmed Export triggers only a browser download.
 */
export function TesterDiagnosticsPanel({
  baseline,
  verticalSlice,
  onExport = downloadPlaytestExport,
}: TesterDiagnosticsPanelProps) {
  const [consented, setConsented] = useState(false);
  const [imported, setImported] = useState<DiagnosticsSummary | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const comparison = useMemo(
    () => compareDiagnostics(baseline, imported ?? verticalSlice),
    [baseline, imported, verticalSlice],
  );

  function exportNow() {
    if (!consented) return;
    const data = createPlaytestExport([baseline, verticalSlice], {
      confirmed: true,
      confirmedAt: Date.now(),
    });
    onExport(data);
    setMessage('Diagnostics export prepared. Nothing was sent automatically.');
  }

  async function importFile(file: File | undefined) {
    if (!file) return;
    try {
      const parsed = parsePlaytestExport(JSON.parse(await file.text()));
      const session = parsed.sessions[0];
      if (!session)
        throw new Error('Playtest import rejected: no comparison session was included.');
      setImported(session);
      setMessage(
        `Imported local summary: ${session.sessionLabel}. Nothing was written to learner progress.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error && error.message.startsWith('Playtest import rejected:')
          ? error.message
          : 'Playtest import rejected: selected file is not valid JSON.',
      );
    }
  }

  return (
    <section
      aria-labelledby="tester-diagnostics-heading"
      className="space-y-5 rounded-2xl border border-slate-300 p-4 dark:border-slate-600"
    >
      <header>
        <h2 id="tester-diagnostics-heading" className="text-xl font-bold">
          Tester diagnostics export
        </h2>
        <p>
          No data is sent automatically. Export creates a local file only after you confirm below;
          import only reads the selected file for this comparison.
        </p>
      </header>
      <section aria-labelledby="included-fields-heading">
        <h3 id="included-fields-heading" className="font-bold">
          Included export fields
        </h3>
        <dl className="mt-2 space-y-2">
          {PLAYTEST_EXPORT_FIELDS.map((field) => (
            <div key={field.name}>
              <dt className="font-semibold">{field.name}</dt>
              <dd>{field.description}</dd>
            </div>
          ))}
        </dl>
      </section>
      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={consented}
          onChange={(event) => setConsented(event.target.checked)}
        />
        <span>
          I have reviewed the included fields and explicitly agree to prepare this tester export.
        </span>
      </label>
      <button
        type="button"
        disabled={!consented}
        onClick={exportNow}
        className="min-h-11 rounded-md bg-indigo-700 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-500"
      >
        Export diagnostics
      </button>
      <div>
        <label htmlFor="diagnostics-import" className="font-semibold">
          Import diagnostics file for local comparison
        </label>
        <input
          id="diagnostics-import"
          type="file"
          accept="application/json,.json"
          className="mt-2 block"
          onChange={(event) => void importFile(event.target.files?.[0])}
        />
      </div>
      {message ? (
        <p role="status" aria-live="polite">
          {message}
        </p>
      ) : null}
      <DiagnosticsDashboard comparison={comparison} />
    </section>
  );
}
