import { lazy } from 'react';

import { defineActivityPlugin, normaliseActivityOutcome } from '../plugins/contracts';
import type { ActivityPlugin } from '../plugins/contracts';

export interface FunctionGrapherActivityProps {
  expr: string;
  xmin: number;
  xmax: number;
  ymin?: number;
  ymax?: number;
  grid?: boolean;
  hints?: readonly string[];
}

export interface SignalScopeActivityProps {
  expr: string;
  sampleRate: number;
  duration: number;
  noiseAmount?: number;
  freqMin: number;
  freqMax: number;
  freqInit?: number;
  showSpectrum?: boolean;
  hints?: readonly string[];
}

export interface EigenPlaygroundActivityProps {
  a: number;
  c: number;
  bMin: number;
  bMax: number;
  bInit?: number;
  showPoints?: boolean;
  hints?: readonly string[];
}

const HINTS_SCHEMA = {
  type: 'array' as const,
  items: { type: 'string' as const, minLength: 1 },
};

const COMMON_ACCESSIBILITY = {
  focus: {
    initial: 'first-control' as const,
    afterOutcome: 'feedback' as const,
    visibleIndicator: true as const,
  },
  announcements: {
    politeness: 'polite' as const,
    attempt: 'Observation recorded.',
    completion: 'Exploration observation submitted.',
  },
  reducedMotion: {
    policy: 'none' as const,
    alternative: 'The explorable has no timed animation; its value updates immediately.',
  },
  touch: {
    minimumTargetSizePx: 44 as const,
    gestureAlternative:
      'The adjustable value is a keyboard-operable slider as well as pointer-operable.',
  },
  contrast: { minimumRatio: 4.5 as const },
  performance: { loading: 'lazy' as const, lazyChunkBudgetKbGzip: 150 },
};

// One lazy implementation dispatches on disjoint prop shapes. The casts keep
// that runtime dispatch behind three separately typed public plugin contracts.
const LazyExplorableActivity = lazy(() => import('./ExplorableActivity'));
const functionGrapherComponent =
  LazyExplorableActivity as unknown as ActivityPlugin<FunctionGrapherActivityProps>['component'];
const signalScopeComponent =
  LazyExplorableActivity as unknown as ActivityPlugin<SignalScopeActivityProps>['component'];
const eigenPlaygroundComponent =
  LazyExplorableActivity as unknown as ActivityPlugin<EigenPlaygroundActivityProps>['component'];

export const functionGrapherActivityPlugin: ActivityPlugin<FunctionGrapherActivityProps> =
  defineActivityPlugin({
    key: 'explore-function-grapher',
    version: '1.0.0',
    component: functionGrapherComponent,
    propsSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['expr', 'xmin', 'xmax'],
      properties: {
        expr: { type: 'string', minLength: 1 },
        xmin: { type: 'number' },
        xmax: { type: 'number' },
        ymin: { type: 'number' },
        ymax: { type: 'number' },
        grid: { type: 'boolean' },
        hints: HINTS_SCHEMA,
      },
    },
    authoring: {
      title: 'Function graph exploration',
      summary: 'Moves a tangent point and reports its observable x-coordinate and gradient.',
      category: 'explorable',
      supportedGoalOperators: ['activity-complete', 'equals', 'in-range'],
      learningUse:
        'Use after a prediction when learners must test a graph property at a chosen tangent point.',
    },
    previewFixtures: [
      {
        id: 'quadratic-tangent',
        title: 'Quadratic tangent observation',
        seed: 'function-graph-preview',
        props: {
          expr: 'x^2',
          xmin: -4,
          xmax: 4,
          grid: true,
          hints: ['Use the arrow keys on the tangent point.'],
        },
        expectedOutcome: normaliseActivityOutcome({
          completed: true,
          values: { '/x': 4, '/gradient': 8 },
          events: [
            { sequence: 0, type: 'interaction', values: { '/x': 4, '/gradient': 8 } },
            { sequence: 1, type: 'attempted', values: { '/x': 4, '/gradient': 8 } },
          ],
        }),
      },
    ],
    persistence: {
      mode: 'none',
      explanation:
        'The graph configuration is authored data; only the submitted observable crosses the activity boundary.',
    },
    accessibility: {
      ...COMMON_ACCESSIBILITY,
      keyboard: {
        instructions:
          'Focus the tangent slider, use arrow keys to move it, then record the observation.',
        shortcuts: ['Tab', 'Arrow keys', 'Enter'],
      },
      labels: {
        activity: 'Function graph exploration',
        controls: ['Tangent point', 'Record observation'],
      },
    },
    performance: COMMON_ACCESSIBILITY.performance,
  });

export const signalScopeActivityPlugin: ActivityPlugin<SignalScopeActivityProps> =
  defineActivityPlugin({
    key: 'explore-signal-scope',
    version: '1.0.0',
    component: signalScopeComponent,
    propsSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['expr', 'sampleRate', 'duration', 'freqMin', 'freqMax'],
      properties: {
        expr: { type: 'string', minLength: 1 },
        sampleRate: { type: 'number', minimum: 1 },
        duration: { type: 'number', minimum: 0.001 },
        noiseAmount: { type: 'number', minimum: 0 },
        freqMin: { type: 'number' },
        freqMax: { type: 'number' },
        freqInit: { type: 'number' },
        showSpectrum: { type: 'boolean' },
        hints: HINTS_SCHEMA,
      },
    },
    authoring: {
      title: 'Signal scope exploration',
      summary: 'Adjusts a signal frequency and reports the live frequency and spectral peak.',
      category: 'explorable',
      supportedGoalOperators: ['activity-complete', 'equals', 'in-range'],
      learningUse:
        'Use to make learners test a frequency prediction against a waveform and spectrum.',
    },
    previewFixtures: [
      {
        id: 'sine-spectrum',
        title: 'Sine spectrum observation',
        seed: 'signal-scope-preview',
        props: {
          expr: 'sin(2*pi*f*t)',
          sampleRate: 64,
          duration: 4,
          freqMin: 1,
          freqMax: 8,
          showSpectrum: true,
        },
        expectedOutcome: normaliseActivityOutcome({
          completed: true,
          values: { '/frequency': 8, '/peak-frequency': 8 },
          events: [
            { sequence: 0, type: 'interaction', values: { '/frequency': 8, '/peak-frequency': 8 } },
            { sequence: 1, type: 'attempted', values: { '/frequency': 8, '/peak-frequency': 8 } },
          ],
        }),
      },
    ],
    persistence: {
      mode: 'none',
      explanation:
        'The signal configuration is authored data; only the submitted observable crosses the activity boundary.',
    },
    accessibility: {
      ...COMMON_ACCESSIBILITY,
      keyboard: {
        instructions:
          'Focus the frequency slider, use arrow keys to adjust it, then record the observation.',
        shortcuts: ['Tab', 'Arrow keys', 'Enter'],
      },
      labels: {
        activity: 'Signal scope exploration',
        controls: ['Frequency', 'Record observation'],
      },
    },
    performance: COMMON_ACCESSIBILITY.performance,
  });

export const eigenPlaygroundActivityPlugin: ActivityPlugin<EigenPlaygroundActivityProps> =
  defineActivityPlugin({
    key: 'explore-eigen-playground',
    version: '1.0.0',
    component: eigenPlaygroundComponent,
    propsSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['a', 'c', 'bMin', 'bMax'],
      properties: {
        a: { type: 'number', minimum: 0.000001 },
        c: { type: 'number', minimum: 0.000001 },
        bMin: { type: 'number' },
        bMax: { type: 'number' },
        bInit: { type: 'number' },
        showPoints: { type: 'boolean' },
        hints: HINTS_SCHEMA,
      },
    },
    authoring: {
      title: 'Eigen playground exploration',
      summary: 'Adjusts covariance and reports its value, eigenvector angle, and eigenvalues.',
      category: 'explorable',
      supportedGoalOperators: ['activity-complete', 'equals', 'in-range'],
      learningUse:
        'Use when learners should investigate how a covariance term changes a principal direction.',
    },
    previewFixtures: [
      {
        id: 'covariance-angle',
        title: 'Covariance angle observation',
        seed: 'eigen-preview',
        props: { a: 2, c: 1, bMin: -1, bMax: 1, showPoints: true },
        expectedOutcome: normaliseActivityOutcome({
          completed: true,
          values: {
            '/covariance': 1,
            '/angle-degrees': 31.717,
            '/eigenvalue-major': 2.618,
            '/eigenvalue-minor': 0.382,
          },
          events: [
            {
              sequence: 0,
              type: 'interaction',
              values: {
                '/covariance': 1,
                '/angle-degrees': 31.717,
                '/eigenvalue-major': 2.618,
                '/eigenvalue-minor': 0.382,
              },
            },
            {
              sequence: 1,
              type: 'attempted',
              values: {
                '/covariance': 1,
                '/angle-degrees': 31.717,
                '/eigenvalue-major': 2.618,
                '/eigenvalue-minor': 0.382,
              },
            },
          ],
        }),
      },
    ],
    persistence: {
      mode: 'none',
      explanation:
        'The matrix configuration is authored data; only the submitted observable crosses the activity boundary.',
    },
    accessibility: {
      ...COMMON_ACCESSIBILITY,
      keyboard: {
        instructions:
          'Focus the covariance slider, use arrow keys to adjust it, then record the observation.',
        shortcuts: ['Tab', 'Arrow keys', 'Enter'],
      },
      labels: {
        activity: 'Eigen playground exploration',
        controls: ['Off-diagonal covariance term b', 'Record observation'],
      },
    },
    performance: COMMON_ACCESSIBILITY.performance,
  });

export const explorableActivityPluginRegistry = Object.freeze({
  [functionGrapherActivityPlugin.key]:
    functionGrapherActivityPlugin as unknown as import('../plugins/contracts').AnyActivityPlugin,
  [signalScopeActivityPlugin.key]:
    signalScopeActivityPlugin as unknown as import('../plugins/contracts').AnyActivityPlugin,
  [eigenPlaygroundActivityPlugin.key]:
    eigenPlaygroundActivityPlugin as unknown as import('../plugins/contracts').AnyActivityPlugin,
});
