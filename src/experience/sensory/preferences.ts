import { useCallback, useEffect, useState } from 'react';

import { prefersReducedMotion } from '../../lib/motion';

/**
 * These are deliberately device-local presentation preferences, not learner
 * data. They live in localStorage rather than the progress database so they
 * are never included in a progress export or sent anywhere.
 */
export const SENSORY_PREFERENCES_STORAGE_KEY = 'learnlab:sensory-preferences:v1';

export type MotionPreference = 'system' | 'reduce';

export interface SensoryPreferences {
  /** Confetti and other decorative visual celebration effects. */
  visual: boolean;
  /** Short non-speech confirmation tone; always opt-in. */
  sound: boolean;
  /** A short vibration where the browser/device supports it; always opt-in. */
  haptics: boolean;
  /** System respects OS reduced-motion; reduce turns decorative motion off. */
  motion: MotionPreference;
}

/** Calm by default: a text acknowledgement is still provided, without effects. */
export const DEFAULT_SENSORY_PREFERENCES: Readonly<SensoryPreferences> = Object.freeze({
  visual: false,
  sound: false,
  haptics: false,
  motion: 'system',
});

function isPreferences(value: unknown): value is SensoryPreferences {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.visual === 'boolean' &&
    typeof candidate.sound === 'boolean' &&
    typeof candidate.haptics === 'boolean' &&
    (candidate.motion === 'system' || candidate.motion === 'reduce')
  );
}

/** Returns a safe default if storage is unavailable, malformed, or from an older version. */
export function loadSensoryPreferences(): SensoryPreferences {
  try {
    const raw = window.localStorage.getItem(SENSORY_PREFERENCES_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SENSORY_PREFERENCES };
    const parsed: unknown = JSON.parse(raw);
    return isPreferences(parsed) ? parsed : { ...DEFAULT_SENSORY_PREFERENCES };
  } catch {
    return { ...DEFAULT_SENSORY_PREFERENCES };
  }
}

/** Storage failures (for example private browsing restrictions) never block learning feedback. */
export function saveSensoryPreferences(preferences: SensoryPreferences): void {
  try {
    window.localStorage.setItem(SENSORY_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Preferences remain active for this page session even if they cannot persist.
  }
}

/** Whether a decorative celebration animation is permitted for this learner now. */
export function permitsCelebrationMotion(preferences: SensoryPreferences): boolean {
  return preferences.visual && preferences.motion !== 'reduce' && !prefersReducedMotion();
}

/** React adapter for the settings page; persistence remains local and explicit. */
export function useSensoryPreferences(): {
  preferences: SensoryPreferences;
  setPreferences: (next: SensoryPreferences) => void;
} {
  const [preferences, setPreferencesState] = useState<SensoryPreferences>(loadSensoryPreferences);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === SENSORY_PREFERENCES_STORAGE_KEY)
        setPreferencesState(loadSensoryPreferences());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setPreferences = useCallback((next: SensoryPreferences) => {
    setPreferencesState(next);
    saveSensoryPreferences(next);
  }, []);

  return { preferences, setPreferences };
}
