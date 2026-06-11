// parseProps accept/reject table for `function-grapher` (FR-WID-003: every
// error message names the offending prop).

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

describe('function-grapher parseProps — accept', () => {
  it('applies defaults with only expr given', () => {
    const result = parseProps({ expr: 'x^2' });
    expect(result).toEqual({
      ok: true,
      props: {
        expr: 'x^2',
        xmin: -10,
        xmax: 10,
        ymin: undefined,
        ymax: undefined,
        tangent: false,
        grid: true,
      },
    });
  });

  it('coerces numeric strings (directive attrs arrive as strings)', () => {
    const result = parseProps({ expr: 'sin(x)', xmin: '-2', xmax: '2', ymin: '-1.5', ymax: '1.5' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.props.xmin).toBe(-2);
    expect(result.props.xmax).toBe(2);
    expect(result.props.ymin).toBe(-1.5);
    expect(result.props.ymax).toBe(1.5);
  });

  it('accepts boolean flags as booleans and as "true"/"false" strings', () => {
    const a = parseProps({ expr: 'x', tangent: true, grid: false });
    expect(a.ok && a.props.tangent === true && a.props.grid === false).toBe(true);
    const b = parseProps({ expr: 'x', tangent: 'true', grid: 'false' });
    expect(b.ok && b.props.tangent === true && b.props.grid === false).toBe(true);
  });

  it('accepts plain numbers for ranges', () => {
    const result = parseProps({ expr: 'x', xmin: -4, xmax: 4 });
    expect(result.ok).toBe(true);
  });
});

describe('function-grapher parseProps — reject (errors name the prop, FR-WID-003)', () => {
  it('rejects missing expr', () => expectReject({}, 'expr'));
  it('rejects empty expr', () => expectReject({ expr: '   ' }, 'expr'));
  it('rejects non-string expr', () => expectReject({ expr: 42 }, 'expr'));
  it('rejects non-numeric xmin', () => expectReject({ expr: 'x', xmin: 'abc' }, 'xmin'));
  it('rejects non-numeric xmax', () => expectReject({ expr: 'x', xmax: 'NaN' }, 'xmax'));
  it('rejects non-numeric ymin', () => expectReject({ expr: 'x', ymin: 'low' }, 'ymin'));
  it('rejects non-numeric ymax', () => expectReject({ expr: 'x', ymax: true }, 'ymax'));
  it('rejects xmin == xmax', () => expectReject({ expr: 'x', xmin: 5, xmax: 5 }, 'xmin'));
  it('rejects xmin > xmax', () => expectReject({ expr: 'x', xmin: '3', xmax: '-3' }, 'xmin'));
  it('rejects ymin >= ymax when both given', () =>
    expectReject({ expr: 'x', ymin: 2, ymax: -2 }, 'ymin'));
  it('rejects non-boolean tangent', () => expectReject({ expr: 'x', tangent: 'yes' }, 'tangent'));
  it('rejects non-boolean grid', () => expectReject({ expr: 'x', grid: 1 }, 'grid'));
  it('collects multiple errors at once', () => {
    const result = parseProps({ xmin: 'a', tangent: 'maybe' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((e) => e.startsWith('expr:'))).toBe(true);
    expect(result.errors.some((e) => e.startsWith('xmin:'))).toBe(true);
    expect(result.errors.some((e) => e.startsWith('tangent:'))).toBe(true);
  });
});

describe('function-grapher def export (FR-WID-001 contract)', () => {
  it('exposes a lazy component and the parseProps guard', () => {
    expect(typeof def.parseProps).toBe('function');
    expect(def.component).toBeDefined();
    // React.lazy exotic component marker
    expect((def.component as { $$typeof?: symbol }).$$typeof).toBe(Symbol.for('react.lazy'));
    expect(def.parseProps).toBe(parseProps);
  });
});
