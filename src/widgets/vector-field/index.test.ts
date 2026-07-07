// parseProps accept/reject table for `vector-field` (FR-WID-003: every error
// message names the offending prop).

import { describe, expect, it } from 'vitest';

import { def, parseProps } from './index';

function expectReject(raw: Parameters<typeof parseProps>[0], prop: string) {
  const result = parseProps(raw);
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.errors.length).toBeGreaterThan(0);
  expect(result.errors.some((e) => e.includes(prop))).toBe(true);
  // FR-WID-003: each error names the bad prop at its start.
  expect(result.errors.some((e) => e.startsWith(`${prop}:`))).toBe(true);
}

describe('vector-field parseProps — accept', () => {
  it('applies defaults with only fx/fy given', () => {
    const result = parseProps({ fx: 'y', fy: '-x' });
    expect(result).toEqual({
      ok: true,
      props: {
        fx: 'y',
        fy: '-x',
        xmin: -5,
        xmax: 5,
        ymin: -5,
        ymax: 5,
        step: 1,
        scale: 1,
        grid: true,
      },
    });
  });

  it('coerces numeric strings (directive attrs arrive as strings)', () => {
    const result = parseProps({
      fx: 'y',
      fy: '-x',
      xmin: '-2',
      xmax: '2',
      ymin: '-3',
      ymax: '3',
      step: '0.5',
      scale: '2',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.props.xmin).toBe(-2);
    expect(result.props.xmax).toBe(2);
    expect(result.props.ymin).toBe(-3);
    expect(result.props.ymax).toBe(3);
    expect(result.props.step).toBe(0.5);
    expect(result.props.scale).toBe(2);
  });

  it('accepts boolean grid as boolean and as "true"/"false" strings', () => {
    const a = parseProps({ fx: 'y', fy: '-x', grid: false });
    expect(a.ok && a.props.grid === false).toBe(true);
    const b = parseProps({ fx: 'y', fy: '-x', grid: 'true' });
    expect(b.ok && b.props.grid === true).toBe(true);
  });

  it('accepts plain numbers for ranges/step/scale', () => {
    const result = parseProps({ fx: 'y', fy: '-x', xmin: -4, xmax: 4, step: 2, scale: 1.5 });
    expect(result.ok).toBe(true);
  });

  it('accepts a step that gives exactly a 2x2 grid (boundary: ratio == 1)', () => {
    const result = parseProps({ fx: 'y', fy: '-x', xmin: 0, xmax: 2, ymin: 0, ymax: 2, step: 2 });
    expect(result.ok).toBe(true);
  });
});

describe('vector-field parseProps — reject (errors name the prop, FR-WID-003)', () => {
  it('rejects missing fx', () => expectReject({ fy: '-x' }, 'fx'));
  it('rejects empty fx', () => expectReject({ fx: '   ', fy: '-x' }, 'fx'));
  it('rejects non-string fx', () => expectReject({ fx: 42, fy: '-x' }, 'fx'));
  it('rejects missing fy', () => expectReject({ fx: 'y' }, 'fy'));
  it('rejects empty fy', () => expectReject({ fx: 'y', fy: '' }, 'fy'));
  it('rejects non-string fy', () => expectReject({ fx: 'y', fy: false }, 'fy'));

  it('rejects non-numeric xmin', () =>
    expectReject({ fx: 'y', fy: '-x', xmin: 'abc' }, 'xmin'));
  it('rejects non-numeric xmax', () =>
    expectReject({ fx: 'y', fy: '-x', xmax: 'NaN' }, 'xmax'));
  it('rejects non-numeric ymin', () =>
    expectReject({ fx: 'y', fy: '-x', ymin: 'low' }, 'ymin'));
  it('rejects non-numeric ymax', () =>
    expectReject({ fx: 'y', fy: '-x', ymax: true }, 'ymax'));

  it('rejects xmin == xmax', () =>
    expectReject({ fx: 'y', fy: '-x', xmin: 5, xmax: 5 }, 'xmin'));
  it('rejects xmin > xmax', () =>
    expectReject({ fx: 'y', fy: '-x', xmin: '3', xmax: '-3' }, 'xmin'));
  it('rejects ymin >= ymax', () =>
    expectReject({ fx: 'y', fy: '-x', ymin: 2, ymax: -2 }, 'ymin'));

  it('rejects non-numeric step', () =>
    expectReject({ fx: 'y', fy: '-x', step: 'big' }, 'step'));
  it('rejects step == 0', () => expectReject({ fx: 'y', fy: '-x', step: 0 }, 'step'));
  it('rejects negative step', () => expectReject({ fx: 'y', fy: '-x', step: -1 }, 'step'));
  it('rejects a step too large for the x range (fewer than 2 grid points across x)', () =>
    expectReject({ fx: 'y', fy: '-x', xmin: -5, xmax: 5, ymin: -5, ymax: 5, step: 11 }, 'step'));
  it('rejects a step too large for the y range (fewer than 2 grid points across y)', () =>
    expectReject(
      { fx: 'y', fy: '-x', xmin: -5, xmax: 5, ymin: -1, ymax: 1, step: 3 },
      'step',
    ));

  it('rejects non-numeric scale', () =>
    expectReject({ fx: 'y', fy: '-x', scale: 'huge' }, 'scale'));
  it('rejects scale == 0', () => expectReject({ fx: 'y', fy: '-x', scale: 0 }, 'scale'));
  it('rejects negative scale', () => expectReject({ fx: 'y', fy: '-x', scale: -2 }, 'scale'));

  it('rejects non-boolean grid', () => expectReject({ fx: 'y', fy: '-x', grid: 'yes' }, 'grid'));

  it('collects multiple errors at once', () => {
    const result = parseProps({ xmin: 'a', step: -1, grid: 'maybe' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((e) => e.startsWith('fx:'))).toBe(true);
    expect(result.errors.some((e) => e.startsWith('fy:'))).toBe(true);
    expect(result.errors.some((e) => e.startsWith('xmin:'))).toBe(true);
    expect(result.errors.some((e) => e.startsWith('step:'))).toBe(true);
    expect(result.errors.some((e) => e.startsWith('grid:'))).toBe(true);
  });
});

describe('vector-field def export (FR-WID-001 contract)', () => {
  it('exposes a lazy component and the parseProps guard', () => {
    expect(typeof def.parseProps).toBe('function');
    expect(def.component).toBeDefined();
    // React.lazy exotic component marker
    expect((def.component as { $$typeof?: symbol }).$$typeof).toBe(Symbol.for('react.lazy'));
    expect(def.parseProps).toBe(parseProps);
  });
});
