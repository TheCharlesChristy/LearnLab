// The components map MUST cover exactly the closed set COMPONENT_TYPES (§6.7).

import { describe, expect, it } from 'vitest';

import { COMPONENT_TYPES } from '../../component-tree';
import { components } from '../index';

describe('components registry', () => {
  it('keys exactly equal COMPONENT_TYPES (closed set, §6.7)', () => {
    expect(Object.keys(components).sort()).toEqual([...COMPONENT_TYPES].sort());
  });

  it('every entry is a function component', () => {
    for (const [name, Comp] of Object.entries(components)) {
      expect(typeof Comp, `${name} is a component`).toBe('function');
    }
  });

  it('adds no component types beyond the closed set', () => {
    const allowed = new Set<string>(COMPONENT_TYPES);
    for (const key of Object.keys(components)) {
      expect(allowed.has(key), `${key} is in COMPONENT_TYPES`).toBe(true);
    }
  });
});
