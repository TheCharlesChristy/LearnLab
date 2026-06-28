// Plot component — SRS §6.7. Static data plot of one or more series, each a
// line or scatter. Recharts is imported LAZILY inside this component so it
// lands in its own lazy chunk and never enters the entry bundle
// (NFR-PERF-001). No expression strings cross the boundary — Python's
// FunctionPlot samples in-Python and emits a Plot node.

import { lazy, Suspense } from 'react';

import type { JsonValue } from '../../protocol';
import type { PyComponentProps } from '../../py-render-context';
import { arr, bool, num, optStr, range } from '../props';

interface SeriesSpec {
  name: string;
  kind: 'line' | 'scatter';
  points: Array<[number, number]>;
}

const SERIES_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7'];

function parsePoints(raw: JsonValue): Array<[number, number]> {
  if (!Array.isArray(raw)) return [];
  const out: Array<[number, number]> = [];
  for (const p of raw) {
    if (
      Array.isArray(p) &&
      p.length >= 2 &&
      typeof p[0] === 'number' &&
      typeof p[1] === 'number' &&
      Number.isFinite(p[0]) &&
      Number.isFinite(p[1])
    ) {
      out.push([p[0], p[1]]);
    }
  }
  return out;
}

export function parseSeries(rawSeries: JsonValue[]): SeriesSpec[] {
  return rawSeries.map((s, i) => {
    const obj = typeof s === 'object' && s !== null && !Array.isArray(s) ? s : {};
    const kind = obj['kind'] === 'scatter' ? 'scatter' : 'line';
    const name = typeof obj['name'] === 'string' ? obj['name'] : `series-${i}`;
    return { name, kind, points: parsePoints(obj['points'] ?? []) };
  });
}

// The heavy Recharts render is its own lazily-loaded module so Recharts is not
// pulled into the components/index eager graph.
const PlotChart = lazy(() => import('./PlotChart'));

export interface PlotChartProps {
  series: SeriesSpec[];
  height: number;
  legend: boolean;
  xLabel?: string;
  yLabel?: string;
  xRange?: [number, number];
  yRange?: [number, number];
  colors: string[];
}

export const Plot: React.FC<PyComponentProps> = ({ node }) => {
  const series = parseSeries(arr(node.props, 'series'));
  const height = num(node.props, 'height', 320);
  const legend = bool(node.props, 'legend', true);
  const props: PlotChartProps = {
    series,
    height,
    legend,
    xLabel: optStr(node.props, 'x_label'),
    yLabel: optStr(node.props, 'y_label'),
    xRange: range(node.props, 'x_range'),
    yRange: range(node.props, 'y_range'),
    colors: SERIES_COLORS,
  };
  return (
    <div style={{ width: '100%', height }}>
      <Suspense
        fallback={
          <div
            role="status"
            aria-live="polite"
            className="flex h-full w-full items-center justify-center text-sm text-slate-500"
          >
            Loading chart…
          </div>
        }
      >
        <PlotChart {...props} />
      </Suspense>
    </div>
  );
};

// Re-export for tests that want to assert series parsing without Recharts.
export type { SeriesSpec };
