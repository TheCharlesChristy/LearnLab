// Behaviour tests for the DataPlot implementation (SRS §5.3 row):
// renders a series from a mocked fetch, error card on bad kind / malformed
// JSON, retry card on fetch failure, relative src resolution via LessonContext.

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);

import { LessonContext } from '../../content';
import type { LessonContextValue } from '../../content';

import DataPlot from './DataPlot';

// Recharts' ResponsiveContainer measures the DOM (0×0 in jsdom and would not
// render children). Replace it with a fixed-size pass-through so the chart's
// SVG actually mounts under test.
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactNode }) => (
      <div style={{ width: 600, height: 320 }}>{children}</div>
    ),
  };
});

function withLesson(children: ReactNode, moduleBaseUrl = '/content/modules/calc/') {
  const value: LessonContextValue = {
    moduleId: 'calc',
    moduleBaseUrl,
    recordAttempt: async () => {},
    getItemState: async () => null,
    setItemState: async () => {},
    recordReview: async () => {},
    seedReviewItem: async () => {},
  };
  return <LessonContext.Provider value={value}>{children}</LessonContext.Provider>;
}

const LINE_DATA = {
  kind: 'line',
  series: [{ name: 'Velocity', points: [[0, 0], [1, 2], [2, 4]] }],
  xLabel: 'time',
  yLabel: 'v',
};

function mockFetchOnce(impl: () => Partial<Response> | Promise<Partial<Response>>) {
  vi.stubGlobal('fetch', vi.fn(impl) as unknown as typeof fetch);
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe('DataPlot', () => {
  it('renders a chart from a mocked fetch (Recharts wrapper mounts, no error)', async () => {
    mockFetchOnce(() => ({ ok: true, status: 200, json: async () => LINE_DATA }));
    const { container } = render(<DataPlot src="data/v.json" />);
    // jsdom gives the chart no measurable size, so we assert the chart shell
    // mounted (loading gone, no error card, Recharts wrapper present) rather
    // than depending on the rendered SVG geometry.
    await waitFor(() =>
      expect(container.querySelector('.recharts-wrapper')).not.toBeNull(),
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('resolves relative src against moduleBaseUrl when lesson context is present', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => LINE_DATA,
    }));
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);
    const { container } = render(withLesson(<DataPlot src="data/v.json" />));
    await waitFor(() =>
      expect(container.querySelector('.recharts-wrapper')).not.toBeNull(),
    );
    expect(fetchMock).toHaveBeenCalledWith('/content/modules/calc/data/v.json');
  });

  it('shows an error card naming the problem on a bad kind', async () => {
    mockFetchOnce(() => ({
      ok: true,
      status: 200,
      json: async () => ({ kind: 'pie', series: [] }),
    }));
    render(<DataPlot src="data/bad.json" />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Invalid chart data');
    expect(alert).toHaveTextContent('kind:');
  });

  it('shows an error card on malformed JSON (no retry button — it parsed OK over the wire)', async () => {
    mockFetchOnce(() => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token');
      },
    }));
    render(<DataPlot src="data/broken.json" />);
    // A JSON parse failure surfaces as a fetch-stage error → retry card.
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent("Couldn’t load chart");
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('shows a retry card on fetch failure and retries on click', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => LINE_DATA });
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    const { container } = render(<DataPlot src="data/v.json" />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent("Couldn’t load chart");

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() =>
      expect(container.querySelector('.recharts-wrapper')).not.toBeNull(),
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
