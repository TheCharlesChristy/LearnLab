// The read-aloud UI: play/pause/stop plus a rate slider, built from the
// existing Button primitive and lucide-react icons (both already
// dependencies elsewhere in src/ui). Renders nothing at all — not a
// disabled button — when the browser has no `speechSynthesis` (graceful
// absence, matching how the app already handles missing WebAssembly/Worker
// support), and an aria-live region (pre-rendered empty, the established
// pattern e.g. src/quiz/QuizEngine.tsx) announces state changes for
// screen-reader users who can't see the play/pause icon swap.

import { Pause, Play, Square, Volume2 } from 'lucide-react';
import type { RefObject } from 'react';
import { useRef } from 'react';

import { Button, cx } from '../ui';

import { MAX_RATE, MIN_RATE, useReadAloud } from './useReadAloud';

export interface ReadAloudControlProps {
  /** The DOM element whose current contents should be read aloud. */
  targetRef: RefObject<HTMLElement | null>;
  /** Stop reading whenever this changes — see useReadAloud's own doc comment. */
  resetKey?: string | number;
  className?: string;
}

export function ReadAloudControl({ targetRef, resetKey, className }: ReadAloudControlProps) {
  const { status, rate, setRate, start, pause, resume, stop } = useReadAloud(targetRef, resetKey);

  // The Stop button only exists while active, so stopping removes the
  // focused element from the DOM — without this, focus would fall back to
  // <body>. The primary button never unmounts, so send focus there instead.
  const groupRef = useRef<HTMLDivElement>(null);
  const handleStop = () => {
    stop();
    groupRef.current?.querySelector<HTMLButtonElement>('[data-role="read-aloud-primary"]')?.focus();
  };

  if (status === 'unsupported') return null;

  const isSpeaking = status === 'speaking';
  const isPaused = status === 'paused';
  const isActive = isSpeaking || isPaused;

  // A single Button element covers all three (Read aloud / Pause / Resume)
  // states rather than three conditionally-mounted ones — swapping between
  // separate elements would unmount the focused button on every state
  // change and drop keyboard focus back to <body>.
  const primaryIcon = isSpeaking ? (
    <Pause aria-hidden className="h-4 w-4" />
  ) : isPaused ? (
    <Play aria-hidden className="h-4 w-4" />
  ) : (
    <Volume2 aria-hidden className="h-4 w-4" />
  );
  const primaryLabel = isSpeaking ? 'Pause' : isPaused ? 'Resume' : 'Read aloud';
  const primaryAction = isSpeaking ? pause : isPaused ? resume : start;

  return (
    <div className={cx('flex flex-wrap items-center gap-3', className)}>
      <div ref={groupRef} className="flex items-center gap-1.5">
        <Button variant="secondary" onClick={primaryAction} data-role="read-aloud-primary">
          {primaryIcon}
          {primaryLabel}
        </Button>
        {isActive && (
          <Button variant="ghost" onClick={handleStop} aria-label="Stop reading">
            <Square aria-hidden className="h-4 w-4" />
          </Button>
        )}
      </div>
      <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
        <span>Speed</span>
        <input
          type="range"
          min={MIN_RATE}
          max={MAX_RATE}
          step={0.1}
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
          aria-label="Reading speed"
          className="accent-indigo-700 dark:accent-indigo-400"
        />
        <span className="w-8 tabular-nums">{rate.toFixed(1)}x</span>
      </label>
      <p aria-live="polite" className="sr-only">
        {isSpeaking ? 'Reading aloud' : isPaused ? 'Reading paused' : ''}
      </p>
    </div>
  );
}
