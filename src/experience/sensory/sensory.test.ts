import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { MasteryAggregation } from '../mastery';
import { playCelebrationHaptic, playCelebrationSound } from './feedback';
import { celebrateMasteryTransitions, planMasteryCelebrations } from './mastery-celebration';
import {
  DEFAULT_SENSORY_PREFERENCES,
  SENSORY_PREFERENCES_STORAGE_KEY,
  loadSensoryPreferences,
  permitsCelebrationMotion,
  saveSensoryPreferences,
} from './preferences';

vi.mock('../../ui', () => ({ celebrate: vi.fn() }));

import { celebrate } from '../../ui';

function aggregation(band?: 'low' | 'developing' | 'secure'): MasteryAggregation {
  return {
    summaries: [
      {
        skillId: 'vectors',
        status: band ? 'classified' : 'insufficient-evidence',
        band,
        evidence: {
          opportunities: band ? 2 : 1,
          opportunitiesByKind: { retrieval: 0, application: 0, transfer: 0, unknown: 0 },
          opportunitiesBySupport: { independent: 0, hinted: 0, assisted: 0, unknown: 0 },
          successes: 0,
          partials: 0,
          failures: 0,
          independentSuccesses: 0,
          hintedSuccesses: 0,
          assistedSuccesses: 0,
          confidentWrong: 0,
          unknownContext: 0,
        },
        reasons: [],
      },
    ],
    ignoredEvidence: [],
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

beforeEach(() => {
  const values = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
      clear: () => values.clear(),
    },
  });
});

describe('mastery-linked celebrations (#52)', () => {
  it('celebrates only a newly demonstrated developing or secure band, never activity or unchanged data', () => {
    expect(planMasteryCelebrations(aggregation(), aggregation())).toEqual([]);
    expect(planMasteryCelebrations(aggregation(), aggregation('low'))).toEqual([]);
    expect(planMasteryCelebrations(aggregation(), aggregation('developing'))).toEqual([
      expect.objectContaining({ skillId: 'vectors', band: 'developing' }),
    ]);
    expect(planMasteryCelebrations(aggregation('developing'), aggregation('developing'))).toEqual(
      [],
    );
    expect(planMasteryCelebrations(aggregation('developing'), aggregation('secure'))).toEqual([
      expect.objectContaining({ skillId: 'vectors', band: 'secure' }),
    ]);
    expect(planMasteryCelebrations(aggregation('secure'), aggregation('developing'))).toEqual([]);
  });

  it('keeps text feedback while default sensory-safe preferences suppress effects', () => {
    const milestones = celebrateMasteryTransitions(aggregation(), aggregation('developing'), {
      ...DEFAULT_SENSORY_PREFERENCES,
    });
    expect(milestones).toHaveLength(1);
    expect(celebrate).toHaveBeenCalledWith(expect.objectContaining({ confetti: false }));
  });
});

describe('sensory preferences', () => {
  it('uses calm defaults, persists only locally, and rejects malformed storage', () => {
    expect(loadSensoryPreferences()).toEqual(DEFAULT_SENSORY_PREFERENCES);
    saveSensoryPreferences({ visual: true, sound: true, haptics: true, motion: 'reduce' });
    expect(loadSensoryPreferences()).toEqual({
      visual: true,
      sound: true,
      haptics: true,
      motion: 'reduce',
    });
    window.localStorage.setItem(SENSORY_PREFERENCES_STORAGE_KEY, '{bad json');
    expect(loadSensoryPreferences()).toEqual(DEFAULT_SENSORY_PREFERENCES);
  });

  it('honours both the app and OS reduced-motion preference', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false })),
    );
    expect(
      permitsCelebrationMotion({ visual: true, sound: false, haptics: false, motion: 'system' }),
    ).toBe(true);
    expect(
      permitsCelebrationMotion({ visual: true, sound: false, haptics: false, motion: 'reduce' }),
    ).toBe(false);
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true })),
    );
    expect(
      permitsCelebrationMotion({ visual: true, sound: false, haptics: false, motion: 'system' }),
    ).toBe(false);
  });

  it('never plays sound or haptics unless each explicit opt-in is enabled', () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true });
    playCelebrationHaptic({ ...DEFAULT_SENSORY_PREFERENCES });
    playCelebrationSound({ ...DEFAULT_SENSORY_PREFERENCES });
    expect(vibrate).not.toHaveBeenCalled();
  });
});
