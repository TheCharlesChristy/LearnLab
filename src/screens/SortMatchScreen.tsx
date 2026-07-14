// `sort-match` screen — click-to-select matching, generalizing the
// `matching-pairs` widget's interaction model (D-028: click/tap over native
// drag-and-drop for keyboard/screen-reader parity) into one gated screen.
// Gating: Continue stays disabled until every pair is matched.

import { useMemo, useState } from 'react';

import { hashStringFnv1a, mulberry32, shuffle } from '../lib/seeded-random';
import { MarkdownInline } from '../markdown';

import { defineScreen } from './screen-def';
import type { ScreenRunnerProps } from './screen-def';
import { ScreenShell } from './ScreenShell';
import type { SortMatchScreen as SortMatchScreenType } from './types';

/** Visual state -> Tailwind classes for one choice button (mirrors matching-pairs). */
function choiceClassName(isMatched: boolean, isSelected: boolean, isMismatch: boolean): string {
  const base =
    'w-full rounded-md border px-3 py-2 text-left text-sm transition-colors motion-safe:duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-default';
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

function SortMatchScreenRunner({
  screen,
  index,
  total,
  onAdvance,
  onInteraction,
}: ScreenRunnerProps<SortMatchScreenType>) {
  const { pairs } = screen;
  const rightOrder = useMemo(() => {
    const rng = mulberry32(hashStringFnv1a(screen.id));
    return shuffle(
      pairs.map((_, i) => i),
      rng,
    );
  }, [pairs, screen.id]);

  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [mismatch, setMismatch] = useState<{ left: number; right: number } | null>(null);

  const complete = matched.size === pairs.length;

  function attemptMatch(leftIndex: number, rightIndex: number) {
    if (leftIndex === rightIndex) {
      const next = new Set(matched);
      next.add(leftIndex);
      const values = {
        '/left-index': leftIndex,
        '/right-index': rightIndex,
        '/matched': [...next].sort((left, right) => left - right).map(String),
        '/correct': true,
      } as const;
      onInteraction?.({ type: 'interaction', values });
      onInteraction?.({ type: 'attempted', values });
      setMatched(next);
      setSelectedLeft(null);
      setSelectedRight(null);
      return;
    }
    const values = {
      '/left-index': leftIndex,
      '/right-index': rightIndex,
      '/correct': false,
    } as const;
    onInteraction?.({ type: 'interaction', values });
    onInteraction?.({ type: 'attempted', values });
    setMismatch({ left: leftIndex, right: rightIndex });
    window.setTimeout(() => {
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
    <ScreenShell index={index} total={total} canAdvance={complete} onAdvance={onAdvance}>
      <p className="text-lg font-medium">
        <MarkdownInline markdown={screen.prompt} />
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3" role="group" aria-label="Matching pairs">
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
      <div aria-live="polite" className="mt-3 min-h-6">
        {complete && (
          <div className="font-semibold text-emerald-700 dark:text-emerald-400">
            <MarkdownInline markdown={screen.successFeedback ?? 'All matched!'} />
          </div>
        )}
      </div>
    </ScreenShell>
  );
}

export const def = defineScreen<SortMatchScreenType>({ component: SortMatchScreenRunner });
