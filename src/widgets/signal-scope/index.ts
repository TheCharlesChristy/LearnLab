// `signal-scope` widget — time-domain + frequency-domain viewer. Samples a
// mathjs-compiled expression in `t` (plus a learner-adjustable parameter
// `f`, e.g. a hidden carrier frequency), optionally adds deterministic
// pseudo-random noise, and renders the waveform alongside its magnitude
// spectrum (computed with an in-repo radix-2 FFT — no new runtime
// dependency, NFR-PERF-001).
//
// This entry file stays mathjs-free: the implementation (and its mathjs
// subset) loads only inside the React.lazy chunk.

import { lazy } from 'react';

import { defineWidget } from '../widget-def';
import type { ParsedProps, RawWidgetProps, WidgetDef } from '../widget-def';

export interface SignalScopeProps {
  /** Expression in `t` (seconds) and `f` (Hz), parsed by mathjs `compile`. */
  expr: string;
  /** Samples per second. Must be > 0. */
  sampleRate: number;
  /** Window length in seconds. Must be > 0. */
  duration: number;
  /** Standard deviation of additive Gaussian noise (0 = none). */
  noiseAmount: number;
  /** Lower bound of the draggable frequency parameter `f`. */
  freqMin: number;
  /** Upper bound of the draggable frequency parameter `f`. */
  freqMax: number;
  /** Starting value of `f`. Defaults to the midpoint of [freqMin, freqMax]. */
  freqInit?: number;
  /** Show the magnitude-spectrum panel alongside the waveform. */
  showSpectrum: boolean;
  /**
   * Screens engine hook (manipulable-target): fires with the live frequency
   * setting and the estimated spectral peak whenever `f` changes. Optional —
   * content authored via the `::widget` directive never sets this.
   */
  onFrequencyChange?: (info: { freq: number; peakFreq: number | null }) => void;
}

function asFiniteNumber(value: string | number | boolean): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function readNumber(raw: RawWidgetProps, name: string, errors: string[]): number | undefined {
  const value = raw[name];
  if (value === undefined) return undefined;
  const n = asFiniteNumber(value);
  if (n === undefined) {
    errors.push(`${name}: must be a finite number (got ${JSON.stringify(value)})`);
  }
  return n;
}

function readBoolean(
  raw: RawWidgetProps,
  name: string,
  fallback: boolean,
  errors: string[],
): boolean {
  const value = raw[name];
  if (value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  errors.push(`${name}: must be true or false (got ${JSON.stringify(value)})`);
  return fallback;
}

export function parseProps(raw: RawWidgetProps): ParsedProps<SignalScopeProps> {
  const errors: string[] = [];

  let expr = '';
  if (typeof raw.expr === 'string' && raw.expr.trim() !== '') {
    expr = raw.expr;
  } else {
    errors.push('expr: required — a non-empty expression in t and f, e.g. expr="sin(2*pi*f*t)"');
  }

  const sampleRateRead = readNumber(raw, 'sampleRate', errors);
  const sampleRate = sampleRateRead ?? 64;
  if ((raw.sampleRate === undefined || sampleRateRead !== undefined) && sampleRate <= 0) {
    errors.push(`sampleRate: must be greater than 0 (got ${sampleRate})`);
  }

  const durationRead = readNumber(raw, 'duration', errors);
  const duration = durationRead ?? 4;
  if ((raw.duration === undefined || durationRead !== undefined) && duration <= 0) {
    errors.push(`duration: must be greater than 0 (got ${duration})`);
  }

  const noiseRead = readNumber(raw, 'noiseAmount', errors);
  const noiseAmount = noiseRead ?? 0;
  if ((raw.noiseAmount === undefined || noiseRead !== undefined) && noiseAmount < 0) {
    errors.push(`noiseAmount: must be zero or greater (got ${noiseAmount})`);
  }

  const freqMinRead = readNumber(raw, 'freqMin', errors);
  const freqMaxRead = readNumber(raw, 'freqMax', errors);
  const freqMin = freqMinRead ?? 0.5;
  const freqMax = freqMaxRead ?? 8;
  const freqBoundsOk =
    (raw.freqMin === undefined || freqMinRead !== undefined) &&
    (raw.freqMax === undefined || freqMaxRead !== undefined);
  if (freqBoundsOk && freqMin >= freqMax) {
    errors.push(`freqMin: must be less than freqMax (got freqMin=${freqMin}, freqMax=${freqMax})`);
  }

  const freqInitRead = readNumber(raw, 'freqInit', errors);
  let freqInit = freqInitRead ?? (freqMin + freqMax) / 2;
  if (freqBoundsOk && freqInitRead !== undefined && (freqInit < freqMin || freqInit > freqMax)) {
    errors.push(
      `freqInit: must be within [freqMin, freqMax] (got freqInit=${freqInit}, range=[${freqMin}, ${freqMax}])`,
    );
  }
  if (!(freqInit >= freqMin && freqInit <= freqMax)) freqInit = (freqMin + freqMax) / 2;

  const showSpectrum = readBoolean(raw, 'showSpectrum', true, errors);

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    props: { expr, sampleRate, duration, noiseAmount, freqMin, freqMax, freqInit, showSpectrum },
  };
}

export const def: WidgetDef = defineWidget<SignalScopeProps>({
  component: lazy(() => import('./SignalScope')),
  parseProps,
});
