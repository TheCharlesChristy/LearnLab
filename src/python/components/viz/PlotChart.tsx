// Recharts render for Plot — kept in its own module so Recharts is dynamically
// imported (NFR-PERF-001). Each series carries its own (x, y) data, so we use a
// ScatterChart and render every series as a <Scatter>: line series get a
// connecting `line` and hidden points; scatter series show points. This handles
// series with independent x-domains without merging on a shared key.

import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { PlotChartProps } from './Plot';

export default function PlotChart({
  series,
  legend,
  xLabel,
  yLabel,
  xRange,
  yRange,
  colors,
}: PlotChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 12, right: 16, bottom: xLabel ? 28 : 12, left: yLabel ? 16 : 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.3} />
        <XAxis
          type="number"
          dataKey="x"
          domain={xRange ?? ['auto', 'auto']}
          tick={{ fontSize: 12 }}
          label={
            xLabel === undefined || xLabel === ''
              ? undefined
              : { value: xLabel, position: 'bottom', fontSize: 12 }
          }
        />
        <YAxis
          type="number"
          dataKey="y"
          domain={yRange ?? ['auto', 'auto']}
          tick={{ fontSize: 12 }}
          label={
            yLabel === undefined || yLabel === ''
              ? undefined
              : { value: yLabel, angle: -90, position: 'left', fontSize: 12 }
          }
        />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        {legend && <Legend verticalAlign="top" height={28} />}
        {series.map((s, i) => {
          const color = colors[i % colors.length]!;
          const data = s.points.map(([x, y]) => ({ x, y }));
          return (
            <Scatter
              key={s.name}
              name={s.name}
              data={data}
              fill={color}
              line={s.kind === 'line' ? { stroke: color, strokeWidth: 2 } : false}
              shape={s.kind === 'line' ? () => null : 'circle'}
            />
          );
        })}
      </ScatterChart>
    </ResponsiveContainer>
  );
}
