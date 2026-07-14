import { lazy } from 'react';

import { defineActivityPlugin, normaliseActivityOutcome } from '../plugins/contracts';
import type { ActivityPlugin } from '../plugins/contracts';

export interface PythonItemActivityProps {
  /** Stable pack-local identity; it is never an account or learner identifier. */
  itemId: string;
  /** Same-origin course-pack path to a `.py` item. Remote/data/blob URLs are rejected at render time. */
  sourceUrl: string;
  params?: Record<string, unknown>;
  height?: number;
  seed?: number;
  /** Caller-owned persisted worker state supplied on a later resume. */
  savedState?: Record<string, unknown>;
  title?: string;
}

export const pythonItemActivityPlugin: ActivityPlugin<PythonItemActivityProps> =
  defineActivityPlugin({
    key: 'python-item',
    version: '1.0.0',
    component: lazy(() => import('./PythonItemActivity')),
    propsSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['itemId', 'sourceUrl'],
      properties: {
        itemId: { type: 'string', minLength: 1 },
        sourceUrl: { type: 'string', minLength: 1 },
        params: { type: 'object' },
        height: { type: 'number', minimum: 1 },
        seed: { type: 'integer', minimum: 0 },
        savedState: { type: 'object' },
        title: { type: 'string', minLength: 1 },
      },
    },
    authoring: {
      title: 'Python item',
      summary:
        'Runs one same-origin Python item in the isolated worker and emits only its progress summary.',
      category: 'construction',
      supportedGoalOperators: ['activity-complete', 'equals', 'in-range'],
      learningUse:
        'Use when an item needs the Python SDK or a simulation, with the authored item retaining its own interaction and feedback.',
    },
    previewFixtures: [
      {
        id: 'worker-progress-contract',
        title: 'Python item progress event',
        seed: 'python-item-preview',
        props: {
          itemId: 'items/example',
          sourceUrl: '/content/physics/example/items/example.py',
          title: 'Example Python item',
          seed: 7,
        },
        expectedOutcome: normaliseActivityOutcome({
          completed: true,
          values: { '/progress-kind': 'scored', '/score': 1, '/max-score': 1 },
          events: [
            {
              sequence: 0,
              type: 'attempted',
              values: { '/progress-kind': 'scored', '/score': 1, '/max-score': 1 },
            },
          ],
        }),
      },
    ],
    persistence: {
      mode: 'resume-supported',
      stateVersion: '1.0.0',
      explanation:
        'The worker serialises JSON state through the existing PERSIST protocol; the v2 caller supplies savedState on resume and remains the only durable-state writer.',
    },
    accessibility: {
      keyboard: {
        instructions:
          'Use the Python item’s native keyboard controls. Progress feedback is announced after the item reports a result.',
        shortcuts: ['Tab', 'Enter', 'Space'],
      },
      focus: { initial: 'activity-root', afterOutcome: 'feedback', visibleIndicator: true },
      announcements: {
        politeness: 'polite',
        attempt: 'Python item progress reported.',
        completion: 'Python item completed.',
      },
      reducedMotion: {
        policy: 'respect-preference',
        alternative: 'The worker item owns its motion behaviour; no adapter animation is added.',
      },
      touch: {
        minimumTargetSizePx: 44,
        gestureAlternative:
          'The item must expose native controls through the Python component tree.',
      },
      labels: { activity: 'Python item activity', controls: ['Python item controls'] },
      contrast: { minimumRatio: 4.5 },
    },
    performance: { loading: 'lazy', lazyChunkBudgetKbGzip: 150 },
  });

export const pythonActivityPluginRegistry = Object.freeze({
  [pythonItemActivityPlugin.key]:
    pythonItemActivityPlugin as unknown as import('../plugins/contracts').AnyActivityPlugin,
});
