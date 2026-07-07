// Behaviour tests for the VectorField implementation (SRS §5.3 roadmap row /
// BUILD_PLAN.md D-024, NFR-SEC-002 mathjs-only parsing, NFR-A11Y-001 aria
// label on the generated plot).

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(cleanup); // vitest globals are off, so RTL auto-cleanup is too

import VectorField from './VectorField';
import type { VectorFieldProps } from './index';

function renderField(overrides: Partial<VectorFieldProps> = {}) {
  const props: VectorFieldProps = {
    fx: 'y',
    fy: '-x',
    xmin: -5,
    xmax: 5,
    ymin: -5,
    ymax: 5,
    step: 1,
    scale: 1,
    grid: true,
    ...overrides,
  };
  return render(<VectorField {...props} />);
}

describe('VectorField rendering', () => {
  it('renders without crashing for a uniform rightward field (fx=1, fy=0)', () => {
    renderField({ fx: '1', fy: '0' });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    const arrows = screen.getAllByTestId('vf-arrow');
    // 11x11 grid (step=1 over [-5,5]) with no failing points -> 121 arrows.
    expect(arrows.length).toBe(121);
  });

  it('exposes the plot as role="img" with a descriptive aria-label', () => {
    renderField({ fx: 'y', fy: '-x', xmin: -3, xmax: 3, ymin: -2, ymax: 2 });
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute(
      'aria-label',
      'Vector field plot of (y, -x) for x in [-3, 3], y in [-2, 2]',
    );
  });

  it('renders grid lines when grid=true and none when grid=false', () => {
    const { unmount } = renderField({ grid: true });
    expect(screen.getByTestId('vf-grid').querySelectorAll('line').length).toBeGreaterThan(0);
    unmount();
    renderField({ grid: false });
    expect(screen.queryByTestId('vf-grid')).not.toBeInTheDocument();
  });

  it('renders a dot instead of an arrow at a critical point (fx=fy=0 everywhere)', () => {
    renderField({ fx: '0', fy: '0', xmin: -2, xmax: 2, ymin: -2, ymax: 2, step: 1 });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByTestId('vf-arrow')).not.toBeInTheDocument();
    const dots = screen.getAllByTestId('vf-dot');
    // 5x5 grid over [-2,2] step 1 -> 25 points, all critical.
    expect(dots.length).toBe(25);
  });

  it('handles a field with a division-by-zero point without crashing (fy = 1/x)', () => {
    renderField({ fx: '1', fy: '1/x', xmin: -5, xmax: 5, ymin: -5, ymax: 5, step: 1 });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    const arrows = screen.getAllByTestId('vf-arrow');
    // x=0 column (11 points) fails to evaluate (1/0 -> Infinity, non-finite);
    // every other point succeeds: 11*11 - 11 = 110.
    expect(arrows.length).toBe(110);
  });

  it('shows an inline error state when every point fails to evaluate (unknown symbol)', () => {
    renderField({ fx: 'undefinedVar123', fy: '0' });
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('undefinedVar123');
    expect(screen.queryByTestId('vf-arrow')).not.toBeInTheDocument();
    expect(screen.queryByTestId('vf-dot')).not.toBeInTheDocument();
  });

  it('shows an inline error state when an expression fails to compile', () => {
    renderField({ fx: 'y^^2', fy: '-x' });
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('y^^2');
  });

  it('applies the scale prop without crashing or changing arrow count', () => {
    renderField({ fx: '1', fy: '1', scale: 3 });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('vf-arrow').length).toBe(121);
  });
});
