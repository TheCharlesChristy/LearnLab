// SVG time-domain + frequency-domain signal viewer — SRS §5.3
// `signal-scope` row. Expressions are parsed with a mathjs *subset* built via
// the factory API (matching function-grapher's approach, NFR-PERF-001,
// NFR-SEC-002). The magnitude spectrum is computed with an in-repo iterative
// radix-2 FFT (zero-padded to the next power of two) — no new runtime
// dependency. The frequency parameter `f` is a focusable role="slider",
// draggable by pointer and movable with arrow keys, mirroring
// function-grapher's tangent-point interaction pattern; the peak-frequency
// readout lives in an aria-live region (NFR-A11Y-001).

import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';

import {
  compileDependencies,
  cosDependencies,
  create,
  divideDependencies,
  eDependencies,
  expDependencies,
  multiplyDependencies,
  piDependencies,
  powDependencies,
  sinDependencies,
  subtractDependencies,
  addDependencies,
} from 'mathjs/number';
import type { EvalFunction, FactoryFunctionMap } from 'mathjs/number';

import type { SignalScopeProps } from './index';

const dependencySets = [
  compileDependencies,
  addDependencies,
  subtractDependencies,
  multiplyDependencies,
  divideDependencies,
  powDependencies,
  expDependencies,
  sinDependencies,
  cosDependencies,
  piDependencies,
  eDependencies,
];
const factories: FactoryFunctionMap = {};
dependencySets.forEach((dep, i) => {
  if (dep) factories[`dep${i}`] = dep;
});
const math = create(factories);

const WIDTH = 640;
const PANEL_H = 160;
const SLIDER_H = 56;
const MARGIN = { top: 10, right: 12, bottom: 18, left: 44 };
const INNER_W = WIDTH - MARGIN.left - MARGIN.right;
const INNER_H = PANEL_H - MARGIN.top - MARGIN.bottom;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function fmt(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  return Number(value.toPrecision(4)).toString();
}

function nextPow2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return Math.max(p, 8);
}

/** Deterministic PRNG (mulberry32) — stable noise realization across re-renders. */
function mulberry32(seed: number): () => number {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** n standard-normal samples via Box-Muller, from a fixed seed. */
function standardNormals(n: number): Float64Array {
  const rand = mulberry32(0x5eed1e55);
  const out = new Float64Array(n);
  for (let i = 0; i < n; i += 2) {
    const u1 = Math.max(rand(), 1e-12);
    const u2 = rand();
    const r = Math.sqrt(-2 * Math.log(u1));
    out[i] = r * Math.cos(2 * Math.PI * u2);
    if (i + 1 < n) out[i + 1] = r * Math.sin(2 * Math.PI * u2);
  }
  return out;
}

/** Iterative Cooley-Tukey radix-2 FFT. `n` (real.length) must be a power of two. */
function fftMagnitudes(real: Float64Array): Float64Array {
  const n = real.length;
  const re = Float64Array.from(real);
  const im = new Float64Array(n);
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; (j & bit) !== 0; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i]!;
      re[i] = re[j]!;
      re[j] = tr;
      const ti = im[i]!;
      im[i] = im[j]!;
      im[j] = ti;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let curWr = 1;
      let curWi = 0;
      for (let j = 0; j < len / 2; j++) {
        const ur = re[i + j]!;
        const ui = im[i + j]!;
        const vr = re[i + j + len / 2]! * curWr - im[i + j + len / 2]! * curWi;
        const vi = re[i + j + len / 2]! * curWi + im[i + j + len / 2]! * curWr;
        re[i + j] = ur + vr;
        im[i + j] = ui + vi;
        re[i + j + len / 2] = ur - vr;
        im[i + j + len / 2] = ui - vi;
        const nwr = curWr * wr - curWi * wi;
        const nwi = curWr * wi + curWi * wr;
        curWr = nwr;
        curWi = nwi;
      }
    }
  }
  const half = n / 2;
  const mags = new Float64Array(half + 1);
  for (let k = 0; k <= half; k++) {
    mags[k] = Math.sqrt(re[k]! * re[k]! + im[k]! * im[k]!);
  }
  return mags;
}

export default function SignalScope({
  expr,
  sampleRate,
  duration,
  noiseAmount,
  freqMin,
  freqMax,
  freqInit,
  showSpectrum,
  onFrequencyChange,
}: SignalScopeProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const draggingRef = useRef(false);
  const [freq, setFreq] = useState(() => freqInit ?? (freqMin + freqMax) / 2);
  const [focused, setFocused] = useState(false);

  const code = useMemo<EvalFunction | null>(() => {
    try {
      return math.compile(expr);
    } catch {
      return null;
    }
  }, [expr]);

  const n = Math.max(2, Math.round(duration * sampleRate));
  const noise = useMemo(() => standardNormals(n), [n]);

  const waveform = useMemo(() => {
    if (!code) return null;
    let sawNumber = false;
    const samples = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / sampleRate;
      let value: unknown;
      try {
        value = code.evaluate({ t, f: freq });
      } catch {
        value = null;
      }
      const clean = typeof value === 'number' && Number.isFinite(value) ? value : 0;
      if (typeof value === 'number' && Number.isFinite(value)) sawNumber = true;
      samples[i] = clean + noiseAmount * (noise[i] ?? 0);
    }
    if (!sawNumber) return null;
    return samples;
  }, [code, n, sampleRate, freq, noiseAmount, noise]);

  const spectrum = useMemo(() => {
    if (!waveform) return null;
    const nfft = nextPow2(waveform.length);
    const padded = new Float64Array(nfft);
    padded.set(waveform);
    const mags = fftMagnitudes(padded);
    let peakBin = -1;
    let peakMag = -Infinity;
    for (let k = 1; k < mags.length; k++) {
      const m = mags[k]!;
      if (m > peakMag) {
        peakMag = m;
        peakBin = k;
      }
    }
    const peakFreq = peakBin >= 0 ? (peakBin * sampleRate) / nfft : null;
    return { mags, nfft, peakFreq };
  }, [waveform, sampleRate]);

  useEffect(() => {
    onFrequencyChange?.({ freq, peakFreq: spectrum?.peakFreq ?? null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freq, spectrum?.peakFreq, onFrequencyChange]);

  if (!code || !waveform) {
    return (
      <div
        role="alert"
        className="my-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900"
      >
        <strong>signal-scope:</strong> could not evaluate the expression{' '}
        <code className="font-mono">{expr}</code>. Check that it is a valid formula in{' '}
        <code className="font-mono">t</code> and <code className="font-mono">f</code>, e.g.{' '}
        <code className="font-mono">sin(2*pi*f*t)</code>.
      </div>
    );
  }

  let wLo = Infinity;
  let wHi = -Infinity;
  for (const v of waveform) {
    if (v < wLo) wLo = v;
    if (v > wHi) wHi = v;
  }
  if (!(wHi > wLo)) {
    wLo -= 1;
    wHi += 1;
  }
  const pad = (wHi - wLo) * 0.1;
  wLo -= pad;
  wHi += pad;

  const wsx = (i: number) => MARGIN.left + (i / (waveform.length - 1)) * INNER_W;
  const wsy = (v: number) => MARGIN.top + ((wHi - v) / (wHi - wLo)) * INNER_H;
  let wavePath = '';
  for (let i = 0; i < waveform.length; i++) {
    wavePath += `${i === 0 ? 'M' : 'L'}${wsx(i).toFixed(2)} ${wsy(waveform[i]!).toFixed(2)}`;
  }

  const nyquist = sampleRate / 2;
  const spectrumBars: { x: number; h: number }[] = [];
  let sHi = 0;
  if (spectrum) {
    for (const m of spectrum.mags) if (m > sHi) sHi = m;
    if (sHi <= 0) sHi = 1;
    const step = INNER_W / spectrum.mags.length;
    for (let k = 0; k < spectrum.mags.length; k++) {
      spectrumBars.push({ x: MARGIN.left + k * step, h: (spectrum.mags[k]! / sHi) * INNER_H });
    }
  }
  const ssx = (hz: number) => MARGIN.left + (hz / nyquist) * INNER_W;

  // ---- slider (drag/keyboard control of freq) ----
  const sliderTop = PANEL_H + (showSpectrum ? PANEL_H : 0);
  const sliderY = sliderTop + SLIDER_H / 2;
  const sliderX0 = MARGIN.left + 8;
  const sliderX1 = WIDTH - MARGIN.right - 8;
  const freqToSx = (value: number) =>
    sliderX0 + ((value - freqMin) / (freqMax - freqMin)) * (sliderX1 - sliderX0);
  const sxToFreq = (sx: number) =>
    freqMin + ((sx - sliderX0) / (sliderX1 - sliderX0)) * (freqMax - freqMin);

  const xFromClientX = (clientX: number): number | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    if (rect.width <= 0) return null;
    return ((clientX - rect.left) / rect.width) * WIDTH;
  };

  const onPointerDown = (e: PointerEvent<SVGGElement>) => {
    draggingRef.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // jsdom / older browsers: dragging still works while the pointer stays over the element
    }
  };
  const onPointerMove = (e: PointerEvent<SVGGElement>) => {
    if (!draggingRef.current) return;
    const sx = xFromClientX(e.clientX);
    if (sx !== null) setFreq(clamp(sxToFreq(sx), freqMin, freqMax));
  };
  const onPointerEnd = () => {
    draggingRef.current = false;
  };

  const onKeyDown = (e: KeyboardEvent<SVGGElement>) => {
    const step = (freqMax - freqMin) / 50;
    let next: number | null = null;
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        next = freq - step;
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        next = freq + step;
        break;
      case 'Home':
        next = freqMin;
        break;
      case 'End':
        next = freqMax;
        break;
      default:
        return;
    }
    e.preventDefault();
    setFreq(clamp(next, freqMin, freqMax));
  };

  const peakFreq = spectrum?.peakFreq ?? null;
  const readout =
    peakFreq !== null
      ? `f = ${fmt(freq)} Hz — spectral peak at ${fmt(peakFreq)} Hz`
      : `f = ${fmt(freq)} Hz — no spectral peak detected`;

  return (
    <div className="my-4">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${sliderTop + SLIDER_H}`}
        preserveAspectRatio="none"
        className="block w-full rounded border border-zinc-300 bg-white"
        style={{ height: sliderTop + SLIDER_H }}
        role="group"
        aria-label={`Signal scope: waveform and spectrum of ${expr}`}
      >
        {/* waveform panel */}
        <g aria-hidden="true">
          <rect x={MARGIN.left} y={MARGIN.top} width={INNER_W} height={INNER_H} fill="none" stroke="#e4e4e7" />
          <path
            data-testid="ss-waveform"
            d={wavePath}
            fill="none"
            stroke="#1d4ed8"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
          <text x={MARGIN.left} y={PANEL_H - 4} fontSize={11} fill="#3f3f46">
            time domain
          </text>
        </g>

        {/* spectrum panel */}
        {showSpectrum && (
          <g transform={`translate(0 ${PANEL_H})`} aria-hidden="true">
            <rect x={MARGIN.left} y={MARGIN.top} width={INNER_W} height={INNER_H} fill="none" stroke="#e4e4e7" />
            {spectrumBars.map((bar, i) => (
              <line
                key={i}
                x1={bar.x}
                y1={MARGIN.top + INNER_H}
                x2={bar.x}
                y2={MARGIN.top + INNER_H - bar.h}
                stroke="#7c3aed"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {peakFreq !== null && (
              <line
                data-testid="ss-peak-marker"
                x1={ssx(peakFreq)}
                y1={MARGIN.top}
                x2={ssx(peakFreq)}
                y2={MARGIN.top + INNER_H}
                stroke="#b91c1c"
                strokeWidth={1}
                strokeDasharray="4 3"
                vectorEffect="non-scaling-stroke"
              />
            )}
            <text x={MARGIN.left} y={PANEL_H - 4} fontSize={11} fill="#3f3f46">
              magnitude spectrum (0–{fmt(nyquist)} Hz)
            </text>
          </g>
        )}

        {/* slider track */}
        <line x1={sliderX0} y1={sliderY} x2={sliderX1} y2={sliderY} stroke="#a1a1aa" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        <g
          data-testid="ss-handle"
          role="slider"
          tabIndex={0}
          aria-label="Frequency parameter f"
          aria-orientation="horizontal"
          aria-valuemin={freqMin}
          aria-valuemax={freqMax}
          aria-valuenow={Number(freq.toFixed(3))}
          aria-valuetext={readout}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ cursor: 'ew-resize', outline: 'none' }}
        >
          {focused && (
            <circle cx={freqToSx(freq)} cy={sliderY} r={12} fill="none" stroke="#1d4ed8" strokeWidth={2} />
          )}
          <circle cx={freqToSx(freq)} cy={sliderY} r={8} fill="#1d4ed8" stroke="#ffffff" strokeWidth={2} />
        </g>
      </svg>
      <p aria-live="polite" className="mt-1 text-sm text-zinc-700" data-testid="ss-readout">
        {readout}
      </p>
    </div>
  );
}
