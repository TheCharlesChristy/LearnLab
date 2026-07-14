import type { DiagnosticsComparison } from './types';

function display(value: number | undefined, unit: 'ms' | 'count' | 'rate'): string {
  if (value === undefined) return 'Not enough local evidence';
  if (unit === 'rate') return `${Math.round(value * 100)}%`;
  return unit === 'ms' ? `${Math.round(value)} ms` : String(value);
}

/** A local-only comparison view; it accepts summaries and performs no I/O. */
export function DiagnosticsDashboard({ comparison }: { comparison: DiagnosticsComparison }) {
  return (
    <section
      aria-labelledby="playtest-diagnostics-heading"
      className="space-y-4 rounded-2xl border border-slate-300 p-4 dark:border-slate-600"
    >
      <header>
        <h2 id="playtest-diagnostics-heading" className="text-xl font-bold">
          Local playtest comparison
        </h2>
        <p className="text-sm">
          Baseline: {comparison.baseline.sessionLabel}. Vertical slice:{' '}
          {comparison.verticalSlice.sessionLabel}. No data is sent anywhere.
        </p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th scope="col">Metric</th>
              <th scope="col">Baseline</th>
              <th scope="col">Vertical slice</th>
              <th scope="col">Difference</th>
            </tr>
          </thead>
          <tbody>
            {comparison.rows.map((row) => (
              <tr key={row.metric}>
                <th scope="row">{row.metric}</th>
                <td>{display(row.baseline, row.unit)}</td>
                <td>{display(row.verticalSlice, row.unit)}</td>
                <td>{display(row.delta, row.unit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
