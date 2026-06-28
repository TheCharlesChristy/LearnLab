// `data-plot` implementation — static data charts (SRS §5.3 row).
//
// Fetches a module-relative JSON file describing a line / bar / scatter chart
// and renders it responsively with Recharts. Recharts is imported HERE (inside
// the React.lazy chunk) so it never reaches the entry bundle (NFR-PERF-001).
//
// Failure handling (FR-CONT-007 / FR-WID-003 spirit):
//   • network/HTTP failure  → retry card
//   • malformed JSON / bad `kind` / bad series → error card naming the problem
// The widget renders an inline card rather than throwing (FR-CONT-006 spirit).

import { useContext, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { LessonContext } from '../../content';

import type { DataPlotProps } from './index';

type ChartKind = 'line' | 'bar' | 'scatter';

interface Series {
  name: string;
  points: Array<[number, number]>;
}

interface ChartData {
  kind: ChartKind;
  series: Series[];
  xLabel?: string;
  yLabel?: string;
}

/** True for URLs that must not be re-based: scheme:, protocol-relative, root-relative. */
function isAbsoluteUrl(src: string): boolean {
  return /^(?:[a-z][a-z\d+\-.]*:|\/)/i.test(src);
}

/** Distinct, theme-neutral palette; cycles for >6 series. */
const COLORS = ['#4f46e5', '#16a34a', '#dc2626', '#d97706', '#0891b2', '#9333ea'];

/**
 * Validate the fetched value into a ChartData, or throw an Error whose message
 * names the offending part of the file (surfaced verbatim on the error card).
 */
function parseChartData(value: unknown): ChartData {
  if (typeof value !== 'object' || value === null) {
    throw new Error('file must be a JSON object with "kind" and "series"');
  }
  const v = value as Record<string, unknown>;

  const kind = v.kind;
  if (kind !== 'line' && kind !== 'bar' && kind !== 'scatter') {
    throw new Error(`kind: must be "line", "bar" or "scatter" (got ${JSON.stringify(kind)})`);
  }

  if (!Array.isArray(v.series) || v.series.length === 0) {
    throw new Error('series: must be a non-empty array');
  }

  const series: Series[] = v.series.map((rawSeries, i) => {
    if (typeof rawSeries !== 'object' || rawSeries === null) {
      throw new Error(`series[${i}]: must be an object { name, points }`);
    }
    const s = rawSeries as Record<string, unknown>;
    if (typeof s.name !== 'string' || s.name.trim() === '') {
      throw new Error(`series[${i}].name: must be a non-empty string`);
    }
    if (!Array.isArray(s.points) || s.points.length === 0) {
      throw new Error(`series[${i}].points: must be a non-empty array of [x, y] pairs`);
    }
    const points = s.points.map((p, j) => {
      if (
        !Array.isArray(p) ||
        p.length !== 2 ||
        typeof p[0] !== 'number' ||
        typeof p[1] !== 'number' ||
        !Number.isFinite(p[0]) ||
        !Number.isFinite(p[1])
      ) {
        throw new Error(`series[${i}].points[${j}]: must be a pair of finite numbers [x, y]`);
      }
      return [p[0], p[1]] as [number, number];
    });
    return { name: s.name, points };
  });

  return {
    kind,
    series,
    xLabel: typeof v.xLabel === 'string' ? v.xLabel : undefined,
    yLabel: typeof v.yLabel === 'string' ? v.yLabel : undefined,
  };
}

/**
 * Reshape series into Recharts' row-per-x format keyed by series name.
 * Rows are sorted by x so line charts connect left-to-right.
 */
interface Row {
  x: number;
  [seriesName: string]: number;
}

function toRows(series: Series[]): Row[] {
  const byX = new Map<number, Row>();
  for (const s of series) {
    for (const [x, y] of s.points) {
      let row = byX.get(x);
      if (!row) {
        row = { x };
        byX.set(x, row);
      }
      row[s.name] = y;
    }
  }
  return [...byX.values()].sort((a, b) => a.x - b.x);
}

type LoadState =
  | { status: 'loading' }
  | { status: 'fetch-error'; message: string }
  | { status: 'data-error'; message: string }
  | { status: 'ready'; data: ChartData };

export default function DataPlot({ src }: DataPlotProps) {
  const ctx = useContext(LessonContext); // optional: null outside lesson routes
  const url =
    ctx && !isAbsoluteUrl(src) ? `${ctx.moduleBaseUrl}${src.replace(/^\.\//, '')}` : src;

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    void (async () => {
      let raw: unknown;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        raw = await res.json();
      } catch (err) {
        console.error(`[data-plot] failed to load ${url}`, err);
        if (!cancelled) {
          setState({
            status: 'fetch-error',
            message: err instanceof Error ? err.message : String(err),
          });
        }
        return;
      }
      // JSON parsed: any problem now is a content/shape error, not a retry case.
      try {
        const data = parseChartData(raw);
        if (!cancelled) setState({ status: 'ready', data });
      } catch (err) {
        if (!cancelled) {
          setState({
            status: 'data-error',
            message: err instanceof Error ? err.message : String(err),
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url, reloadToken]);

  if (state.status === 'loading') {
    return (
      <div role="status" className="my-4 rounded-lg border p-4 text-sm opacity-80">
        Loading chart…
      </div>
    );
  }

  if (state.status === 'fetch-error') {
    return (
      <div role="alert" className="my-4 rounded-lg border border-red-300 p-4">
        <p className="font-medium">Couldn’t load chart</p>
        <p className="mt-1 text-sm opacity-80">
          {src}: {state.message}
        </p>
        <button
          type="button"
          onClick={() => setReloadToken((t) => t + 1)}
          className="mt-2 rounded bg-blue-600 px-3 py-1 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (state.status === 'data-error') {
    return (
      <div role="alert" className="my-4 rounded-lg border border-red-300 p-4">
        <p className="font-medium">Invalid chart data</p>
        <p className="mt-1 text-sm opacity-80">
          {src}: {state.message}
        </p>
      </div>
    );
  }

  return <Chart data={state.data} />;
}

function Chart({ data }: { data: ChartData }) {
  const rows = useMemo(() => toRows(data.series), [data.series]);
  const xAxis = (
    <XAxis
      dataKey="x"
      type="number"
      domain={['auto', 'auto']}
      label={
        data.xLabel ? { value: data.xLabel, position: 'insideBottom', offset: -4 } : undefined
      }
    />
  );
  const yAxis = (
    <YAxis
      label={
        data.yLabel ? { value: data.yLabel, angle: -90, position: 'insideLeft' } : undefined
      }
    />
  );
  const common = (
    <>
      <CartesianGrid strokeDasharray="3 3" />
      {xAxis}
      {yAxis}
      <Tooltip />
      <Legend />
    </>
  );

  let chart;
  if (data.kind === 'line') {
    chart = (
      <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
        {common}
        {data.series.map((s, i) => (
          <Line
            key={s.name}
            type="monotone"
            dataKey={s.name}
            stroke={COLORS[i % COLORS.length]}
            connectNulls
            dot={false}
          />
        ))}
      </LineChart>
    );
  } else if (data.kind === 'bar') {
    chart = (
      <BarChart data={rows} margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
        {common}
        {data.series.map((s, i) => (
          <Bar key={s.name} dataKey={s.name} fill={COLORS[i % COLORS.length]} />
        ))}
      </BarChart>
    );
  } else {
    // scatter: each series is its own ScatterChart layer; share one chart.
    chart = (
      <ScatterChart margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        {xAxis}
        <YAxis
          dataKey="y"
          type="number"
          label={
            data.yLabel ? { value: data.yLabel, angle: -90, position: 'insideLeft' } : undefined
          }
        />
        <Tooltip />
        <Legend />
        {data.series.map((s, i) => (
          <Scatter
            key={s.name}
            name={s.name}
            data={s.points.map(([x, y]) => ({ x, y }))}
            fill={COLORS[i % COLORS.length]}
          />
        ))}
      </ScatterChart>
    );
  }

  return (
    <figure className="my-4">
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chart}
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
