import type { ComponentType, LazyExoticComponent } from 'react';

import type { Goal, JsonPrimitive, SemVer, StatePath } from '../types';

/** The version of the host/plugin data boundary, independent of plugin semver. */
export const ACTIVITY_OUTCOME_SCHEMA_VERSION = 1 as const;

/** NFR-PERF-001's maximum compressed size for an independently loaded activity. */
export const ACTIVITY_PLUGIN_MAX_LAZY_CHUNK_KB_GZIP = 150 as const;

/** JSON values that can safely cross an activity-to-engine boundary. */
export type ActivityOutcomeValue = JsonPrimitive | readonly string[];

/**
 * An observed learner action. Sequence numbers make a plugin's emitted trace
 * reproducible for the same seed and interaction sequence; wall-clock time is
 * deliberately excluded from this contract.
 */
export interface ActivityEvent {
  schemaVersion: typeof ACTIVITY_OUTCOME_SCHEMA_VERSION;
  sequence: number;
  type: 'interaction' | 'attempted' | 'hint-requested';
  values?: Readonly<Record<StatePath, ActivityOutcomeValue>>;
}

/**
 * The only data an activity may return to the experience engine. It is JSON
 * serialisable, versioned, and contains no callbacks, DOM nodes, or run state.
 * `completed` is retained for structural compatibility with the B3 SceneRunner.
 */
export interface ActivityOutcome {
  schemaVersion: typeof ACTIVITY_OUTCOME_SCHEMA_VERSION;
  completed: boolean;
  values: Readonly<Record<StatePath, ActivityOutcomeValue>>;
  events: readonly ActivityEvent[];
}

export interface ActivityOutcomeInput {
  completed: boolean;
  values?: Readonly<Record<StatePath, ActivityOutcomeValue>>;
  events?: readonly Omit<ActivityEvent, 'schemaVersion'>[];
}

export type ActivityJsonSchema =
  | boolean
  | {
      readonly type?: 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean' | 'null';
      readonly title?: string;
      readonly description?: string;
      readonly enum?: readonly JsonPrimitive[];
      readonly const?: JsonPrimitive;
      readonly properties?: Readonly<Record<string, ActivityJsonSchema>>;
      readonly required?: readonly string[];
      readonly additionalProperties?: boolean;
      readonly items?: ActivityJsonSchema;
      readonly minItems?: number;
      readonly maxItems?: number;
      /** JSON Schema uniqueness for primitive id lists and other set-like props. */
      readonly uniqueItems?: boolean;
      readonly minimum?: number;
      readonly maximum?: number;
      readonly minLength?: number;
      readonly maxLength?: number;
    };

export interface ActivityAuthoringMetadata {
  title: string;
  summary: string;
  category: 'choice' | 'entry' | 'explorable' | 'construction' | 'recall';
  /** Operators with which this activity is intentionally compatible. */
  supportedGoalOperators: readonly Goal['operator'][];
  learningUse: string;
}

export interface ActivityPreviewFixture<Props> {
  id: string;
  title: string;
  props: Readonly<Props>;
  seed: string;
  expectedOutcome: ActivityOutcome;
}

export interface ActivityPersistencePolicy {
  mode: 'none' | 'resume-supported';
  /** Required when a plugin offers serialisable local resume data. */
  stateVersion?: SemVer;
  explanation: string;
}

export interface ActivityAccessibilityContract {
  keyboard: {
    instructions: string;
    shortcuts: readonly string[];
  };
  focus: {
    initial: 'activity-root' | 'first-control';
    afterOutcome: 'retain' | 'feedback';
    visibleIndicator: true;
  };
  announcements: {
    politeness: 'polite' | 'assertive';
    attempt: string;
    completion: string;
  };
  reducedMotion: {
    policy: 'none' | 'respect-preference';
    alternative: string;
  };
  touch: {
    minimumTargetSizePx: 44;
    gestureAlternative: string;
  };
  labels: {
    activity: string;
    controls: readonly string[];
  };
  contrast: {
    minimumRatio: 4.5;
  };
}

/**
 * The performance declaration checked when a plugin is registered. The build
 * budget is intentionally explicit here so C2/H3 can consume the same source
 * of truth when they automate production chunk-size checks.
 */
export interface ActivityPerformanceContract {
  loading: 'lazy';
  /** Maximum permitted size of this plugin's independently loaded chunk, gzip-compressed. */
  lazyChunkBudgetKbGzip: number;
}

/** Immutable, seed-only context. It deliberately exposes no progress or run-state writer. */
export interface ActivityPluginContext {
  seed: string;
  activityInstanceId: string;
  attempt: number;
}

export interface ActivityPluginRenderProps<Props> {
  props: Readonly<Props>;
  context: Readonly<ActivityPluginContext>;
  disabled: boolean;
  /** Report a normalised, serialisable outcome after a learner interaction. */
  reportOutcome: (outcome: ActivityOutcome) => void;
}

export interface ActivityPlugin<Props> {
  key: string;
  version: SemVer;
  /** The component must be a React lazy chunk, never eagerly bundled with the runner. */
  component: LazyExoticComponent<ComponentType<ActivityPluginRenderProps<Props>>>;
  propsSchema: ActivityJsonSchema;
  authoring: ActivityAuthoringMetadata;
  previewFixtures: readonly ActivityPreviewFixture<Props>[];
  persistence: ActivityPersistencePolicy;
  accessibility: ActivityAccessibilityContract;
  performance: ActivityPerformanceContract;
}

export type AnyActivityPlugin = ActivityPlugin<Record<string, unknown>>;

function isPlainValue(value: unknown): value is ActivityOutcomeValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function normaliseValues(
  values: Readonly<Record<StatePath, ActivityOutcomeValue>> | undefined,
): Readonly<Record<StatePath, ActivityOutcomeValue>> {
  const result: Record<StatePath, ActivityOutcomeValue> = {};
  for (const path of Object.keys(values ?? {}).sort() as StatePath[]) {
    const value = values![path];
    if (!isPlainValue(value)) {
      throw new Error(`Activity outcome value at ${path} is not JSON serialisable.`);
    }
    result[path] = Array.isArray(value) ? Object.freeze([...value]) : value;
  }
  return Object.freeze(result);
}

/**
 * Makes the activity boundary deterministic: path keys are sorted, arrays are
 * copied, event schema versions are attached, and events must be sequential.
 */
export function normaliseActivityOutcome(input: ActivityOutcomeInput): ActivityOutcome {
  const events = (input.events ?? []).map((event, index) => {
    if (!Number.isInteger(event.sequence) || event.sequence !== index) {
      throw new Error('Activity events must use contiguous sequence numbers starting at 0.');
    }
    return Object.freeze({
      schemaVersion: ACTIVITY_OUTCOME_SCHEMA_VERSION,
      sequence: event.sequence,
      type: event.type,
      ...(event.values ? { values: normaliseValues(event.values) } : {}),
    });
  });
  return Object.freeze({
    schemaVersion: ACTIVITY_OUTCOME_SCHEMA_VERSION,
    completed: input.completed,
    values: normaliseValues(input.values),
    events: Object.freeze(events),
  });
}

function assertPluginContract<Props>(plugin: ActivityPlugin<Props>): void {
  if (!plugin.key || !plugin.version)
    throw new Error('Activity plugins require a key and version.');
  if (!plugin.authoring.title || !plugin.authoring.summary || !plugin.authoring.learningUse) {
    throw new Error(`Activity plugin ${plugin.key} is missing authoring metadata.`);
  }
  if (!plugin.previewFixtures.length) {
    throw new Error(`Activity plugin ${plugin.key} must provide at least one preview fixture.`);
  }
  if (plugin.persistence.mode === 'resume-supported' && !plugin.persistence.stateVersion) {
    throw new Error(`Resumable activity plugin ${plugin.key} requires a state version.`);
  }
  if (plugin.performance?.loading !== 'lazy') {
    throw new Error(`Activity plugin ${plugin.key} must declare the lazy loading strategy.`);
  }
  const lazyChunkBudget = plugin.performance.lazyChunkBudgetKbGzip;
  if (
    !Number.isFinite(lazyChunkBudget) ||
    lazyChunkBudget <= 0 ||
    lazyChunkBudget > ACTIVITY_PLUGIN_MAX_LAZY_CHUNK_KB_GZIP
  ) {
    throw new Error(
      `Activity plugin ${plugin.key} must declare a lazy chunk budget greater than 0 and at most ${ACTIVITY_PLUGIN_MAX_LAZY_CHUNK_KB_GZIP} KB gzip.`,
    );
  }
  const a11y = plugin.accessibility;
  if (
    !a11y.keyboard.instructions ||
    !a11y.announcements.attempt ||
    !a11y.announcements.completion ||
    !a11y.reducedMotion.alternative ||
    !a11y.touch.gestureAlternative ||
    !a11y.labels.activity ||
    !a11y.labels.controls.length
  ) {
    throw new Error(`Activity plugin ${plugin.key} has an incomplete accessibility contract.`);
  }
}

/** Defines an immutable plugin descriptor and rejects incomplete contracts early. */
export function defineActivityPlugin<Props>(plugin: ActivityPlugin<Props>): ActivityPlugin<Props> {
  assertPluginContract(plugin);
  return Object.freeze({
    ...plugin,
    previewFixtures: Object.freeze([...plugin.previewFixtures]),
    authoring: Object.freeze({ ...plugin.authoring }),
    persistence: Object.freeze({ ...plugin.persistence }),
    accessibility: Object.freeze({ ...plugin.accessibility }),
    performance: Object.freeze({ ...plugin.performance }),
  });
}
