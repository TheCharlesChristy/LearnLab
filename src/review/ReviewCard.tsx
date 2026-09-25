// One review item, asked for real (D-033). The old review page showed an
// opaque id and asked the learner to self-grade it; this card makes them
// *retrieve* first, because the act of retrieval — not re-reading — is what
// strengthens memory (testing effect: Rowland 2014, g = 0.50; classroom
// g = 0.50, Yang et al. 2021).
//
// Flow for auto-marked cards (choice / entry / match):
//   answer → "lock in" with a confidence level → marked feedback → Continue.
// Flow for recall cards (flashcards, flash-recall screens):
//   optional typed attempt → reveal → self-grade on FSRS's 4-point scale.
//
// A wrong answer given with high confidence gets a distinct, calm treatment
// (hypercorrection: those corrections stick best when the learner pauses on
// them — Butterfield & Metcalfe 2001; Metcalfe 2017).

import { useEffect, useMemo, useRef, useState } from 'react';

import { MarkdownInline } from '../markdown';
import type { Confidence, ReviewGrade } from '../progress';
import { CONFIDENCE_LABELS, CONFIDENCE_LEVELS, gradeForAnswer, isConfidentError } from '../progress';
import { hashStringFnv1a, markNumeric, markText, mulberry32, parseNumericInput, shuffle } from '../quiz';
import { Button, choiceClassName, cx } from '../ui';

import type { ChoiceCard, EntryCard, MatchCard, RecallCard, ResolvedReviewItem } from './types';

export interface CardResult {
  grade: ReviewGrade;
  correct: boolean;
  /** Present for auto-marked cards; recall cards are self-graded instead. */
  confidence?: Confidence;
}

export interface ReviewCardProps {
  item: ResolvedReviewItem;
  /** Seeds the choice/match shuffle so a retry within a session reorders options. */
  attempt: number;
  /** True when this is the in-session relearning pass after an earlier miss. */
  relearning?: boolean;
  onDone: (result: CardResult) => void;
}

// Choices that refer to their neighbours can't be reordered safely.
const POSITIONAL = /\b(above|below|both|neither|all of these|none of these)\b/i;

function useShuffledOrder(length: number, seedKey: string, allowShuffle: boolean): number[] {
  return useMemo(() => {
    const order = Array.from({ length }, (_, i) => i);
    // Reordering between reviews stops the learner recalling an option's
    // *position* instead of its content.
    return allowShuffle ? shuffle(order, mulberry32(hashStringFnv1a(seedKey))) : order;
  }, [length, seedKey, allowShuffle]);
}

// ---------------------------------------------------------------------------
// Answer inputs (one per card kind)
// ---------------------------------------------------------------------------

function ChoiceInput({
  card,
  order,
  selected,
  setSelected,
  locked,
}: {
  card: ChoiceCard;
  order: number[];
  selected: number[];
  setSelected: (s: number[]) => void;
  locked: boolean;
}) {
  function toggle(i: number) {
    if (locked) return;
    if (card.multi) setSelected(selected.includes(i) ? selected.filter((x) => x !== i) : [...selected, i]);
    else setSelected([i]);
  }
  return (
    <div
      className="mt-4 space-y-2"
      role={card.multi ? 'group' : 'radiogroup'}
      aria-label={card.multi ? 'Choose all that apply' : 'Choose one'}
    >
      {card.multi && (
        <p className="text-xs text-slate-600 dark:text-slate-300">Select all that apply.</p>
      )}
      {order.map((i) => {
        const isSelected = selected.includes(i);
        const isCorrect = card.correct.includes(i);
        return (
          <button
            key={i}
            type="button"
            role={card.multi ? 'checkbox' : 'radio'}
            aria-checked={isSelected}
            disabled={locked}
            onClick={() => toggle(i)}
            className={choiceClassName(
              locked
                ? isCorrect
                  ? 'correct'
                  : isSelected
                    ? 'wrong'
                    : 'idle'
                : isSelected
                  ? 'selected'
                  : 'idle',
            )}
          >
            <MarkdownInline markdown={card.choices[i] ?? ''} />
            {locked && isSelected && <span className="sr-only">(your answer)</span>}
            {locked && isCorrect && <span className="sr-only">(correct)</span>}
          </button>
        );
      })}
    </div>
  );
}

function MatchInput({
  card,
  order,
  picks,
  setPicks,
  locked,
}: {
  card: MatchCard;
  order: number[];
  picks: (number | null)[];
  setPicks: (p: (number | null)[]) => void;
  locked: boolean;
}) {
  return (
    <div className="mt-4 space-y-2">
      {card.pairs.map((pair, i) => {
        const pick = picks[i] ?? null;
        const wrong = locked && pick !== i;
        return (
          <div key={i} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-2">
            <span id={`match-left-${i}`} className="text-sm">
              <MarkdownInline markdown={pair.left} />
            </span>
            <select
              aria-labelledby={`match-left-${i}`}
              disabled={locked}
              value={pick ?? ''}
              onChange={(e) => {
                const next = [...picks];
                next[i] = e.target.value === '' ? null : Number(e.target.value);
                setPicks(next);
              }}
              className={cx(
                'rounded border bg-white px-2 py-1.5 text-sm dark:bg-slate-800',
                locked && !wrong && 'border-emerald-600',
                wrong && 'border-red-500',
              )}
            >
              <option value="">Choose…</option>
              {order.map((j) => (
                <option key={j} value={j}>
                  {card.pairs[j]!.right.replace(/\$/g, '')}
                </option>
              ))}
            </select>
            {wrong && (
              <p className="text-xs text-slate-700 sm:col-start-2 dark:text-slate-300">
                Correct: <MarkdownInline markdown={pair.right} />
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Auto-marked card (choice / entry / match)
// ---------------------------------------------------------------------------

function isCorrectChoice(card: ChoiceCard, selected: number[]): boolean {
  const want = new Set(card.correct);
  return selected.length === want.size && selected.every((i) => want.has(i));
}

function isCorrectEntry(card: EntryCard, raw: string): boolean {
  if (card.inputMode === 'numeric') {
    const value = parseNumericInput(raw);
    return (
      value !== null &&
      markNumeric(
        { type: 'numeric', id: '', text: '', answer: card.answer ?? 0, tolerance: card.tolerance ?? 0, explanation: '' },
        value,
      )
    );
  }
  return markText(
    { type: 'text', id: '', text: '', accept: card.accept ?? [], caseSensitive: card.caseSensitive, explanation: '' },
    raw,
  );
}

function MarkedCard({ item, attempt, relearning, onDone }: ReviewCardProps) {
  const card = item.card as ChoiceCard | EntryCard | MatchCard;
  const seedKey = `${item.moduleId}|${item.itemId}|${new Date().toDateString()}|${attempt}`;
  const choiceCount = card.kind === 'choice' ? card.choices.length : card.kind === 'match' ? card.pairs.length : 0;
  const allowShuffle =
    card.kind === 'match' || (card.kind === 'choice' && !card.choices.some((c) => POSITIONAL.test(c)));
  const order = useShuffledOrder(choiceCount, seedKey, allowShuffle);

  const [selected, setSelected] = useState<number[]>([]);
  const [text, setText] = useState('');
  const [picks, setPicks] = useState<(number | null)[]>(() =>
    card.kind === 'match' ? card.pairs.map(() => null) : [],
  );
  const [locked, setLocked] = useState<{ confidence: Confidence; correct: boolean } | null>(null);
  const continueRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (locked) continueRef.current?.focus();
  }, [locked]);

  const numericInvalid =
    card.kind === 'entry' && card.inputMode === 'numeric' && text.trim() !== '' && parseNumericInput(text) === null;
  const hasAnswer =
    card.kind === 'choice'
      ? selected.length > 0
      : card.kind === 'entry'
        ? text.trim() !== '' && !numericInvalid
        : picks.every((p) => p !== null);

  function lockIn(confidence: Confidence) {
    if (!hasAnswer || locked) return;
    const correct =
      card.kind === 'choice'
        ? isCorrectChoice(card, selected)
        : card.kind === 'entry'
          ? isCorrectEntry(card, text)
          : picks.every((p, i) => p === i);
    setLocked({ confidence, correct });
  }

  const confidentError = locked ? isConfidentError(locked.correct, locked.confidence) : false;
  const wrongChoiceFeedback =
    locked && !locked.correct && card.kind === 'choice' && !card.multi && selected[0] !== undefined
      ? card.choiceFeedback?.[selected[0]]
      : undefined;

  return (
    <>
      {card.kind === 'entry' && card.context && (
        <div className="mb-3 border-b border-slate-200 pb-3 text-sm dark:border-slate-700">
          <MarkdownInline markdown={card.context} />
        </div>
      )}
      <div className="text-lg font-medium">
        <MarkdownInline markdown={card.prompt} />
      </div>

      {card.kind === 'choice' && (
        <ChoiceInput card={card} order={order} selected={selected} setSelected={setSelected} locked={!!locked} />
      )}
      {card.kind === 'match' && (
        <MatchInput card={card} order={order} picks={picks} setPicks={setPicks} locked={!!locked} />
      )}
      {card.kind === 'entry' && (
        <label className="mt-4 flex flex-wrap items-center gap-2">
          <span>
            Your answer{card.inputMode === 'numeric' && card.unit ? ` (${card.unit})` : ''}
          </span>
          <input
            type="text"
            inputMode={card.inputMode === 'numeric' ? 'decimal' : 'text'}
            autoComplete="off"
            value={text}
            disabled={!!locked}
            onChange={(e) => setText(e.target.value)}
            aria-invalid={numericInvalid || undefined}
            className="rounded border bg-white px-2 py-1 dark:bg-slate-800"
          />
          {numericInvalid && (
            <span className="text-xs text-red-700 dark:text-red-400">Enter a number, e.g. 12.5 or 1.2e3</span>
          )}
        </label>
      )}

      {!locked ? (
        <fieldset className="mt-5" disabled={!hasAnswer}>
          <legend className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            How sure are you? <span className="font-normal">Locking in marks your answer.</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {CONFIDENCE_LEVELS.map((c) => (
              <Button key={c} variant={c === 'sure' ? 'primary' : 'secondary'} onClick={() => lockIn(c)}>
                {CONFIDENCE_LABELS[c]}
              </Button>
            ))}
          </div>
        </fieldset>
      ) : (
        <div aria-live="polite" className="mt-5 space-y-3">
          {locked.correct ? (
            <p className="font-semibold text-emerald-700 dark:text-emerald-400">
              {locked.confidence === 'guess' ? 'Correct — a lucky guess counts for less, so this comes back sooner.' : 'Correct!'}
            </p>
          ) : confidentError ? (
            <div className="rounded-md border border-amber-400 bg-amber-50 p-3 text-amber-950 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-100">
              <p className="font-semibold">You were sure — and it was something else.</p>
              <p className="mt-1 text-sm">
                That&rsquo;s the most useful moment in a review: confident mistakes that get corrected are
                remembered better than any others. Take a few seconds with the explanation below.
              </p>
            </div>
          ) : (
            <p className="font-semibold text-red-700 dark:text-red-400">
              Not this time{relearning ? '' : ' — it will come back at the end of this session'}.
            </p>
          )}
          {!locked.correct && card.kind === 'entry' && card.displayAnswer && (
            <p className="text-sm">
              Answer: <span className="font-semibold"><MarkdownInline markdown={card.displayAnswer} /></span>
            </p>
          )}
          {wrongChoiceFeedback && (
            <div className="text-sm text-slate-800 dark:text-slate-200">
              <MarkdownInline markdown={wrongChoiceFeedback} />
            </div>
          )}
          {card.explanation && (
            <div className="text-sm text-slate-700 dark:text-slate-300">
              <MarkdownInline markdown={card.explanation} />
            </div>
          )}
          <Button
            ref={continueRef}
            onClick={() =>
              onDone({
                grade: gradeForAnswer(locked.correct, locked.confidence),
                correct: locked.correct,
                confidence: locked.confidence,
              })
            }
          >
            Continue
          </Button>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Recall card (flashcards, flash-recall)
// ---------------------------------------------------------------------------

const RECALL_GRADES: { grade: ReviewGrade; label: string; hint: string }[] = [
  { grade: 'again', label: 'Forgot', hint: 'comes back tomorrow' },
  { grade: 'hard', label: 'Hard', hint: 'took real effort' },
  { grade: 'good', label: 'Got it', hint: 'recalled it' },
  { grade: 'easy', label: 'Easy', hint: 'instant' },
];

function RecallCardView({ item, onDone }: ReviewCardProps) {
  const card = item.card as RecallCard;
  const [attemptText, setAttemptText] = useState('');
  const [revealed, setRevealed] = useState(false);
  const firstGradeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (revealed) firstGradeRef.current?.focus();
  }, [revealed]);

  return (
    <>
      <div className="text-lg font-medium">
        <MarkdownInline markdown={card.front} />
      </div>
      {!revealed ? (
        <div className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="text-slate-700 dark:text-slate-200">
              Say it or jot it down first (optional — producing an answer beats recognising one)
            </span>
            <textarea
              value={attemptText}
              onChange={(e) => setAttemptText(e.target.value)}
              rows={2}
              className="mt-1 block w-full rounded border bg-white px-2 py-1 dark:bg-slate-800"
            />
          </label>
          <Button onClick={() => setRevealed(true)}>Show answer</Button>
        </div>
      ) : (
        <div className="mt-4 space-y-3 border-t border-slate-200 pt-3 dark:border-slate-700">
          {attemptText.trim() && (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              You wrote: <span className="italic">{attemptText}</span>
            </p>
          )}
          <div>
            <MarkdownInline markdown={card.back} />
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">How did it go?</legend>
            <div className="flex flex-wrap gap-2">
              {RECALL_GRADES.map((g, i) => (
                <Button
                  key={g.grade}
                  ref={i === 0 ? firstGradeRef : undefined}
                  variant={g.grade === 'again' ? 'secondary' : g.grade === 'good' ? 'primary' : 'secondary'}
                  onClick={() => onDone({ grade: g.grade, correct: g.grade !== 'again' })}
                  aria-description={g.hint}
                >
                  {g.label}
                </Button>
              ))}
            </div>
          </fieldset>
        </div>
      )}
    </>
  );
}

export function ReviewCard(props: ReviewCardProps) {
  return props.item.card.kind === 'recall' ? <RecallCardView {...props} /> : <MarkedCard {...props} />;
}
