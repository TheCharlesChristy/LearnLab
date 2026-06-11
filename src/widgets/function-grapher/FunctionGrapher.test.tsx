// Behaviour tests for the FunctionGrapher implementation (SRS §5.3 row,
// NFR-SEC-002 mathjs-only parsing, NFR-A11Y-001 keyboard tangent).

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

afterEach(cleanup); // vitest globals are off, so RTL auto-cleanup is too

import FunctionGrapher from './FunctionGrapher';
import type { FunctionGrapherProps } from './index';

function renderGrapher(overrides: Partial<FunctionGrapherProps> = {}) {
  const props: FunctionGrapherProps = {
    expr: 'x^2',
    xmin: -10,
    xmax: 10,
    tangent: false,
    grid: true,
    ...overrides,
  };
  return render(<FunctionGrapher {...props} />);
}

describe('FunctionGrapher rendering', () => {
  it('renders an SVG path for x^2', () => {
    renderGrapher();
    const path = screen.getByTestId('fg-curve');
    const d = path.getAttribute('d') ?? '';
    expect(d.startsWith('M')).toBe(true);
    expect(d).toContain('L'); // continuous curve: many line segments
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('supports mathjs functions and constants (sin, pi)', () => {
    renderGrapher({ expr: 'sin(x * pi)' });
    expect(screen.getByTestId('fg-curve').getAttribute('d')).toMatch(/^M.*L/);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('breaks the path at non-finite values (asymptote in 1/x)', () => {
    renderGrapher({ expr: '1/x', xmin: -5, xmax: 5 });
    const d = screen.getByTestId('fg-curve').getAttribute('d') ?? '';
    const moveCommands = d.match(/M/g) ?? [];
    expect(moveCommands.length).toBeGreaterThanOrEqual(2); // gap at x = 0
  });

  it('shows an error card naming the expression when compile throws', () => {
    renderGrapher({ expr: 'x^^2' });
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('x^^2');
    expect(screen.queryByTestId('fg-curve')).not.toBeInTheDocument();
  });

  it('shows an error card when evaluation never yields a number', () => {
    renderGrapher({ expr: '"hello"' });
    expect(screen.getByRole('alert')).toHaveTextContent('"hello"');
  });

  it('shows an error card for unknown symbols (evaluate throws everywhere)', () => {
    renderGrapher({ expr: 'q + 1' });
    expect(screen.getByRole('alert')).toHaveTextContent('q + 1');
  });

  it('renders grid lines when grid=true and none when grid=false', () => {
    const { unmount } = renderGrapher({ grid: true });
    expect(screen.getByTestId('fg-grid').querySelectorAll('line').length).toBeGreaterThan(0);
    unmount();
    renderGrapher({ grid: false });
    expect(screen.queryByTestId('fg-grid')).not.toBeInTheDocument();
  });

  it('has no slider and no readout when tangent=false', () => {
    renderGrapher();
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
    expect(screen.queryByTestId('fg-readout')).not.toBeInTheDocument();
  });
});

describe('FunctionGrapher tangent (NFR-A11Y-001)', () => {
  const tangentProps = { expr: 'x^2', xmin: -4, xmax: 4, tangent: true };

  it('exposes the tangent point as a focusable slider with x-position values', () => {
    renderGrapher(tangentProps);
    const slider = screen.getByRole('slider', { name: 'Tangent point' });
    expect(slider).toHaveAttribute('tabindex', '0');
    expect(slider).toHaveAttribute('aria-valuemin', '-4');
    expect(slider).toHaveAttribute('aria-valuemax', '4');
    expect(slider).toHaveAttribute('aria-valuenow', '0'); // starts at the midpoint
  });

  it('moves the point with arrow keys and updates the aria-live gradient readout', () => {
    renderGrapher(tangentProps);
    const slider = screen.getByRole('slider', { name: 'Tangent point' });
    const readout = screen.getByTestId('fg-readout');
    expect(readout).toHaveAttribute('aria-live', 'polite');
    const before = readout.textContent;

    // step = (4 - -4) / 50 = 0.16; gradient of x^2 at 0.16 is 0.32
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(Number(slider.getAttribute('aria-valuenow'))).toBeCloseTo(0.16, 5);
    expect(readout.textContent).not.toBe(before);
    expect(readout.textContent).toContain('0.32');

    fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    expect(Number(slider.getAttribute('aria-valuenow'))).toBeCloseTo(-0.16, 5);
  });

  it('clamps to the domain and supports Home/End', () => {
    renderGrapher(tangentProps);
    const slider = screen.getByRole('slider', { name: 'Tangent point' });
    fireEvent.keyDown(slider, { key: 'End' });
    expect(Number(slider.getAttribute('aria-valuenow'))).toBe(4);
    fireEvent.keyDown(slider, { key: 'ArrowRight' }); // already at xmax → stays clamped
    expect(Number(slider.getAttribute('aria-valuenow'))).toBe(4);
    fireEvent.keyDown(slider, { key: 'Home' });
    expect(Number(slider.getAttribute('aria-valuenow'))).toBe(-4);
  });

  it('draws the tangent line and shows the gradient numerically (central difference)', () => {
    renderGrapher({ ...tangentProps, xmin: 0.5, xmax: 4 }); // midpoint x = 2.25
    expect(screen.getByTestId('fg-tangent-line')).toBeInTheDocument();
    // d/dx x^2 at 2.25 = 4.5
    expect(screen.getByTestId('fg-readout').textContent).toContain('4.5');
  });

  it('shows a visible focus ring when the point receives keyboard focus', () => {
    renderGrapher(tangentProps);
    const slider = screen.getByRole('slider', { name: 'Tangent point' });
    expect(screen.queryByTestId('fg-focus-ring')).not.toBeInTheDocument();
    fireEvent.focus(slider);
    expect(screen.getByTestId('fg-focus-ring')).toBeInTheDocument();
    fireEvent.blur(slider);
    expect(screen.queryByTestId('fg-focus-ring')).not.toBeInTheDocument();
  });

  it('reacts to pointer drag events without crashing (jsdom has no layout)', () => {
    renderGrapher(tangentProps);
    const slider = screen.getByRole('slider', { name: 'Tangent point' });
    fireEvent.pointerDown(slider, { pointerId: 1, clientX: 100 });
    fireEvent.pointerMove(slider, { pointerId: 1, clientX: 140 });
    fireEvent.pointerUp(slider, { pointerId: 1 });
    expect(slider).toBeInTheDocument();
  });
});
