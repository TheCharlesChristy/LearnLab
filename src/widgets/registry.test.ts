// Guards the keys.json ↔ widgetRegistry twin invariant (§4.7: WIDGET_KEYS is
// dumped to schemas/widget-keys.json for content validation).
import { describe, expect, it } from 'vitest';

import { WIDGET_KEYS, widgetRegistry } from './registry';

describe('widget registry', () => {
  it('registers exactly the keys in keys.json', () => {
    expect(Object.keys(widgetRegistry).sort()).toEqual([...WIDGET_KEYS].sort());
  });

  it('every entry has a component and parseProps', () => {
    for (const def of Object.values(widgetRegistry)) {
      expect(def.component).toBeDefined();
      expect(typeof def.parseProps).toBe('function');
    }
  });
});
