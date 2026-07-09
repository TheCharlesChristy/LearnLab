// parseProps accept/reject table for `code-runner` (FR-WID-003: every error
// message names the offending prop) + def export contract (FR-WID-001).

import { describe, expect, it } from 'vitest';

import { def, parseProps } from './index';

function expectReject(raw: Parameters<typeof parseProps>[0], prop: string) {
  const result = parseProps(raw);
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.errors.some((e) => e.startsWith(`${prop}:`))).toBe(true);
}

describe('code-runner parseProps — accept', () => {
  it('accepts language="python" with defaults (rows defaults to 10)', () => {
    expect(parseProps({ language: 'python' })).toEqual({
      ok: true,
      props: { language: 'python', starter: undefined, solutionTest: undefined, rows: 10 },
    });
  });

  it('coerces a string rows to a number', () => {
    const result = parseProps({ language: 'python', rows: '6' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.props.rows).toBe(6);
  });

  it('keeps starter and solutionTest strings', () => {
    const result = parseProps({
      language: 'python',
      starter: 'print(1)',
      solutionTest: 'assert True',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.props.starter).toBe('print(1)');
      expect(result.props.solutionTest).toBe('assert True');
    }
  });

  it('unescapes literal \\n/\\t/\\\\ in starter and solutionTest (leaf directive attrs are single-line)', () => {
    const result = parseProps({
      language: 'python',
      starter: 'def f():\\n    return 1\\t# tab\\n\\\\ literal backslash',
      solutionTest: 'assert f() == 1\\nassert True',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.props.starter).toBe('def f():\n    return 1\t# tab\n\\ literal backslash');
      expect(result.props.solutionTest).toBe('assert f() == 1\nassert True');
    }
  });
});

describe('code-runner parseProps — reject (errors name the prop, FR-WID-003)', () => {
  it('rejects a non-python language', () => expectReject({ language: 'javascript' }, 'language'));
  it('rejects missing language', () => expectReject({}, 'language'));
  it('rejects rows = 0', () => expectReject({ language: 'python', rows: 0 }, 'rows'));
  it('rejects negative rows', () => expectReject({ language: 'python', rows: -3 }, 'rows'));
  it('rejects non-integer rows', () => expectReject({ language: 'python', rows: '2.5' }, 'rows'));
  it('rejects non-numeric rows string', () =>
    expectReject({ language: 'python', rows: 'lots' }, 'rows'));
  it('rejects non-string starter', () =>
    expectReject({ language: 'python', starter: 1 as unknown as string }, 'starter'));
});

describe('code-runner def export (FR-WID-001 contract)', () => {
  it('exposes a lazy component and the parseProps guard', () => {
    expect(typeof def.parseProps).toBe('function');
    expect((def.component as { $$typeof?: symbol }).$$typeof).toBe(Symbol.for('react.lazy'));
    expect(def.parseProps).toBe(parseProps);
  });
});
