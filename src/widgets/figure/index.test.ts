// parseProps accept/reject table for `figure` (FR-WID-003: every error
// message names the offending prop; alt enforced per SRS §5.3).

import { describe, expect, it } from 'vitest';

import { def, parseProps } from './index';

function expectReject(raw: Parameters<typeof parseProps>[0], prop: string) {
  const result = parseProps(raw);
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.errors.some((e) => e.startsWith(`${prop}:`))).toBe(true);
}

describe('figure parseProps — accept', () => {
  it('accepts src + alt', () => {
    const result = parseProps({ src: 'images/cell.png', alt: 'A plant cell' });
    expect(result).toEqual({
      ok: true,
      props: { src: 'images/cell.png', alt: 'A plant cell', caption: undefined, width: undefined },
    });
  });

  it('accepts optional caption and numeric-string width', () => {
    const result = parseProps({
      src: 'a.png',
      alt: 'alt text',
      caption: 'Figure 1',
      width: '320',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.props.caption).toBe('Figure 1');
    expect(result.props.width).toBe(320);
  });

  it('accepts width given as a number', () => {
    const result = parseProps({ src: 'a.png', alt: 'x', width: 240 });
    expect(result.ok && result.props.width === 240).toBe(true);
  });
});

describe('figure parseProps — reject (errors name the prop, FR-WID-003)', () => {
  it('rejects missing alt (alt enforced by validation)', () =>
    expectReject({ src: 'a.png' }, 'alt'));
  it('rejects empty alt', () => expectReject({ src: 'a.png', alt: '  ' }, 'alt'));
  it('rejects non-string alt', () => expectReject({ src: 'a.png', alt: 7 }, 'alt'));
  it('rejects missing src', () => expectReject({ alt: 'something' }, 'src'));
  it('rejects empty src', () => expectReject({ src: '', alt: 'something' }, 'src'));
  it('rejects non-numeric width', () =>
    expectReject({ src: 'a.png', alt: 'x', width: 'wide' }, 'width'));
  it('rejects non-positive width', () =>
    expectReject({ src: 'a.png', alt: 'x', width: '-10' }, 'width'));
  it('rejects boolean width', () => expectReject({ src: 'a.png', alt: 'x', width: true }, 'width'));
  it('rejects non-string caption', () =>
    expectReject({ src: 'a.png', alt: 'x', caption: false }, 'caption'));
  it('collects multiple errors at once', () => {
    const result = parseProps({ width: 'huge' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((e) => e.startsWith('src:'))).toBe(true);
    expect(result.errors.some((e) => e.startsWith('alt:'))).toBe(true);
    expect(result.errors.some((e) => e.startsWith('width:'))).toBe(true);
  });
});

describe('figure def export (FR-WID-001 contract)', () => {
  it('exposes a lazy component and the parseProps guard', () => {
    expect(typeof def.parseProps).toBe('function');
    expect((def.component as { $$typeof?: symbol }).$$typeof).toBe(Symbol.for('react.lazy'));
    expect(def.parseProps).toBe(parseProps);
  });
});
