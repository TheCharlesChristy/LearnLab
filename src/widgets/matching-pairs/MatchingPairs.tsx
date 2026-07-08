// `matching-pairs` implementation — a click/tap-to-select matching game
// (SRS §5.3 row, D-028 on the interaction model). Fetches a module-relative
// JSON file { title?, instructions?, pairs: [{ left, right }] } (Markdown
// strings) and lays out two columns: left in authored order, right shuffled
// (seeded on `src`, so layout is stable across reloads — same determinism
// precedent as quiz question order, FR-QUIZ-002). Select a left term then a
// right term (or vice versa) to attempt a match.
//
// Deliberately replayable, not persisted: unlike flashcards (mastery
// tracking across visits), a matching game is meant to be played again, so
// no LessonContext.getItemState/setItemState round-trip — the round simply
// resets each time the widget mounts, and via "Play again".
//
// Per the task contract this widget does NOT import src/progress; on
// completion it reports the milestone through LessonContext.notifyEngagement
// (§3.5), same as Flashcards' deck-complete and QuizEngine's finish().
//
// Failure handling mirrors flashcards/step-reveal: network/HTTP failure →
// retry card; malformed JSON / bad shape → error card naming the exact
// problem.

import { useContext, useEffect, useMemo, useRef, useState } from 'react';

import { LessonContext } from '../../content';
import { MarkdownInline } from '../../markdown';
import { GameShell, hashStringFnv1a, mulberry32, shuffle } from '../game-kit';

import type { MatchingPairsProps } from './index';

interface Pair {
  left: string;
  right: string;
}

interface GameData {
  title?: string;
  instructions?: string;
  pairs: Pair[];
}

/** True for URLs that must not be re-based: scheme:, protocol-relative, root-relative. */
function isAbsoluteUrl(src: string): boolean {
  return /^(?:[a-z][a-z\d+\-.]*:|\/)/i.test(src);
}

/** Validate the fetched value into GameData, or throw an Error naming the problem. */
function parseData(value: unknown): GameData {
  if (typeof value !== 'object' || value === null) {
    throw new Error('file must be a JSON object with a "pairs" array');
  }
  const v = value as Record<string, unknown>;
  if (!Array.isArray(v.pairs) || v.pairs.length < 2) {
    throw new Error('pairs: must be an array with at least 2 entries');
  }
  const pairs = v.pairs.map((rawPair, i) => {
    if (typeof rawPair !== 'object' || rawPair === null) {
      throw new Error(`pairs[${i}]: must be an object { left, right }`);
    }
    const p = rawPair as Record<string, unknown>;
    if (typeof p.left !== 'string' || p.left.trim() === '') {
      throw new Error(`pairs[${i}].left: must be a non-empty string`);
    }
    if (typeof p.right !== 'string' || p.right.trim() === '') {
      throw new Error(`pairs[${i}].right: must be a non-empty string`);
    }
    return { left: p.left, right: p.right };
  });
  const title = typeof v.title === 'string' && v.title.trim() !== '' ? v.title : undefined;
  const instructions =
    typeof v.instructions === 'string' && v.instructions.trim() !== '' ? v.instructions : undefined;
  return { title, instructions, pairs };
}

type LoadState =
  | { status: 'loading' }
  | { status: 'fetch-error'; message: string }
  | { status: 'data-error'; message: string }
  | { status: 'ready'; data: GameData };

export default function MatchingPairs({ src }: MatchingPairsProps) {
  const ctx = useContext(LessonContext); // optional: null outside lesson routes
  const url =
    ctx && !isAbsoluteUrl(src) ? `${ctx.moduleBaseUrl}${src.replace(/^\.\//, '')}` : src;

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    void (async () => {
      let raw: unknown;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        raw = await res.json();
      } catch (err) {
        console.error(`[matching-pairs] failed to load ${url}`, err);
        if (!cancelled) {
          setState({
            status: 'fetch-error',
            message: err instanceof Error ? err.message : String(err),
          });
        }
        return;
      }
      try {
        const data = parseData(raw);
        if (!cancelled) setState({ status: 'ready', data });
      } catch (err) {
        if (!cancelled) {
          setState({
            status: 'data-error',
            message: err instanceof Error ? err.message : String(err),
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url, reloadToken]);

  if (state.status === 'loading') {
    return (
      <div role="status" className="my-4 rounded-lg border p-4 text-sm opacity-80">
        Loading matching game…
      </div>
    );
  }

  if (state.status === 'fetch-error') {
    return (
      <div role="alert" className="my-4 rounded-lg border border-red-300 p-4">
        <p className="font-medium">Couldn’t load the matching game</p>
        <p className="mt-1 text-sm opacity-80">
          {src}: {state.message}
        </p>
        <button
          type="button"
          onClick={() => setReloadToken((t) => t + 1)}
          className="mt-2 rounded bg-blue-600 px-3 py-1 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (state.status === 'data-error') {
    return (
      <div role="alert" className="my-4 rounded-lg border border-red-300 p-4">
        <p className="font-medium">Invalid matching-pairs data</p>
        <p className="mt-1 text-sm opacity-80">
          {src}: {state.message}
        </p>
      </div>
    );
  }

  return <Board data={state.data} src={src} />;
}

/** Visual state -> Tailwind classes for one choice button. */
function choiceClassName(isMatched: boolean, isSelected: boolean, isMismatch: boolean): string {
  const base =
    'w-full rounded-md border px-3 py-2 text-left transition-colors motion-safe:duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-default';
  if (isMatched) {
    return `${base} border-emerald-300 bg-emerald-50 text-emerald-900 opacity-70 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-200`;
  }
  if (isMismatch) {
    return `${base} motion-safe:animate-shake border-red-400 bg-red-50 dark:border-red-700 dark:bg-red-950`;
  }
  if (isSelected) {
    return `${base} border-indigo-600 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-950/40`;
  }
  return `${base} border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700`;
}

function Board({ data, src }: { data: GameData; src: string }) {
  const ctx = useContext(LessonContext); // optional: graceful no-op outside a lesson route
  const { pairs, title, instructions } = data;

  // Right column display order: seeded on `src` so it's stable across
  // reloads/remounts, same determinism precedent as quiz question order
  // (FR-QUIZ-002) — reshuffled fresh only via an explicit "Play again".
  const [shuffleSalt, setShuffleSalt] = useState(0);
  const rightOrder = useMemo(() => {
    const rng = mulberry32(hashStringFnv1a(`${src}:${shuffleSalt}`));
    return shuffle(
      pairs.map((_, i) => i),
      rng,
    );
  }, [pairs, src, shuffleSalt]);

  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [mismatch, setMismatch] = useState<{ left: number; right: number } | null>(null);
  const [announcement, setAnnouncement] = useState('Select a term, then its match.');
  const notifiedRef = useRef(false);
  const mismatchTimeoutRef = useRef<number | null>(null);

  const complete = matched.size === pairs.length;

  useEffect(() => {
    if (complete && !notifiedRef.current) {
      notifiedRef.current = true;
      if (ctx) void ctx.notifyEngagement({ kind: 'game-complete' });
    }
  }, [complete, ctx]);

  useEffect(() => {
    return () => {
      if (mismatchTimeoutRef.current !== null) window.clearTimeout(mismatchTimeoutRef.current);
    };
  }, []);

  function reset() {
    setMatched(new Set());
    setSelectedLeft(null);
    setSelectedRight(null);
    setMismatch(null);
    setAnnouncement('New round — select a term, then its match.');
    notifiedRef.current = false;
    setShuffleSalt((s) => s + 1);
  }

  function attemptMatch(leftIndex: number, rightIndex: number) {
    if (leftIndex === rightIndex) {
      const next = new Set(matched);
      next.add(leftIndex);
      setMatched(next);
      setSelectedLeft(null);
      setSelectedRight(null);
      setAnnouncement(
        next.size === pairs.length ? 'All pairs matched!' : `Matched: ${pairs[leftIndex]!.left}`,
      );
      return;
    }
    setMismatch({ left: leftIndex, right: rightIndex });
    setAnnouncement('Not a match — try again.');
    mismatchTimeoutRef.current = window.setTimeout(() => {
      setMismatch(null);
      setSelectedLeft(null);
      setSelectedRight(null);
    }, 500);
  }

  function pickLeft(i: number) {
    if (matched.has(i) || mismatch) return;
    if (selectedRight !== null) attemptMatch(i, selectedRight);
    else setSelectedLeft(i);
  }

  function pickRight(pairIndex: number) {
    if (matched.has(pairIndex) || mismatch) return;
    if (selectedLeft !== null) attemptMatch(selectedLeft, pairIndex);
    else setSelectedRight(pairIndex);
  }

  return (
    <GameShell
      title={title}
      instructions={instructions ?? 'Select a term, then its match.'}
      announcement={announcement}
      complete={complete}
      completeLabel={`All ${pairs.length} pairs matched! 🎉`}
      onPlayAgain={reset}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          {pairs.map((pair, i) => (
            <button
              key={i}
              type="button"
              disabled={matched.has(i)}
              aria-pressed={selectedLeft === i}
              onClick={() => pickLeft(i)}
              className={choiceClassName(matched.has(i), selectedLeft === i, mismatch?.left === i)}
            >
              <MarkdownInline markdown={pair.left} />
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {rightOrder.map((pairIndex) => (
            <button
              key={pairIndex}
              type="button"
              disabled={matched.has(pairIndex)}
              aria-pressed={selectedRight === pairIndex}
              onClick={() => pickRight(pairIndex)}
              className={choiceClassName(
                matched.has(pairIndex),
                selectedRight === pairIndex,
                mismatch?.right === pairIndex,
              )}
            >
              <MarkdownInline markdown={pairs[pairIndex]!.right} />
            </button>
          ))}
        </div>
      </div>
    </GameShell>
  );
}
