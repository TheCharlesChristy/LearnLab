// parseProps accept/reject table for `geometry-canvas` (FR-WID-003: every
// error message names the offending prop) + def export contract (FR-WID-001).

import { describe, expect, it } from 'vitest';

import { def, parseProps } from './index';

function expectReject(raw: Parameters<typeof parseProps>[0], prop: string) {
  const result = parseProps(raw);
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.errors.some((e) => e.startsWith(`${prop}:`))).toBe(true);
}

describe('geometry-canvas parseProps — accept', () => {
  it('accepts a non-empty src with defaults for width/height', () => {
    expect(parseProps({ src: 'scenes/triangle.json' })).toEqual({
      ok: true,
      props: { src: 'scenes/triangle.json', width: 480, height: 480 },
    });
  });

  it('accepts numeric width/height as strings (directive attrs are strings)', () => {
    expect(parseProps({ src: 'scenes/triangle.json', width: '600', height: '400' })).toEqual({
      ok: true,
      props: { src: 'scenes/triangle.json', width: 600, height: 400 },
    });
  });

  it('accepts numeric width/height as numbers', () => {
    expect(parseProps({ src: 'scenes/triangle.json', width: 320, height: 320 })).toEqual({
      ok: true,
      props: { src: 'scenes/triangle.json', width: 320, height: 320 },
    });
  });
});

describe('geometry-canvas parseProps — reject (errors name the prop, FR-WID-003)', () => {
  it('rejects missing src', () => expectReject({}, 'src'));
  it('rejects empty src', () => expectReject({ src: '   ' }, 'src'));
  it('rejects non-string src', () => expectReject({ src: 42 }, 'src'));
  it('rejects boolean src', () => expectReject({ src: true }, 'src'));

  it('rejects a zero width', () => expectReject({ src: 'x.json', width: 0 }, 'width'));
  it('rejects a negative width', () => expectReject({ src: 'x.json', width: -10 }, 'width'));
  it('rejects a non-numeric width', () => expectReject({ src: 'x.json', width: 'big' }, 'width'));
  it('rejects a boolean width', () => expectReject({ src: 'x.json', width: true }, 'width'));

  it('rejects a zero height', () => expectReject({ src: 'x.json', height: 0 }, 'height'));
  it('rejects a negative height', () => expectReject({ src: 'x.json', height: -10 }, 'height'));
  it('rejects a non-numeric height', () => expectReject({ src: 'x.json', height: 'big' }, 'height'));

  it('collects multiple errors at once', () => {
    const result = parseProps({ width: -1, height: 'nope' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toHaveLength(3);
  });
});

describe('geometry-canvas def export (FR-WID-001 contract)', () => {
  it('exposes a lazy component and the parseProps guard', () => {
    expect(typeof def.parseProps).toBe('function');
    expect((def.component as { $$typeof?: symbol }).$$typeof).toBe(Symbol.for('react.lazy'));
    expect(def.parseProps).toBe(parseProps);
  });
});
