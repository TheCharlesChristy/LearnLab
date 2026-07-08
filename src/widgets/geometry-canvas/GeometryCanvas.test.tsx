// Behaviour tests for the GeometryCanvas implementation (docs/BUILD_PLAN.md
// Phase P6, D-024): scene validation (accept/reject naming the exact
// problem), rendering of points/lines/circles from a fetched scene, relative
// src resolution via LessonContext, retry card on fetch failure, and the
// keyboard-nudge interaction on a draggable point (NFR-A11Y-001).

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);

import { LessonContext } from '../../content';
import type { LessonContextValue } from '../../content';

import GeometryCanvas, { parseScene } from './GeometryCanvas';

function withLesson(children: ReactNode, moduleBaseUrl = '/content/modules/geo/') {
  const value: LessonContextValue = {
    moduleId: 'geo',
    moduleBaseUrl,
    recordAttempt: async () => {},
    getItemState: async () => null,
    setItemState: async () => {},
    recordReview: async () => {},
    seedReviewItem: async () => {},
    notifyEngagement: () => {},
  };
  return <LessonContext.Provider value={value}>{children}</LessonContext.Provider>;
}

function mockFetchJson(data: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, status: 200, json: async () => data })) as unknown as typeof fetch,
  );
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

const TRIANGLE_SCENE = {
  bounds: { xmin: -5, xmax: 5, ymin: -5, ymax: 5 },
  points: [
    { id: 'A', x: 0, y: 0, label: 'A', draggable: true },
    { id: 'B', x: 3, y: 0, label: 'B', draggable: true },
    { id: 'C', x: 0, y: 3, label: 'C', draggable: false },
  ],
  lines: [
    { from: 'A', to: 'B' },
    { from: 'B', to: 'C' },
    { from: 'C', to: 'A' },
  ],
  circles: [{ center: 'A', throughPoint: 'B' }],
};

describe('parseScene — accept', () => {
  it('parses a well-formed scene, defaulting draggable/label/lines/circles', () => {
    expect(
      parseScene({
        bounds: { xmin: -1, xmax: 1, ymin: -1, ymax: 1 },
        points: [{ id: 'A', x: 0, y: 0 }],
      }),
    ).toEqual({
      bounds: { xmin: -1, xmax: 1, ymin: -1, ymax: 1 },
      points: [{ id: 'A', x: 0, y: 0, label: undefined, draggable: false }],
      lines: [],
      circles: [],
    });
  });

  it('parses the full triangle-with-circle scene', () => {
    expect(parseScene(TRIANGLE_SCENE)).toEqual(TRIANGLE_SCENE);
  });
});

describe('parseScene — reject (errors name the exact problem)', () => {
  it('rejects a non-object', () => {
    expect(() => parseScene(null)).toThrow(/must be a JSON object/);
    expect(() => parseScene('nope')).toThrow(/must be a JSON object/);
  });

  it('rejects a missing/malformed bounds', () => {
    expect(() => parseScene({ points: [] })).toThrow(/bounds: must be an object/);
    expect(() =>
      parseScene({ bounds: { xmin: 'a', xmax: 1, ymin: -1, ymax: 1 }, points: [] }),
    ).toThrow(/bounds\.xmin: must be a finite number/);
  });

  it('rejects xmin >= xmax', () => {
    expect(() =>
      parseScene({
        bounds: { xmin: 5, xmax: 5, ymin: -1, ymax: 1 },
        points: [{ id: 'A', x: 0, y: 0 }],
      }),
    ).toThrow(/bounds: xmin must be less than xmax/);
  });

  it('rejects ymin >= ymax', () => {
    expect(() =>
      parseScene({
        bounds: { xmin: -1, xmax: 1, ymin: 2, ymax: 1 },
        points: [{ id: 'A', x: 0, y: 0 }],
      }),
    ).toThrow(/bounds: ymin must be less than ymax/);
  });

  it('rejects empty points', () => {
    expect(() =>
      parseScene({ bounds: { xmin: -1, xmax: 1, ymin: -1, ymax: 1 }, points: [] }),
    ).toThrow(/points: must be a non-empty array/);
  });

  it('rejects a duplicate point id', () => {
    expect(() =>
      parseScene({
        bounds: { xmin: -1, xmax: 1, ymin: -1, ymax: 1 },
        points: [
          { id: 'A', x: 0, y: 0 },
          { id: 'A', x: 1, y: 1 },
        ],
      }),
    ).toThrow(/points\[1\]\.id: duplicate point id "A"/);
  });

  it('rejects a non-finite point coordinate', () => {
    expect(() =>
      parseScene({
        bounds: { xmin: -1, xmax: 1, ymin: -1, ymax: 1 },
        points: [{ id: 'A', x: 'nope', y: 0 }],
      }),
    ).toThrow(/points\[0\]\.x: must be a finite number/);
  });

  it('rejects a line referencing an unknown point', () => {
    expect(() =>
      parseScene({
        bounds: { xmin: -1, xmax: 1, ymin: -1, ymax: 1 },
        points: [{ id: 'A', x: 0, y: 0 }],
        lines: [{ from: 'A', to: 'ghost' }],
      }),
    ).toThrow(/lines\[0\]\.to: references unknown point "ghost"/);
  });

  it('rejects a circle referencing an unknown point', () => {
    expect(() =>
      parseScene({
        bounds: { xmin: -1, xmax: 1, ymin: -1, ymax: 1 },
        points: [{ id: 'A', x: 0, y: 0 }],
        circles: [{ center: 'A', throughPoint: 'ghost' }],
      }),
    ).toThrow(/circles\[0\]\.throughPoint: references unknown point "ghost"/);
  });
});

describe('GeometryCanvas component', () => {
  it('renders points, lines and a circle from a valid scene', async () => {
    mockFetchJson(TRIANGLE_SCENE);
    render(<GeometryCanvas src="scenes/triangle.json" width={480} height={480} />);

    await screen.findByTestId('gc-point-A');
    expect(screen.getByTestId('gc-point-B')).toBeInTheDocument();
    expect(screen.getByTestId('gc-point-C')).toBeInTheDocument();
    expect(screen.getByTestId('gc-line-0')).toBeInTheDocument();
    expect(screen.getByTestId('gc-line-1')).toBeInTheDocument();
    expect(screen.getByTestId('gc-line-2')).toBeInTheDocument();
    expect(screen.getByTestId('gc-circle-0')).toBeInTheDocument();

    // Only draggable points (A, B) get an interactive handle; C does not.
    expect(screen.getByTestId('gc-handle-A')).toBeInTheDocument();
    expect(screen.getByTestId('gc-handle-B')).toBeInTheDocument();
    expect(screen.queryByTestId('gc-handle-C')).not.toBeInTheDocument();

    // Circle radius = live distance(A, B) * scale. bounds span 10 units over
    // 480px => scale 48; A=(0,0), B=(3,0) => radius world 3 => 144px.
    expect(screen.getByTestId('gc-circle-0')).toHaveAttribute('r', '144');
  });

  it('shows an inline error card naming the exact problem on a malformed scene, not a crash', async () => {
    mockFetchJson({
      bounds: { xmin: -1, xmax: 1, ymin: -1, ymax: 1 },
      points: [{ id: 'A', x: 0, y: 0 }],
      lines: [{ from: 'A', to: 'ghost' }],
    });
    render(<GeometryCanvas src="scenes/bad.json" width={480} height={480} />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Invalid geometry scene data');
    expect(alert).toHaveTextContent('lines[0].to: references unknown point "ghost"');
  });

  it('shows a retry card on fetch failure and retries on click', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => TRIANGLE_SCENE });
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    render(<GeometryCanvas src="scenes/triangle.json" width={480} height={480} />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Couldn’t load geometry scene');

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByTestId('gc-point-A')).toBeInTheDocument();
  });

  it('resolves relative src against moduleBaseUrl when lesson context is present', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => TRIANGLE_SCENE,
    }));
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);
    render(withLesson(<GeometryCanvas src="scenes/triangle.json" width={480} height={480} />));
    await screen.findByTestId('gc-point-A');
    expect(fetchMock).toHaveBeenCalledWith('/content/modules/geo/scenes/triangle.json');
  });

  it('never throws an unhandled exception on a network error (shows a card instead)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      }) as unknown as typeof fetch,
    );
    render(<GeometryCanvas src="scenes/triangle.json" width={480} height={480} />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('network down');
  });

  it('nudges a focused draggable point via arrow keys, updating its rendered position and aria-label', async () => {
    mockFetchJson(TRIANGLE_SCENE);
    render(<GeometryCanvas src="scenes/triangle.json" width={480} height={480} />);

    const handleA = await screen.findByRole('button', { name: /Point A, draggable, currently at \(0, 0\)/ });
    expect(screen.getByTestId('gc-point-A')).toHaveAttribute('cx', '240');

    handleA.focus();
    await userEvent.keyboard('{ArrowRight}');

    // bounds span 10 units over both axes => nudgeStep = max(10,10)/20 = 0.5.
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Point A, draggable, currently at \(0\.5, 0\)/ }),
      ).toBeInTheDocument(),
    );
    // px = offsetX(0) + (x - xmin) * scale(48) = (0.5 - -5) * 48 = 264.
    expect(screen.getByTestId('gc-point-A')).toHaveAttribute('cx', '264');

    // Dependent line/circle recompute live from the moved point.
    expect(screen.getByTestId('gc-circle-0')).not.toHaveAttribute('r', '144');
  });

  it('clamps a nudge at the scene bounds', async () => {
    // C sits at (0, 3) and is NOT draggable; use B at (3, 0), nudge it far
    // right beyond xmax=5 repeatedly and confirm it clamps rather than escaping bounds.
    mockFetchJson(TRIANGLE_SCENE);
    render(<GeometryCanvas src="scenes/triangle.json" width={480} height={480} />);

    const handleB = await screen.findByRole('button', { name: /Point B/ });
    handleB.focus();
    for (let i = 0; i < 20; i++) {
      await userEvent.keyboard('{ArrowRight}');
    }

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Point B, draggable, currently at \(5, 0\)/ }),
      ).toBeInTheDocument(),
    );
  });

  it('does not render an interactive handle for a non-draggable point, and it stays fixed', async () => {
    mockFetchJson(TRIANGLE_SCENE);
    render(<GeometryCanvas src="scenes/triangle.json" width={480} height={480} />);
    await screen.findByTestId('gc-point-C');
    expect(screen.queryByTestId('gc-handle-C')).not.toBeInTheDocument();
  });
});
