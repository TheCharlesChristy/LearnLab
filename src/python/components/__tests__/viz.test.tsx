// Plot (§6.7): series parsing + lazy Recharts render. Math (§6.7): KaTeX with
// MathML output (NFR-A11Y-001).

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, screen, waitFor } from '@testing-library/react';

import { Plot, parseSeries } from '../viz/Plot';
import { Math } from '../viz/Math';
import { makeNode, renderComponent } from './harness';

afterEach(cleanup);

describe('Plot.parseSeries', () => {
  it('parses line/scatter series and drops malformed points', () => {
    const out = parseSeries([
      { name: 'a', kind: 'line', points: [[0, 1], [1, 2]] },
      { name: 'b', kind: 'scatter', points: [[0, 0], ['x', 3], [2, 4]] },
      { kind: 'mystery', points: 'nope' },
    ]);
    expect(out[0]).toEqual({ name: 'a', kind: 'line', points: [[0, 1], [1, 2]] });
    expect(out[1]!.kind).toBe('scatter');
    expect(out[1]!.points).toEqual([[0, 0], [2, 4]]); // bad point dropped
    expect(out[2]!.kind).toBe('line'); // unknown kind → defaults to line
    expect(out[2]!.name).toBe('series-2'); // missing name → positional
  });
});

describe('Plot component', () => {
  it('shows a loading fallback then renders the lazy chart', async () => {
    const { result } = renderComponent(
      Plot,
      makeNode('Plot', {
        series: [{ name: 's', kind: 'line', points: [[0, 0], [1, 1]] }],
        height: 200,
        legend: true,
        x_label: 'time',
        y_label: 'value',
      }),
    );
    expect(screen.getByText('Loading chart…')).toBeInTheDocument();
    // The lazy Recharts module resolves and the chart container appears.
    await waitFor(() => {
      expect(result.container.querySelector('.recharts-responsive-container')).not.toBeNull();
    });
  });
});

describe('Math component', () => {
  it('renders KaTeX with MathML for accessibility (NFR-A11Y-001)', async () => {
    const { result } = renderComponent(Math, makeNode('Math', { latex: 'x^2 + 1', display: true }));
    await waitFor(() => {
      expect(result.container.querySelector('.katex')).not.toBeNull();
      expect(result.container.querySelector('math')).not.toBeNull();
    });
  });

  it('shows the source as a fallback before KaTeX loads', () => {
    const { result } = renderComponent(Math, makeNode('Math', { latex: '\\alpha', display: false }));
    expect(result.container.textContent).toContain('\\alpha');
  });
});
