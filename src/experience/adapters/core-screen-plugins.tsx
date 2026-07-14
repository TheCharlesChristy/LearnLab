import { lazy } from 'react';

import type { Screen } from '../../screens';
import { defineActivityPlugin, normaliseActivityOutcome } from '../plugins/contracts';
import type { ActivityJsonSchema, ActivityPlugin, AnyActivityPlugin } from '../plugins/contracts';

type CoreScreenType = Exclude<Screen['type'], 'manipulable-target'>;
type CoreScreen = Extract<Screen, { type: CoreScreenType }>;

/** Shared adapter envelope; the nested screen remains validated by the v1 screen contract. */
export interface CoreScreenActivityProps {
  legacyLessonId: string;
  screen: CoreScreen;
  index: number;
  total: number;
}

interface CorePluginDefinition {
  key: string;
  screenType: CoreScreenType;
  title: string;
  summary: string;
  category: 'choice' | 'entry' | 'construction' | 'recall';
  learningUse: string;
  fixture: CoreScreenActivityProps;
  expectedOutcome: ReturnType<typeof normaliseActivityOutcome>;
  keyboard: string;
  controls: readonly string[];
  reducedMotion: string;
  touch: string;
}

function propsSchema(screenType: CoreScreenType): ActivityJsonSchema {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['legacyLessonId', 'screen', 'index', 'total'],
    properties: {
      legacyLessonId: { type: 'string', minLength: 1 },
      screen: {
        type: 'object',
        required: ['type'],
        properties: { type: { const: screenType } },
      },
      index: { type: 'integer', minimum: 0 },
      total: { type: 'integer', minimum: 1 },
    },
  };
}

function corePlugin(definition: CorePluginDefinition): ActivityPlugin<CoreScreenActivityProps> {
  return defineActivityPlugin({
    key: definition.key,
    version: '1.0.0',
    component: lazy(() => import('./CoreScreenActivity')),
    propsSchema: propsSchema(definition.screenType),
    authoring: {
      title: definition.title,
      summary: definition.summary,
      category: definition.category,
      supportedGoalOperators: [
        'activity-complete',
        'equals',
        'in-range',
        'set-equals',
        'regex-match',
      ],
      learningUse: definition.learningUse,
    },
    previewFixtures: [
      {
        id: 'core-interaction-preview',
        title: 'Core interaction preview',
        seed: `${definition.key}:preview`,
        props: definition.fixture,
        expectedOutcome: definition.expectedOutcome,
      },
    ],
    persistence: {
      mode: 'none',
      explanation:
        'The activity reports a normalised result at its existing gated Finish/Continue action; SceneRunner owns the durable boundary.',
    },
    performance: { loading: 'lazy', lazyChunkBudgetKbGzip: 150 },
    accessibility: {
      keyboard: { instructions: definition.keyboard, shortcuts: ['Tab', 'Enter', 'Space'] },
      focus: { initial: 'first-control', afterOutcome: 'feedback', visibleIndicator: true },
      announcements: {
        politeness: 'polite',
        attempt: 'Learning interaction submitted.',
        completion: 'Learning interaction complete.',
      },
      reducedMotion: { policy: 'respect-preference', alternative: definition.reducedMotion },
      touch: { minimumTargetSizePx: 44, gestureAlternative: definition.touch },
      labels: { activity: definition.title, controls: definition.controls },
      contrast: { minimumRatio: 4.5 },
    },
  });
}

const base = { legacyLessonId: 'core-preview', index: 0, total: 1 } as const;

export const corePredictPlugin = corePlugin({
  key: 'core-predict',
  screenType: 'predict',
  title: 'Prediction commitment',
  category: 'choice',
  summary:
    'Commits a prediction before revealing the mechanism, with a normalised selected-choice outcome.',
  learningUse:
    'Use before instruction or an explorable when an explicit prediction makes the later mechanism meaningful.',
  fixture: {
    ...base,
    screen: {
      type: 'predict',
      id: 'predict-preview',
      prompt: 'Which route is safe?',
      choices: ['Unsafe', 'Safe'],
      correctChoiceIndex: 1,
      reveal: 'The safe route has a clear path.',
    },
  },
  expectedOutcome: normaliseActivityOutcome({
    completed: true,
    values: { '/choice-index': 1, '/correct': true },
    events: [
      { sequence: 0, type: 'interaction', values: { '/choice-index': 1, '/correct': true } },
      { sequence: 1, type: 'attempted', values: { '/choice-index': 1, '/correct': true } },
    ],
  }),
  keyboard: 'Tab to a prediction option and press Enter or Space to commit.',
  controls: ['Prediction options', 'Finish'],
  reducedMotion: 'The original prediction screen has no timed transition.',
  touch: 'Each prediction is an ordinary button.',
});

export const coreChoicePlugin = corePlugin({
  key: 'core-choice',
  screenType: 'tap-choice',
  title: 'Choice checkpoint',
  category: 'choice',
  summary: 'A misconception-aware choice checkpoint with normalised choice and correctness values.',
  learningUse:
    'Use for retrieval where a wrong choice should retain its targeted feedback and hint ladder.',
  fixture: {
    ...base,
    screen: {
      type: 'tap-choice',
      id: 'choice-preview',
      prompt: 'Which route is safe?',
      choices: [{ text: 'Unsafe' }, { text: 'Safe' }],
      correctIndex: 1,
    },
  },
  expectedOutcome: normaliseActivityOutcome({
    completed: true,
    values: { '/choice-index': 1, '/correct': true },
    events: [
      { sequence: 0, type: 'interaction', values: { '/choice-index': 1, '/correct': true } },
      { sequence: 1, type: 'attempted', values: { '/choice-index': 1, '/correct': true } },
    ],
  }),
  keyboard:
    'Tab to a choice and press Enter or Space; incorrect choices retain feedback and hints.',
  controls: ['Answer choices', 'Finish'],
  reducedMotion: 'The original choice screen uses motion-safe feedback only.',
  touch: 'Each answer is an ordinary button.',
});

export const coreEntryPlugin = corePlugin({
  key: 'core-entry',
  screenType: 'entry',
  title: 'Generated entry',
  category: 'entry',
  summary: 'A numeric or text generation checkpoint with normalised answer and correctness values.',
  learningUse:
    'Use when learners should produce a number or text answer, with the existing exact marking and hints.',
  fixture: {
    ...base,
    screen: {
      type: 'entry',
      id: 'entry-preview',
      prompt: 'Which route is safe?',
      inputMode: 'numeric',
      answer: 6,
      tolerance: 0,
    },
  },
  expectedOutcome: normaliseActivityOutcome({
    completed: true,
    values: { '/answer': 6, '/correct': true },
    events: [
      { sequence: 0, type: 'interaction', values: { '/answer': 6, '/correct': true } },
      { sequence: 1, type: 'attempted', values: { '/answer': 6, '/correct': true } },
    ],
  }),
  keyboard:
    'Type an answer and press Enter or activate Check; the original screen retains its validation and hints.',
  controls: ['Your answer', 'Check', 'Finish'],
  reducedMotion: 'The original entry screen has no timed transition.',
  touch: 'Text input and Check are native controls.',
});

export const coreRevealPlugin = corePlugin({
  key: 'core-reveal-mechanism',
  screenType: 'reveal-mechanism',
  title: 'Self-explanation reveal',
  category: 'construction',
  summary:
    'Requires a learner self-explanation before revealing the model explanation and emits the entered text.',
  learningUse:
    'Use after a worked mechanism when the learner must explain before seeing the model account.',
  fixture: {
    ...base,
    screen: {
      type: 'reveal-mechanism',
      id: 'reveal-preview',
      body: 'Which route is safe?',
      selfExplainPrompt: 'Explain why.',
      selfExplainAnswer: 'The safe route avoids the hazard.',
    },
  },
  expectedOutcome: normaliseActivityOutcome({
    completed: true,
    values: { '/self-explanation': 'It avoids the hazard.' },
    events: [
      {
        sequence: 0,
        type: 'interaction',
        values: { '/self-explanation': 'It avoids the hazard.' },
      },
      { sequence: 1, type: 'attempted', values: { '/self-explanation': 'It avoids the hazard.' } },
    ],
  }),
  keyboard:
    'Type an explanation, activate Check my thinking, then Finish after the model explanation appears.',
  controls: ['Self-explanation', 'Check my thinking', 'Finish'],
  reducedMotion: 'The reveal is immediate and has no timed transition.',
  touch: 'The explanation field and check button are native controls.',
});

export const coreFadedStepPlugin = corePlugin({
  key: 'core-faded-step',
  screenType: 'faded-step',
  title: 'Faded worked step',
  category: 'entry',
  summary:
    'Completes the final blank in a worked example with normalised answer and correctness values.',
  learningUse:
    'Use for backward-faded examples where the learner supplies the final step after inspecting worked context.',
  fixture: {
    ...base,
    screen: {
      type: 'faded-step',
      id: 'faded-preview',
      worked: 'Which route is safe?',
      prompt: 'Enter the final value.',
      inputMode: 'numeric',
      answer: 4,
      tolerance: 0,
    },
  },
  expectedOutcome: normaliseActivityOutcome({
    completed: true,
    values: { '/answer': 4, '/correct': true },
    events: [
      { sequence: 0, type: 'interaction', values: { '/answer': 4, '/correct': true } },
      { sequence: 1, type: 'attempted', values: { '/answer': 4, '/correct': true } },
    ],
  }),
  keyboard:
    'Type the final step and press Enter or activate Check; feedback and hints retain their original behaviour.',
  controls: ['Your answer', 'Check', 'Finish'],
  reducedMotion: 'The original faded-step screen has no timed transition.',
  touch: 'Text input and Check are native controls.',
});

export const coreSortMatchPlugin = corePlugin({
  key: 'core-sort-match',
  screenType: 'sort-match',
  title: 'Sort and match',
  category: 'construction',
  summary:
    'Matches pairs through keyboard-accessible buttons and emits the selected pairs and matched set.',
  learningUse: 'Use for classifying or linking concepts where every pair must be actively matched.',
  fixture: {
    ...base,
    screen: {
      type: 'sort-match',
      id: 'sort-preview',
      prompt: 'Which route is safe?',
      pairs: [
        { left: 'Clear', right: 'Safe' },
        { left: 'Blocked', right: 'Unsafe' },
      ],
    },
  },
  expectedOutcome: normaliseActivityOutcome({
    completed: true,
    values: { '/left-index': 1, '/right-index': 1, '/matched': ['0', '1'], '/correct': true },
    events: [
      {
        sequence: 0,
        type: 'interaction',
        values: { '/left-index': 0, '/right-index': 0, '/matched': ['0'], '/correct': true },
      },
      {
        sequence: 1,
        type: 'attempted',
        values: { '/left-index': 0, '/right-index': 0, '/matched': ['0'], '/correct': true },
      },
      {
        sequence: 2,
        type: 'interaction',
        values: { '/left-index': 1, '/right-index': 1, '/matched': ['0', '1'], '/correct': true },
      },
      {
        sequence: 3,
        type: 'attempted',
        values: { '/left-index': 1, '/right-index': 1, '/matched': ['0', '1'], '/correct': true },
      },
    ],
  }),
  keyboard: 'Choose a left and right button to attempt a pair; no drag-and-drop is required.',
  controls: ['Matching pairs', 'Finish'],
  reducedMotion: 'Mismatch shake uses motion-safe CSS and is suppressed by reduced motion.',
  touch: 'Matching uses ordinary buttons instead of drag-and-drop.',
});

export const coreFlashRecallPlugin = corePlugin({
  key: 'core-flash-recall',
  screenType: 'flash-recall',
  title: 'Flash recall',
  category: 'recall',
  summary:
    'Requires recall before reveal and a self-grade, with normalised reveal and grade values.',
  learningUse:
    'Use for a single retrieval prompt where the learner commits to trying before self-grading.',
  fixture: {
    ...base,
    screen: {
      type: 'flash-recall',
      id: 'flash-preview',
      front: 'Which route is safe?',
      back: 'The clear route.',
    },
  },
  expectedOutcome: normaliseActivityOutcome({
    completed: true,
    values: { '/revealed': true, '/grade': 'good' },
    events: [
      { sequence: 0, type: 'interaction', values: { '/revealed': true } },
      { sequence: 1, type: 'interaction', values: { '/grade': 'good' } },
      { sequence: 2, type: 'attempted', values: { '/grade': 'good' } },
    ],
  }),
  keyboard: 'Activate Show me after recalling, then choose a self-grade before Finish.',
  controls: ['Show answer', 'Self-grade', 'Finish'],
  reducedMotion: 'The original flash-recall screen has no timed transition.',
  touch: 'Reveal and self-grading use ordinary buttons.',
});

export const coreActivityPlugins = Object.freeze([
  corePredictPlugin,
  coreChoicePlugin,
  coreEntryPlugin,
  coreRevealPlugin,
  coreFadedStepPlugin,
  coreSortMatchPlugin,
  coreFlashRecallPlugin,
]);

export const coreActivityKeyByScreenType: Readonly<Record<CoreScreenType, string>> = Object.freeze({
  predict: corePredictPlugin.key,
  'tap-choice': coreChoicePlugin.key,
  entry: coreEntryPlugin.key,
  'reveal-mechanism': coreRevealPlugin.key,
  'faded-step': coreFadedStepPlugin.key,
  'sort-match': coreSortMatchPlugin.key,
  'flash-recall': coreFlashRecallPlugin.key,
});

export function coreActivityKeyForScreen(screen: Screen): string | undefined {
  return screen.type === 'manipulable-target'
    ? undefined
    : coreActivityKeyByScreenType[screen.type];
}

export const coreActivityPluginRegistry: Readonly<Record<string, AnyActivityPlugin>> =
  Object.freeze(
    Object.fromEntries(
      coreActivityPlugins.map((plugin) => [plugin.key, plugin as unknown as AnyActivityPlugin]),
    ),
  );
