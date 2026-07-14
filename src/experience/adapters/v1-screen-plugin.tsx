import { lazy } from 'react';

import { defineActivityPlugin } from '../plugins/contracts';
import type { ActivityPlugin } from '../plugins/contracts';
import type { Screen } from '../../screens';

/** Props emitted only by {@link adaptScreenSequence}; this is not pack-authored data. */
export interface V1ScreenActivityProps {
  legacyLessonId: string;
  screen: Screen;
  index: number;
  total: number;
}

/**
 * Private compatibility capability for adapted v1 screen sequences.
 *
 * This descriptor lives with the adapter rather than the pack-authoring
 * registry: course packs cannot opt into legacy execution by declaring a
 * string, while the public activity lookup can still resolve an adapted
 * graph's declared activity through the same lazy, outcome-only boundary as
 * every other activity.
 */
export const v1ScreenActivityPlugin: ActivityPlugin<V1ScreenActivityProps> =
  defineActivityPlugin<V1ScreenActivityProps>({
    key: 'v1-screen',
    version: '1.0.0',
    component: lazy(() => import('./V1ScreenActivity')),
    // The original v1 screen schema remains the authoritative discriminated
    // contract. This narrow outer schema prevents an adapter payload from
    // crossing the activity boundary without its required identity fields.
    propsSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['legacyLessonId', 'screen', 'index', 'total'],
      properties: {
        legacyLessonId: { type: 'string', minLength: 1 },
        screen: { type: 'object' },
        index: { type: 'integer', minimum: 0 },
        total: { type: 'integer', minimum: 1 },
      },
    },
    authoring: {
      title: 'Legacy screen adapter',
      summary: 'Runs one validated v1 screen inside the v2 outcome boundary.',
      category: 'construction',
      supportedGoalOperators: ['activity-complete'],
      learningUse:
        'Compatibility-only; emitted by adaptScreenSequence and never authored in a course pack.',
    },
    previewFixtures: [
      {
        id: 'adapter-contract',
        title: 'Adapter payload shape',
        seed: 'v1-screen-adapter',
        props: {
          legacyLessonId: 'legacy-lesson',
          screen: {
            type: 'tap-choice',
            id: 'legacy-choice',
            prompt: 'Choose.',
            choices: [{ text: 'No' }, { text: 'Yes' }],
            correctIndex: 1,
            successFeedback: 'Correct.',
          },
          index: 0,
          total: 1,
        },
        expectedOutcome: {
          schemaVersion: 1,
          completed: true,
          values: {},
          events: [],
        },
      },
    ],
    persistence: {
      mode: 'none',
      explanation:
        'SceneRunner persists the v2 checkpoint after the original v1 screen reports completion.',
    },
    performance: {
      loading: 'lazy',
      // The adapter is a thin lazy bridge; keep it below the platform's normal
      // per-activity ceiling even though its original v1 screen remains lazy.
      lazyChunkBudgetKbGzip: 150,
    },
    accessibility: {
      keyboard: {
        instructions:
          'Use the original screen controls; its registered screen runner owns keyboard behaviour.',
        shortcuts: ['Tab', 'Enter', 'Space'],
      },
      focus: { initial: 'first-control', afterOutcome: 'feedback', visibleIndicator: true },
      announcements: {
        politeness: 'polite',
        attempt: 'Legacy screen interaction submitted.',
        completion: 'Legacy screen complete.',
      },
      reducedMotion: {
        policy: 'respect-preference',
        alternative: 'The original screen runner supplies its reduced-motion behaviour.',
      },
      touch: {
        minimumTargetSizePx: 44,
        gestureAlternative: 'The original screen runner exposes button controls.',
      },
      labels: { activity: 'Legacy screen activity', controls: ['Original screen controls'] },
      contrast: { minimumRatio: 4.5 },
    },
  });

/** Adapter-only additions to the public runtime activity lookup. */
export const adapterActivityPluginRegistry = Object.freeze({
  [v1ScreenActivityPlugin.key]:
    v1ScreenActivityPlugin as unknown as import('../plugins/contracts').AnyActivityPlugin,
});
