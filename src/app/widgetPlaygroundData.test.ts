// Guards the docs/WIDGETS.md example ↔ parseExampleAttrs invariant, and that
// every src-taking widget has a starter JSON sample.
import { describe, expect, it } from 'vitest';

import { WIDGET_KEYS, widgetRegistry } from '../widgets/registry';

import { getWidgetDoc } from './widgetDocs';
import { parseExampleAttrs, SRC_JSON_SAMPLES } from './widgetPlaygroundData';

const SRC_WIDGETS = [
  'flashcards',
  'matching-pairs',
  'quiz',
  'step-reveal',
  'data-plot',
  'logic-gate-sim',
  'geometry-canvas',
  'circuit-sim',
];

describe('parseExampleAttrs', () => {
  for (const key of WIDGET_KEYS) {
    it(`round-trips the documented example for "${key}" through parseProps`, () => {
      const doc = getWidgetDoc(key);
      expect(doc).toBeDefined();
      const raw = parseExampleAttrs(doc!.example);
      expect(raw.type).toBeUndefined();
      const parsed = widgetRegistry[key]!.parseProps(raw);
      expect(parsed.ok).toBe(true);
    });
  }
});

describe('SRC_JSON_SAMPLES', () => {
  for (const key of SRC_WIDGETS) {
    it(`has a valid JSON sample for "${key}"`, () => {
      const sample = SRC_JSON_SAMPLES[key];
      expect(sample).toBeDefined();
      expect(() => JSON.parse(sample!)).not.toThrow();
    });
  }
});
