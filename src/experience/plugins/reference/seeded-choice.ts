import { lazy } from 'react';

import { defineActivityPlugin, normaliseActivityOutcome } from '../contracts';
import type { ActivityPlugin } from '../contracts';

export interface SeededChoiceProps {
  prompt: string;
  options: readonly { id: string; label: string }[];
  correctId: string;
}

export const seededChoicePlugin: ActivityPlugin<SeededChoiceProps> = defineActivityPlugin({
  key: 'seeded-choice',
  version: '1.0.0',
  component: lazy(() => import('./SeededChoiceActivity')),
  propsSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['prompt', 'options', 'correctId'],
    properties: {
      prompt: { type: 'string', minLength: 1 },
      options: {
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
      correctId: { type: 'string', minLength: 1 },
    },
  },
  authoring: {
    title: 'Seeded choice',
    summary: 'A deterministic single-choice interaction with a normalised selected-answer outcome.',
    category: 'choice',
    supportedGoalOperators: ['activity-complete', 'equals'],
    learningUse:
      'Use for retrieval or prediction commitments where selecting one diagnosis is meaningful.',
  },
  previewFixtures: [
    {
      id: 'basic-correct-choice',
      title: 'Correct answer',
      seed: 'reference-choice-1',
      props: {
        prompt: 'Which route is safe?',
        options: [
          { id: 'safe', label: 'Safe route' },
          { id: 'unsafe', label: 'Unsafe route' },
        ],
        correctId: 'safe',
      },
      expectedOutcome: normaliseActivityOutcome({
        completed: true,
        values: { '/answer': 'safe' },
        events: [
          { sequence: 0, type: 'interaction', values: { '/answer': 'safe' } },
          { sequence: 1, type: 'attempted', values: { '/answer': 'safe' } },
        ],
      }),
    },
  ],
  persistence: {
    mode: 'none',
    explanation: 'Selection is local UI state only; a failed attempt is reset by the SceneRunner.',
  },
  performance: {
    loading: 'lazy',
    lazyChunkBudgetKbGzip: 150,
  },
  accessibility: {
    keyboard: {
      instructions: 'Tab to a radio option, use arrow keys to choose, then Tab to Submit answer.',
      shortcuts: ['Tab', 'Arrow keys', 'Space'],
    },
    focus: { initial: 'first-control', afterOutcome: 'feedback', visibleIndicator: true },
    announcements: {
      politeness: 'polite',
      attempt: 'Answer submitted.',
      completion: 'Correct answer submitted.',
    },
    reducedMotion: {
      policy: 'none',
      alternative: 'This activity has no motion or timed transition.',
    },
    touch: {
      minimumTargetSizePx: 44,
      gestureAlternative: 'Each option is a labelled native radio control.',
    },
    labels: { activity: 'Seeded choice activity', controls: ['Answer choices', 'Submit answer'] },
    contrast: { minimumRatio: 4.5 },
  },
});
