// The read-aloud orchestration hook: owns the SpeechSynthesisUtterance
// lifecycle, wires word-boundary events to the highlight controller, and
// persists the reading rate through the existing kv store (the same
// lightweight single-value-preference pattern SettingsPage's StorageSection
// already uses — no new Context provider, rate isn't cross-cutting app
// state).
//
// Mounted at two call sites (docs/BRILLIANT_REWRITE_PLAN.md's read-aloud
// follow-up): src/app/pages/LessonPage.tsx for legacy Markdown lessons, and
// src/screens/ScreenShell.tsx for every screen type — both just pass a ref
// to whatever DOM currently holds the readable content; this hook doesn't
// know or care which lesson format it's reading.

import type { RefObject } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { kvGet, kvSet } from '../progress';

import type { SpeakableSegment } from './extract-speakable-text';
import { extractSpeakableContent } from './extract-speakable-text';
import type { HighlightController } from './highlight';
import { createHighlightController } from './highlight';
import { findSegmentAt, segmentToRange } from './word-boundaries';

const KV_RATE_KEY = 'ttsRate';
export const MIN_RATE = 0.5;
export const MAX_RATE = 2;
const DEFAULT_RATE = 1;

export type ReadAloudStatus = 'idle' | 'speaking' | 'paused' | 'unsupported';

export interface UseReadAloudResult {
  status: ReadAloudStatus;
  rate: number;
  setRate: (rate: number) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * @param containerRef Ref to the DOM element whose current contents should be read.
 * @param resetKey Speech is stopped whenever this value changes (and on unmount) —
 *   pass something that identifies "which content this container currently holds"
 *   (e.g. a lesson id) for call sites whose component instance can persist across a
 *   content change (React Router reuses a route component across param-only
 *   navigations). Screens don't strictly need this (each screen is a fresh mount),
 *   but passing the screen id costs nothing and adds defense in depth.
 */
export function useReadAloud(
  containerRef: RefObject<HTMLElement | null>,
  resetKey?: string | number,
): UseReadAloudResult {
  const supported = speechSupported();
  const [status, setStatus] = useState<ReadAloudStatus>(supported ? 'idle' : 'unsupported');
  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  const [rate, setRateState] = useState(DEFAULT_RATE);
  const rateRef = useRef(rate);
  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);
  const highlightRef = useRef<HighlightController | null>(null);
  // The full speakable text/segments for the content currently loaded by
  // start(), and the absolute offset (into that text) of the last word
  // boundary reported — SpeechSynthesisUtterance.rate can't be changed on an
  // in-flight utterance in any engine, so applying a rate change mid-speech
  // means re-speaking from here, not mutating the existing utterance.
  const contentRef = useRef<{ text: string; segments: SpeakableSegment[] }>({ text: '', segments: [] });
  const lastCharIndexRef = useRef(0);
  // Bumped on every speakFrom() call so a cancelled utterance's onend/onerror
  // (queued async by speechSynthesis.cancel(), and so liable to fire after
  // the *next* utterance has already started) can recognise it's stale and
  // skip clobbering the new one's status/highlight.
  const speakGenRef = useRef(0);

  useEffect(() => {
    if (!supported) return;
    let cancelled = false;
    void kvGet<number>(KV_RATE_KEY)
      .then((saved) => {
        if (!cancelled && typeof saved === 'number' && saved >= MIN_RATE && saved <= MAX_RATE) {
          setRateState(saved);
        }
      })
      .catch(() => {
        // Restoring the saved rate is a nice-to-have, not required for
        // read-aloud to work — IndexedDB being unavailable (e.g. private
        // browsing in some engines) should never break the feature itself.
      });
    return () => {
      cancelled = true;
    };
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    highlightRef.current?.set(null);
    setStatus('idle');
  }, [supported]);

  // Stop (and drop the highlight overlay) whenever the caller says the
  // container's content has changed, and unconditionally on unmount —
  // navigating away or to a new lesson mid-speech must never leave audio
  // running.
  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel();
      highlightRef.current?.destroy();
      highlightRef.current = null;
      setStatus('idle');
    };
  }, [supported, resetKey]);

  // Speaks contentRef's text starting at absolute offset `offset`, at
  // whatever rate is current — the one way to change the rate of an
  // "in-flight" reading, since SpeechSynthesisUtterance.rate is fixed at
  // speak() time in every engine and can't be mutated afterwards.
  const speakFrom = useCallback(
    (offset: number) => {
      if (!supported) return;
      window.speechSynthesis.cancel();
      const gen = ++speakGenRef.current;
      const { text, segments } = contentRef.current;
      const slice = text.slice(offset);
      if (slice.trim().length === 0) {
        highlightRef.current?.set(null);
        setStatus('idle');
        return;
      }

      const utterance = new SpeechSynthesisUtterance(slice);
      utterance.rate = rateRef.current;

      utterance.onboundary = (event) => {
        if (speakGenRef.current !== gen) return;
        if (event.name !== undefined && event.name !== 'word') return;
        const absoluteIndex = offset + event.charIndex;
        lastCharIndexRef.current = absoluteIndex;
        const segment = findSegmentAt(segments, absoluteIndex);
        if (!segment) return;
        const range = segmentToRange(segment, absoluteIndex, event.charLength || 1);
        highlightRef.current?.set(range);
      };
      utterance.onend = () => {
        if (speakGenRef.current !== gen) return;
        highlightRef.current?.set(null);
        setStatus('idle');
      };
      utterance.onerror = () => {
        if (speakGenRef.current !== gen) return;
        highlightRef.current?.set(null);
        setStatus('idle');
      };

      window.speechSynthesis.speak(utterance);
      setStatus('speaking');
    },
    [supported],
  );

  const start = useCallback(() => {
    const container = containerRef.current;
    if (!supported || !container) return;
    highlightRef.current?.destroy();
    highlightRef.current = createHighlightController(container);

    const content = extractSpeakableContent(container);
    if (content.text.trim().length === 0) return;
    contentRef.current = content;
    lastCharIndexRef.current = 0;
    speakFrom(0);
  }, [containerRef, supported, speakFrom]);

  const pause = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.pause();
    setStatus('paused');
  }, [supported]);

  const resume = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.resume();
    setStatus('speaking');
  }, [supported]);

  const setRate = useCallback(
    (next: number) => {
      const clamped = Math.min(MAX_RATE, Math.max(MIN_RATE, next));
      setRateState(clamped);
      rateRef.current = clamped;
      void kvSet(KV_RATE_KEY, clamped);
      // Mid-speech rate changes only take effect on a fresh utterance
      // (rate is immutable once speak() is called) — re-speak from the
      // last known word boundary so the change applies immediately instead
      // of only after a manual stop/restart.
      if (statusRef.current === 'speaking') speakFrom(lastCharIndexRef.current);
    },
    [speakFrom],
  );

  return { status, rate, setRate, start, pause, resume, stop };
}
