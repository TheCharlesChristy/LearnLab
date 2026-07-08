// Celebration bus — module-level pub/sub mirroring ../toast.tsx exactly, so
// non-React code (and code across subsystem boundaries, via
// LessonContext.notifyEngagement) can trigger a celebration without needing
// the React context. A celebration is a toast message plus an optional
// confetti burst; confetti degrades to "no burst, message still shows" under
// prefers-reduced-motion (see Confetti.tsx).

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { toast } from '../toast';

import { Confetti } from './Confetti';

export interface CelebrationInput {
  message: string;
  /** Default true — set false for a celebration that's message-only. */
  confetti?: boolean;
}

type Listener = (input: CelebrationInput) => void;

const listeners = new Set<Listener>();
let nextId = 1;

/** Trigger a celebration from anywhere (React or not). */
export function celebrate(input: CelebrationInput): void {
  toast({ message: input.message });
  for (const l of listeners) l(input);
}

/** Renders confetti bursts queued by `celebrate()`. Mount once, near the app root. */
export function CelebrationLayer(): ReactNode {
  const [bursts, setBursts] = useState<number[]>([]);

  useEffect(() => {
    const listener: Listener = (input) => {
      if (input.confetti === false) return;
      const id = nextId++;
      setBursts((b) => [...b, id]);
      window.setTimeout(() => {
        setBursts((b) => b.filter((x) => x !== id));
      }, 1200);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return bursts.map((id) => <Confetti key={id} />);
}
