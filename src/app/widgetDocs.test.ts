// Guards the docs/WIDGETS.md ↔ widgetDocs parsing invariant. CI already
// checks every registry key has a matching heading in docs/WIDGETS.md; this
// checks the *internal* structure of each section still parses, so a
// heading-format edit (e.g. renaming "### Example" to "#### Example")
// doesn't silently break the /widgets page.
import { describe, expect, it } from 'vitest';

import { WIDGET_KEYS } from '../widgets/registry';

import { getWidgetDoc } from './widgetDocs';

describe('widgetDocs', () => {
  for (const key of WIDGET_KEYS) {
    it(`parses a complete doc for "${key}"`, () => {
      const doc = getWidgetDoc(key);
      expect(doc).toBeDefined();
      expect(doc!.description.length).toBeGreaterThan(0);
      expect(doc!.example.length).toBeGreaterThan(0);
      expect(doc!.example).toContain(`type="${key}"`);
      for (const prop of doc!.props) {
        expect(prop.name.length).toBeGreaterThan(0);
        expect(prop.type.length).toBeGreaterThan(0);
        expect(prop.required.length).toBeGreaterThan(0);
        expect(prop.description.length).toBeGreaterThan(0);
      }
    });
  }
});
