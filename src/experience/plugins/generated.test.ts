import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { activityPluginRegistry } from './registry';
import { seededChoicePlugin } from './reference/seeded-choice';
import {
  createActivityPluginFixtureManifest,
  createActivityPluginSchemaDocument,
  createStudioActivityPluginCatalog,
  getStudioActivityPluginMetadata,
  renderActivityPluginDocumentation,
  validateActivityPluginProps,
} from './generated';

const repoRoot = resolve(import.meta.dirname, '../../..');

function renderedJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

describe('ActivityPlugin generated artefacts (#42)', () => {
  it('validates every shipped preview fixture with its owning plugin schema', () => {
    for (const plugin of Object.values(activityPluginRegistry)) {
      for (const fixture of plugin.previewFixtures) {
        expect(validateActivityPluginProps(plugin.key, fixture.props)).toEqual({
          valid: true,
          errors: [],
        });
      }
    }
  });

  it('returns precise author-facing errors for unknown, missing, and unexpected props', () => {
    expect(validateActivityPluginProps('not-registered', {})).toEqual({
      valid: false,
      errors: ['Unknown activity plugin "not-registered".'],
    });
    expect(validateActivityPluginProps('seeded-choice', { prompt: 'Choose' })).toEqual({
      valid: false,
      errors: expect.arrayContaining([
        expect.stringContaining('is missing required property "options"'),
        expect.stringContaining('is missing required property "correctId"'),
      ]),
    });
    expect(
      validateActivityPluginProps('seeded-choice', {
        prompt: 'Choose',
        options: [
          { id: 'a', label: 'A' },
          { id: 'b', label: 'B' },
        ],
        correctId: 'a',
        typo: true,
      }),
    ).toEqual({
      valid: false,
      errors: expect.arrayContaining([expect.stringContaining('must not include property "typo"')]),
    });
  });

  it('projects source definitions into immutable, sorted schema, fixture, and Studio data', () => {
    const schema = createActivityPluginSchemaDocument();
    const fixtures = createActivityPluginFixtureManifest();
    const catalog = createStudioActivityPluginCatalog();

    const keys = [
      'core-choice',
      'core-entry',
      'core-faded-step',
      'core-flash-recall',
      'core-predict',
      'core-reveal-mechanism',
      'core-sort-match',
      'diagnose-repair',
      'experiment-infer',
      'explore-eigen-playground',
      'explore-function-grapher',
      'explore-signal-scope',
      'python-item',
      'seeded-choice',
      'v1-screen',
    ];
    expect(Object.keys(schema.$defs)).toEqual(keys);
    expect(fixtures.plugins.map((plugin) => plugin.key)).toEqual(keys);
    expect(catalog.plugins.map((plugin) => plugin.key)).toEqual(keys);
    expect(Object.isFrozen(catalog)).toBe(true);
    expect(Object.isFrozen(catalog.plugins)).toBe(true);
    expect(getStudioActivityPluginMetadata('seeded-choice')).toEqual(
      expect.objectContaining({
        title: 'Seeded choice',
        previewFixtureIds: ['basic-correct-choice'],
      }),
    );
  });

  it('fails closed when a registry entry would make generated artefacts ambiguous', () => {
    const malformedRegistry = {
      alias: seededChoicePlugin,
    } as unknown as typeof activityPluginRegistry;
    expect(() => createActivityPluginSchemaDocument(malformedRegistry)).toThrow(
      /registry key "alias" does not match plugin key "seeded-choice"/,
    );
  });

  it('keeps checked-in schema, fixture, and documentation projections in lockstep with plugin definitions', () => {
    expect(
      readFileSync(resolve(repoRoot, 'schemas/activity-plugin-props.schema.json'), 'utf8'),
    ).toBe(renderedJson(createActivityPluginSchemaDocument()));
    expect(readFileSync(resolve(repoRoot, 'fixtures/activity-plugins.json'), 'utf8')).toBe(
      renderedJson(createActivityPluginFixtureManifest()),
    );
    expect(readFileSync(resolve(repoRoot, 'docs/ACTIVITY_PLUGINS.md'), 'utf8')).toBe(
      renderActivityPluginDocumentation(),
    );
  });
});
