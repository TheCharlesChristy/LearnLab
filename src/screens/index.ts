// Public API of the screens subsystem (SRS §3.5-style barrel — mirrors
// src/quiz/index.ts and src/widgets/registry.ts's export shape).

export { ScreenSequenceEngine, type ScreenSequenceEngineProps } from './ScreenSequenceEngine';
export { screenRegistry, SCREEN_TYPES } from './registry';
export type {
  EntryScreen,
  FadedStepScreen,
  FlashRecallScreen,
  ManipulableTargetGoal,
  ManipulableTargetScreen,
  PredictScreen,
  RevealMechanismScreen,
  Screen,
  ScreenSequence,
  SortMatchScreen,
  TapChoiceScreen,
} from './types';
