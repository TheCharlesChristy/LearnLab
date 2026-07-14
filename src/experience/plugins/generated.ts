// C2 generated artefacts.  This module is the single projection point from
// registered ActivityPlugin definitions to the data consumed by validators,
// Studio, documentation, and preview tooling.  Do not create a second plugin
// registry in a schema, fixture, or form component.

import Ajv2020 from 'ajv/dist/2020';
import type { ErrorObject, ValidateFunction } from 'ajv';

import type {
  ActivityAccessibilityContract,
  ActivityAuthoringMetadata,
  ActivityJsonSchema,
  ActivityPerformanceContract,
  ActivityPersistencePolicy,
  ActivityPreviewFixture,
  AnyActivityPlugin,
} from './contracts';
import { activityPluginRegistry } from './registry';

export const ACTIVITY_PLUGIN_ARTEFACT_SCHEMA_VERSION = 1 as const;

export interface ActivityPluginSchemaDocument {
  $schema: 'https://json-schema.org/draft/2020-12/schema';
  $id: string;
  title: string;
  description: string;
  $defs: Readonly<Record<string, ActivityJsonSchema>>;
}

export interface StudioActivityPluginMetadata {
  key: string;
  version: string;
  title: string;
  summary: string;
  category: ActivityAuthoringMetadata['category'];
  supportedGoalOperators: readonly string[];
  learningUse: string;
  propsSchema: ActivityJsonSchema;
  previewFixtureIds: readonly string[];
  persistence: ActivityPersistencePolicy;
  accessibility: ActivityAccessibilityContract;
  performance: ActivityPerformanceContract;
}

export interface ActivityPluginFixtureManifest {
  schemaVersion: typeof ACTIVITY_PLUGIN_ARTEFACT_SCHEMA_VERSION;
  plugins: readonly {
    key: string;
    version: string;
    fixtures: readonly ActivityPreviewFixture<Record<string, unknown>>[];
  }[];
}

export interface StudioActivityPluginCatalog {
  schemaVersion: typeof ACTIVITY_PLUGIN_ARTEFACT_SCHEMA_VERSION;
  plugins: readonly StudioActivityPluginMetadata[];
}

export interface ActivityPropsValidationResult {
  valid: boolean;
  errors: readonly string[];
}

function orderedPlugins(
  registry: Readonly<Record<string, AnyActivityPlugin>> = activityPluginRegistry,
): readonly AnyActivityPlugin[] {
  const plugins = Object.entries(registry).map(([registeredKey, plugin]) => {
    if (registeredKey !== plugin.key) {
      throw new Error(
        `Activity plugin registry key "${registeredKey}" does not match plugin key "${plugin.key}".`,
      );
    }
    return plugin;
  });
  const keys = new Set(plugins.map((plugin) => plugin.key));
  if (keys.size !== plugins.length) throw new Error('Activity plugin registry contains duplicate plugin keys.');
  return Object.freeze(plugins.sort((left, right) => left.key.localeCompare(right.key)));
}

function cloneJson<Value>(value: Value): Value {
  return JSON.parse(JSON.stringify(value)) as Value;
}

function freeze<Value>(value: Value): Value {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) freeze(child);
  }
  return value;
}

/** JSON Schema definitions keyed by the stable registered activity key. */
export function createActivityPluginSchemaDocument(
  registry: Readonly<Record<string, AnyActivityPlugin>> = activityPluginRegistry,
): ActivityPluginSchemaDocument {
  const definitions: Record<string, ActivityJsonSchema> = {};
  for (const plugin of orderedPlugins(registry)) definitions[plugin.key] = cloneJson(plugin.propsSchema);
  return freeze({
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://learnlab.dev/schemas/activity-plugin-props.schema.json',
    title: 'LearnLab Activity Plugin Props',
    description:
      'Generated from the registered ActivityPlugin definitions. The definition named by activity.key validates activity.props.',
    $defs: definitions,
  });
}

/** Data-only Studio form/preview metadata. It intentionally contains no React component. */
export function createStudioActivityPluginCatalog(
  registry: Readonly<Record<string, AnyActivityPlugin>> = activityPluginRegistry,
): StudioActivityPluginCatalog {
  return freeze({
    schemaVersion: ACTIVITY_PLUGIN_ARTEFACT_SCHEMA_VERSION,
    plugins: orderedPlugins(registry).map((plugin) => ({
      key: plugin.key,
      version: plugin.version,
      title: plugin.authoring.title,
      summary: plugin.authoring.summary,
      category: plugin.authoring.category,
      supportedGoalOperators: [...plugin.authoring.supportedGoalOperators],
      learningUse: plugin.authoring.learningUse,
      propsSchema: cloneJson(plugin.propsSchema),
      previewFixtureIds: plugin.previewFixtures.map((fixture) => fixture.id),
      persistence: cloneJson(plugin.persistence),
      accessibility: cloneJson(plugin.accessibility),
      performance: cloneJson(plugin.performance),
    })),
  });
}

/** Preview data for Studio and test harnesses, including expected normalised outcomes. */
export function createActivityPluginFixtureManifest(
  registry: Readonly<Record<string, AnyActivityPlugin>> = activityPluginRegistry,
): ActivityPluginFixtureManifest {
  return freeze({
    schemaVersion: ACTIVITY_PLUGIN_ARTEFACT_SCHEMA_VERSION,
    plugins: orderedPlugins(registry).map((plugin) => ({
      key: plugin.key,
      version: plugin.version,
      fixtures: cloneJson(plugin.previewFixtures) as ActivityPreviewFixture<Record<string, unknown>>[],
    })),
  });
}

function formatValidationError(error: ErrorObject): string {
  const location = error.instancePath || '/';
  if (error.keyword === 'required') {
    const missing = String(error.params.missingProperty ?? 'required property');
    return `${location} is missing required property "${missing}"`;
  }
  if (error.keyword === 'additionalProperties') {
    const extra = String(error.params.additionalProperty ?? 'unexpected property');
    return `${location} must not include property "${extra}"`;
  }
  return `${location} ${error.message ?? 'is invalid'}`;
}

/**
 * Validate props against exactly one registered activity schema. The returned
 * messages are safe to show to an author; callers never need to interpret Ajv
 * error objects or select a schema themselves.
 */
export function validateActivityPluginProps(
  key: string,
  props: unknown,
  registry: Readonly<Record<string, AnyActivityPlugin>> = activityPluginRegistry,
): ActivityPropsValidationResult {
  const plugin = registry[key];
  if (plugin === undefined) {
    return freeze({ valid: false, errors: [`Unknown activity plugin "${key}".`] });
  }
  let validator: ValidateFunction;
  try {
    validator = new Ajv2020({ allErrors: true, strict: true }).compile(plugin.propsSchema);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return freeze({ valid: false, errors: [`Activity plugin "${key}" has an invalid props schema: ${reason}`] });
  }
  if (validator(props)) return freeze({ valid: true, errors: [] });
  return freeze({
    valid: false,
    errors: (validator.errors ?? []).map(formatValidationError),
  });
}

export function getStudioActivityPluginMetadata(
  key: string,
  registry: Readonly<Record<string, AnyActivityPlugin>> = activityPluginRegistry,
): StudioActivityPluginMetadata | undefined {
  return createStudioActivityPluginCatalog(registry).plugins.find((plugin) => plugin.key === key);
}

export function renderActivityPluginDocumentation(
  registry: Readonly<Record<string, AnyActivityPlugin>> = activityPluginRegistry,
): string {
  const catalog = createStudioActivityPluginCatalog(registry);
  const lines = [
    '# Activity plugins',
    '',
    '> Generated from registered `ActivityPlugin` definitions. Do not edit the generated facts by hand; update the plugin definition and refresh this file in the same change.',
    '',
    'Each `activity.key` selects its matching props schema below. The Studio catalog exposes the same metadata and preview-fixture identifiers without importing an activity component.',
  ];
  for (const plugin of catalog.plugins) {
    lines.push(
      '',
      `## \`${plugin.key}\` v${plugin.version}`,
      '',
      plugin.summary,
      '',
      `- Category: \`${plugin.category}\``,
      `- Supported goal operators: ${plugin.supportedGoalOperators.map((operator) => `\`${operator}\``).join(', ')}`,
      `- Learning use: ${plugin.learningUse}`,
      `- Persistence: \`${plugin.persistence.mode}\` — ${plugin.persistence.explanation}`,
      `- Lazy chunk budget: ${plugin.performance.lazyChunkBudgetKbGzip} KB gzip`,
      `- Studio preview fixtures: ${plugin.previewFixtureIds.map((id) => `\`${id}\``).join(', ')}`,
      '',
      '### Props schema',
      '',
      '```json',
      JSON.stringify(plugin.propsSchema, null, 2),
      '```',
      '',
      '### Accessibility contract',
      '',
      `Keyboard: ${plugin.accessibility.keyboard.instructions}`,
      '',
      `Focus starts at \`${plugin.accessibility.focus.initial}\` and after outcome is \`${plugin.accessibility.focus.afterOutcome}\`. Reduced motion: ${plugin.accessibility.reducedMotion.alternative}`,
    );
  }
  return `${lines.join('\n')}\n`;
}
