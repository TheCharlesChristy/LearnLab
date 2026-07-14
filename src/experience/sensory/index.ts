export {
  DEFAULT_SENSORY_PREFERENCES,
  SENSORY_PREFERENCES_STORAGE_KEY,
  loadSensoryPreferences,
  permitsCelebrationMotion,
  saveSensoryPreferences,
  useSensoryPreferences,
  type MotionPreference,
  type SensoryPreferences,
} from './preferences';
export { playCelebrationHaptic, playCelebrationSound } from './feedback';
export {
  celebrateMasteryTransitions,
  planMasteryCelebrations,
  type MasteryCelebration,
} from './mastery-celebration';
