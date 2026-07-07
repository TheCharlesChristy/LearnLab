// parseProps accept/reject table for `truth-table` (FR-WID-003: every error
// message names the offending prop) + def export contract (FR-WID-001).

import { describe, expect, it } from 'vitest';

import { def, parseProps } from './index';

function expectReject(raw: Parameters<typeof parseProps>[0], prop: string) {
  const result = parseProps(raw);
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.errors.some((e) => e.startsWith(`${prop}:`))).toBe(true);
}

describe('truth-table parseProps — accept', () => {
  it('accepts a non-empty expr with default maxInputs', () => {
    expect(parseProps({ expr: 'A AND B' })).toEqual({
      ok: true,
      props: { expr: 'A AND B', maxInputs: 6 },
    });
  });

  it('accepts a numeric-string maxInputs', () => {
    expect(parseProps({ expr: 'A AND B', maxInputs: '3' })).toEqual({
      ok: true,
      props: { expr: 'A AND B', maxInputs: 3 },
    });
  });

  it('accepts a numeric maxInputs', () => {
    expect(parseProps({ expr: 'A AND B', maxInputs: 4 })).toEqual({
      ok: true,
      props: { expr: 'A AND B', maxInputs: 4 },
    });
  });
});

describe('truth-table parseProps — reject (errors name the prop, FR-WID-003)', () => {
  it('rejects missing expr', () => expectReject({}, 'expr'));
  it('rejects empty expr', () => expectReject({ expr: '   ' }, 'expr'));
  it('rejects non-string expr', () => expectReject({ expr: 42 }, 'expr'));
  it('rejects boolean expr', () => expectReject({ expr: true }, 'expr'));

  it('rejects zero maxInputs', () => expectReject({ expr: 'A', maxInputs: 0 }, 'maxInputs'));
  it('rejects negative maxInputs', () => expectReject({ expr: 'A', maxInputs: -1 }, 'maxInputs'));
  it('rejects a decimal maxInputs', () => expectReject({ expr: 'A', maxInputs: 1.5 }, 'maxInputs'));
  it('rejects a non-numeric maxInputs', () =>
    expectReject({ expr: 'A', maxInputs: 'lots' }, 'maxInputs'));
});

describe('truth-table def export (FR-WID-001 contract)', () => {
  it('exposes a lazy component and the parseProps guard', () => {
    expect(typeof def.parseProps).toBe('function');
    expect((def.component as { $$typeof?: symbol }).$$typeof).toBe(Symbol.for('react.lazy'));
    expect(def.parseProps).toBe(parseProps);
  });
});
