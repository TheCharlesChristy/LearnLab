import { lazy } from 'react';

import { defineActivityPlugin, normaliseActivityOutcome } from '../plugins/contracts';
import type { ActivityPlugin } from '../plugins/contracts';

export interface ExperimentInferOption {
  id: string;
  label: string;
}

export interface ExperimentInferTrial {
  id: string;
  controlLabel: string;
  observationLabel: string;
}

export interface ExperimentInferActivityProps {
  title: string;
  predictionPrompt: string;
  predictions: readonly ExperimentInferOption[];
  trials: readonly ExperimentInferTrial[];
  requiredTrialIds: readonly string[];
  inferencePrompt: string;
  rules: readonly ExperimentInferOption[];
  correctRuleId: string;
  transferPrompt: string;
  transferOptions: readonly ExperimentInferOption[];
  correctTransferId: string;
}

export const experimentInferActivityPlugin: ActivityPlugin<ExperimentInferActivityProps> =
  defineActivityPlugin<ExperimentInferActivityProps>({
    key: 'experiment-infer',
    version: '1.0.0',
    component: lazy(() => import('./ExperimentInferActivity')),
    propsSchema: {
      type: 'object',
      additionalProperties: false,
      required: [
        'title',
        'predictionPrompt',
        'predictions',
        'trials',
        'requiredTrialIds',
        'inferencePrompt',
        'rules',
        'correctRuleId',
        'transferPrompt',
        'transferOptions',
        'correctTransferId',
      ],
      properties: {
        title: { type: 'string', minLength: 1 },
        predictionPrompt: { type: 'string', minLength: 1 },
        predictions: {
          type: 'array',
          minItems: 2,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['id', 'label'],
            properties: {
              id: { type: 'string', minLength: 1 },
              label: { type: 'string', minLength: 1 },
            },
          },
        },
        trials: {
          type: 'array',
          minItems: 2,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['id', 'controlLabel', 'observationLabel'],
            properties: {
              id: { type: 'string', minLength: 1 },
              controlLabel: { type: 'string', minLength: 1 },
              observationLabel: { type: 'string', minLength: 1 },
            },
          },
        },
        requiredTrialIds: {
          type: 'array',
          minItems: 2,
          items: { type: 'string', minLength: 1 },
          uniqueItems: true,
        },
        inferencePrompt: { type: 'string', minLength: 1 },
        rules: {
          type: 'array',
          minItems: 2,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['id', 'label'],
            properties: {
              id: { type: 'string', minLength: 1 },
              label: { type: 'string', minLength: 1 },
            },
          },
        },
        correctRuleId: { type: 'string', minLength: 1 },
        transferPrompt: { type: 'string', minLength: 1 },
        transferOptions: {
          type: 'array',
          minItems: 2,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['id', 'label'],
            properties: {
              id: { type: 'string', minLength: 1 },
              label: { type: 'string', minLength: 1 },
            },
          },
        },
        correctTransferId: { type: 'string', minLength: 1 },
      },
    },
    authoring: {
      title: 'Experiment and infer',
      summary:
        'Commit a prediction, run controlled conditions, infer a rule from observations, then transfer it.',
      category: 'explorable',
      supportedGoalOperators: ['activity-complete', 'equals', 'set-equals'],
      learningUse:
        'Use for causal or quantitative relationships where learners must vary a declared input and justify a transferable rule.',
    },
    previewFixtures: [
      {
        id: 'direct-relationship',
        title: 'Direct relationship experiment',
        seed: 'experiment-infer:direct-relationship',
        props: {
          title: 'Lamp investigation',
          predictionPrompt: 'If the input rises, what will happen to the measured response?',
          predictions: [
            { id: 'larger', label: 'It will increase' },
            { id: 'smaller', label: 'It will decrease' },
          ],
          trials: [
            {
              id: 'low',
              controlLabel: 'Run low-input condition',
              observationLabel: 'Low input gives a small response.',
            },
            {
              id: 'high',
              controlLabel: 'Run high-input condition',
              observationLabel: 'High input gives a large response.',
            },
          ],
          requiredTrialIds: ['low', 'high'],
          inferencePrompt: 'Which rule accounts for both observations?',
          rules: [
            { id: 'direct', label: 'The response increases as the input increases.' },
            { id: 'inverse', label: 'The response decreases as the input increases.' },
          ],
          correctRuleId: 'direct',
          transferPrompt: 'For a new, still higher input, what should you predict?',
          transferOptions: [
            { id: 'increase', label: 'A larger response' },
            { id: 'decrease', label: 'A smaller response' },
          ],
          correctTransferId: 'increase',
        },
        expectedOutcome: normaliseActivityOutcome({
          completed: true,
          values: {
            '/prediction': 'larger',
            '/observations': ['low', 'high'],
            '/rule': 'direct',
            '/transfer': 'increase',
          },
          events: [
            { sequence: 0, type: 'interaction', values: { '/prediction': 'larger' } },
            { sequence: 1, type: 'interaction', values: { '/observations': ['low'] } },
            { sequence: 2, type: 'interaction', values: { '/observations': ['low', 'high'] } },
            { sequence: 3, type: 'interaction', values: { '/rule': 'direct' } },
            { sequence: 4, type: 'attempted', values: { '/rule': 'direct' } },
            { sequence: 5, type: 'interaction', values: { '/transfer': 'increase' } },
            { sequence: 6, type: 'attempted', values: { '/transfer': 'increase' } },
          ],
        }),
      },
    ],
    persistence: {
      mode: 'none',
      explanation:
        'The activity reports an accepted observation-to-transfer result; SceneRunner owns any checkpoint or durable mission state.',
    },
    accessibility: {
      keyboard: {
        instructions:
          'Use Tab to reach each prediction, condition, rule, and transfer button; activate it with Enter or Space.',
        shortcuts: ['Tab', 'Enter', 'Space'],
      },
      focus: { initial: 'first-control', afterOutcome: 'feedback', visibleIndicator: true },
      announcements: {
        politeness: 'polite',
        attempt: 'Inference or transfer answer submitted.',
        completion: 'Experiment inference complete.',
      },
      reducedMotion: {
        policy: 'none',
        alternative: 'Observations appear as immediate text; there is no timed motion.',
      },
      touch: {
        minimumTargetSizePx: 44,
        gestureAlternative:
          'Every condition and answer is a labelled button; no drag gesture is required.',
      },
      labels: {
        activity: 'Experiment and infer activity',
        controls: ['Prediction', 'Experiment conditions', 'Rule inference', 'Transfer answer'],
      },
      contrast: { minimumRatio: 4.5 },
    },
    performance: { loading: 'lazy', lazyChunkBudgetKbGzip: 150 },
  });

export const experimentInferActivityPluginRegistry = Object.freeze({
  [experimentInferActivityPlugin.key]:
    experimentInferActivityPlugin as unknown as import('../plugins/contracts').AnyActivityPlugin,
});
