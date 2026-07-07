// parseProps accept/reject table for `step-reveal` (FR-WID-003: every error
// message names the offending prop) + def export contract (FR-WID-001).

import { describe, expect, it } from 'vitest';

import { def, parseProps } from './index';

function expectReject(raw: Parameters<typeof parseProps>[0], prop: string) {
  const result = parseProps(raw);
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.errors.some((e) => e.startsWith(`${prop}:`))).toBe(true);
}

describe('step-reveal parseProps — accept', () => {
  it('accepts a non-empty src', () => {
    expect(parseProps({ src: 'steps/solution.json' })).toEqual({
      ok: true,
      props: { src: 'steps/solution.json' },
    });
  });
});

describe('step-reveal parseProps — reject (errors name the prop, FR-WID-003)', () => {
  it('rejects missing src', () => expectReject({}, 'src'));
  it('rejects empty src', () => expectReject({ src: '  ' }, 'src'));
  it('rejects non-string src', () => expectReject({ src: 7 }, 'src'));
});

describe('step-reveal def export (FR-WID-001 contract)', () => {
  it('exposes a lazy component and the parseProps guard', () => {
    expect(typeof def.parseProps).toBe('function');
    expect((def.component as { $$typeof?: symbol }).$$typeof).toBe(Symbol.for('react.lazy'));
    expect(def.parseProps).toBe(parseProps);
  });
});
