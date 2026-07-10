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
  const [rate, setRateState] = useState(DEFAULT_RATE);
  const highlightRef = useRef<HighlightController | null>(null);

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

  const start = useCallback(() => {
    const container = containerRef.current;
    if (!supported || !container) return;
    window.speechSynthesis.cancel();
    highlightRef.current?.destroy();
    highlightRef.current = createHighlightController(container);

    const { text, segments } = extractSpeakableContent(container);
    if (text.trim().length === 0) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;

    utterance.onboundary = (event) => {
      if (event.name !== undefined && event.name !== 'word') return;
      const segment = findSegmentAt(segments, event.charIndex);
      if (!segment) return;
      const range = segmentToRange(segment, event.charIndex, event.charLength || 1);
      highlightRef.current?.set(range);
    };
    utterance.onend = () => {
      highlightRef.current?.set(null);
      setStatus('idle');
    };
    utterance.onerror = () => {
      highlightRef.current?.set(null);
      setStatus('idle');
    };

    window.speechSynthesis.speak(utterance);
    setStatus('speaking');
  }, [containerRef, rate, supported]);

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

  const setRate = useCallback((next: number) => {
    const clamped = Math.min(MAX_RATE, Math.max(MIN_RATE, next));
    setRateState(clamped);
    void kvSet(KV_RATE_KEY, clamped);
  }, []);

  return { status, rate, setRate, start, pause, resume, stop };
}
