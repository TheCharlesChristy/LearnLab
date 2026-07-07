// Native quiz engine — SRS §5.4 (FR-QUIZ-001..006), §4.6, NFR-A11Y-001.
// One question at a time → per-question feedback → summary with review + retry.
// Attempt recording goes through LessonContext (§3.5); absent context (tests,
// storybook) skips recording silently.

import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { LessonContext } from '../content/lesson-context';
import { markMcq, markMulti, markNumeric, markText, parseNumericInput, scoreMulti } from './marking';
import { prepareAttempt, toOriginalChoiceIndex } from './prepare';
import type { PreparedQuestion } from './prepare';
import type { Quiz } from './types';

export interface QuizEngineProps {
  quiz: Quiz;
  attemptNumber: number;
  kind: 'assessment' | 'inline-quiz';
  pickOverride?: number;
  practiceMode?: boolean;
  onFinished?: (result: { score: number; maxScore: number }) => void;
  /** Bump attemptNumber upstream; the summary Retry button calls this. */
  onRetry?: () => void;
  /**
   * Renderer for question text / explanations (Markdown + maths). Wired by the
   * app shell; falls back to plain text so the engine has no markdown import.
   */
  renderMarkdown?: (md: string) => ReactNode;
}

interface ResponseRecord {
  questionId: string;
  /** JSON-safe echo in authored (original) index space — §5.5 Attempt.answers. */
  given: unknown;
  /** Exact-match correctness — drives "Correct!"/"Incorrect." feedback wording. */
  correct: boolean;
  /** Numeric score in [0, 1] contributing to the quiz total (§13 roadmap: multi partial credit). */
  points: number;
  givenDisplay: string;
  correctDisplay: string;
}

/**
 * Three-state correctness for feedback/summary wording. `multi` questions can
 * land strictly between fully correct and fully incorrect (partial credit,
 * §13 roadmap); other question types only ever have `points` 0 or 1, so the
 * 'partial' state never arises for them.
 */
type CorrectnessState = 'correct' | 'partial' | 'incorrect';

function correctnessState(correct: boolean, points: number, isMulti: boolean): CorrectnessState {
  if (correct) return 'correct';
  if (isMulti && points > 0) return 'partial';
  return 'incorrect';
}

/** One quiz attempt; remounts (fresh state) whenever quiz id or attemptNumber changes. */
export function QuizEngine(props: QuizEngineProps) {
  return <QuizAttempt key={`${props.quiz.id}:${props.attemptNumber}`} {...props} />;
}

function QuizAttempt({
  quiz,
  attemptNumber,
  kind,
  pickOverride,
  practiceMode = false,
  onFinished,
  onRetry,
  renderMarkdown,
}: QuizEngineProps) {
  const lessonCtx = useContext(LessonContext);
  const md = renderMarkdown ?? ((text: string): ReactNode => text);

  const prepared = useMemo(
    () => prepareAttempt(quiz, attemptNumber, pickOverride),
    [quiz, attemptNumber, pickOverride],
  );

  const startedAtRef = useRef(Date.now());
  const finishedRef = useRef(false);

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'question' | 'summary'>('question');
  const [responses, setResponses] = useState<ResponseRecord[]>([]);
  const [feedback, setFeedback] = useState<{
    correct: boolean;
    points: number;
    isMulti: boolean;
  } | null>(null);
  const [recordError, setRecordError] = useState(false);

  // Per-question input state (reset on Next).
  const [selected, setSelected] = useState<number | null>(null);
  const [multiSelected, setMultiSelected] = useState<number[]>([]);
  const [numericText, setNumericText] = useState('');
  const [textInput, setTextInput] = useState('');

  const total = prepared.length;
  const current = prepared[index];

  // Keyboard/SR flow: when advancing, the action button may become disabled
  // (numeric Submit), which would drop focus — move it to the progress line.
  const progressRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (index > 0) progressRef.current?.focus();
  }, [index]);

  function buildResponse(p: PreparedQuestion): ResponseRecord {
    const q = p.question;
    switch (q.type) {
      case 'mcq': {
        const sel = selected ?? -1;
        const correct = markMcq(q, sel);
        return {
          questionId: q.id,
          given: toOriginalChoiceIndex(p, sel),
          correct,
          points: correct ? 1 : 0,
          givenDisplay: q.choices[sel] ?? '(no answer)',
          correctDisplay: q.choices[q.answer] ?? '',
        };
      }
      case 'multi': {
        const sel = [...multiSelected].sort((a, b) => a - b);
        return {
          questionId: q.id,
          given: sel.map((i) => toOriginalChoiceIndex(p, i)).sort((a, b) => a - b),
          correct: markMulti(q, sel),
          points: scoreMulti(q, sel),
          givenDisplay: sel.map((i) => q.choices[i] ?? '').join(', ') || '(none selected)',
          correctDisplay: q.answers.map((i) => q.choices[i] ?? '').join(', '),
        };
      }
      case 'numeric': {
        const value = parseNumericInput(numericText);
        const unit = q.unit ? ` ${q.unit}` : '';
        const correct = value !== null && markNumeric(q, value);
        return {
          questionId: q.id,
          given: value,
          correct,
          points: correct ? 1 : 0,
          givenDisplay: `${numericText.trim()}${unit}`,
          correctDisplay:
            q.tolerance > 0 ? `${q.answer} ± ${q.tolerance}${unit}` : `${q.answer}${unit}`,
        };
      }
      case 'text': {
        const correct = markText(q, textInput);
        return {
          questionId: q.id,
          given: textInput.trim(),
          correct,
          points: correct ? 1 : 0,
          givenDisplay: textInput.trim() || '(blank)',
          correctDisplay: `matches: ${q.accept.join(' | ')}`,
        };
      }
    }
  }

  function submitDisabled(p: PreparedQuestion): boolean {
    switch (p.question.type) {
      case 'mcq':
        return selected === null;
      case 'multi':
        return multiSelected.length === 0;
      case 'numeric':
        return parseNumericInput(numericText) === null;
      case 'text':
        return textInput.trim() === '';
    }
  }

  function finish(allResponses: ResponseRecord[]) {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setPhase('summary');

    const score = allResponses.reduce((sum, r) => sum + r.points, 0);
    const maxScore = total;
    onFinished?.({ score, maxScore });

    // FR-QUIZ-003 / FR-QUIZ-006: record unless practice mode; skip silently
    // when no lesson context (tests / storybook). NFR-REL-001: awaited, errors
    // surfaced via console + inline notice — never thrown into render.
    if (!practiceMode && lessonCtx) {
      const attempt = {
        moduleId: lessonCtx.moduleId,
        itemId: quiz.id,
        kind,
        score,
        maxScore,
        startedAt: startedAtRef.current,
        finishedAt: Date.now(),
        answers: allResponses.map(({ questionId, given, correct }) => ({
          questionId,
          given,
          correct,
        })),
      };
      void (async () => {
        try {
          await lessonCtx.recordAttempt(attempt);
        } catch (err) {
          console.error('[quiz] failed to record attempt', err);
          setRecordError(true);
        }
      })();

      // §13 roadmap (D-021/D-022): seed each missed question into the
      // spaced-repetition queue so it resurfaces later, independent of
      // whether the learner ever revisits this quiz. seedReviewItem() is a
      // no-op for an already-tracked item, so retries don't disturb a real
      // in-progress review schedule — fire-and-forget, same as setItemState.
      for (const r of allResponses) {
        if (!r.correct) void lessonCtx.seedReviewItem(`${quiz.id}:${r.questionId}`);
      }
    }
  }

  function handleSubmit() {
    if (!current) return;
    const response = buildResponse(current);
    setResponses((prev) => [...prev, response]);
    setFeedback({
      correct: response.correct,
      points: response.points,
      isMulti: current.question.type === 'multi',
    });
  }

  function handleNext() {
    if (index + 1 >= total) {
      finish(responses);
      return;
    }
    setIndex(index + 1);
    setFeedback(null);
    setSelected(null);
    setMultiSelected([]);
    setNumericText('');
    setTextInput('');
  }

  const score = responses.reduce((sum, r) => sum + r.points, 0);

  if (phase === 'summary') {
    return (
      <section aria-label={`${quiz.title} — summary`} className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold">{quiz.title} — Summary</h2>
        <p className="mt-1 font-medium" aria-live="polite">
          Score: {score} / {total}
        </p>
        {practiceMode && (
          <p className="mt-1 text-sm italic">Practice mode — this attempt was not recorded.</p>
        )}
        {recordError && (
          <p role="alert" className="mt-1 text-sm text-red-700 dark:text-red-400">
            Your attempt could not be saved. Your score is shown above, but it will not appear in
            your progress.
          </p>
        )}
        <ol className="mt-4 space-y-4">
          {prepared.map((p, i) => {
            const r = responses[i];
            const isMulti = p.question.type === 'multi';
            const state = r ? correctnessState(r.correct, r.points, isMulti) : 'incorrect';
            const label =
              state === 'correct'
                ? 'Correct'
                : state === 'partial'
                  ? `Partially correct (${Math.round((r?.points ?? 0) * 100)}%)`
                  : 'Incorrect';
            return (
              <li key={p.question.id} className="rounded border p-3">
                <div className="font-medium">{md(p.question.text)}</div>
                <p className="mt-1 text-sm">
                  {label} — Your answer: {r?.givenDisplay ?? '—'}
                </p>
                <p className="text-sm">Correct answer: {r?.correctDisplay ?? '—'}</p>
                <div className="mt-1 text-sm opacity-80">{md(p.question.explanation)}</div>
              </li>
            );
          })}
        </ol>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded bg-blue-600 px-4 py-2 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Retry
          </button>
        )}
      </section>
    );
  }

  if (!current) return null;
  const q = current.question;
  const answered = feedback !== null;
  const numericValue = parseNumericInput(numericText);
  const numericInvalid = q.type === 'numeric' && numericText.trim() !== '' && numericValue === null;
  const hintId = `${quiz.id}-numeric-hint`;

  return (
    <section aria-label={quiz.title} className="rounded-lg border p-4">
      <p ref={progressRef} tabIndex={-1} className="text-sm font-medium opacity-80">
        Question {index + 1} of {total}
      </p>

      {q.type === 'mcq' || q.type === 'multi' ? (
        <fieldset className="mt-2" disabled={answered}>
          <legend className="font-medium">{md(q.text)}</legend>
          <div className="mt-2 space-y-1">
            {q.choices.map((choice, i) => (
              <label key={i} className="flex items-center gap-2">
                <input
                  type={q.type === 'mcq' ? 'radio' : 'checkbox'}
                  name={`${quiz.id}-${q.id}`}
                  value={i}
                  checked={q.type === 'mcq' ? selected === i : multiSelected.includes(i)}
                  onChange={() => {
                    if (q.type === 'mcq') setSelected(i);
                    else
                      setMultiSelected((prev) =>
                        prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
                      );
                  }}
                  className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                />
                <span>{md(choice)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : (
        <div className="mt-2">
          <div className="font-medium">{md(q.text)}</div>
          <label className="mt-2 flex items-center gap-2" htmlFor={`${quiz.id}-${q.id}-input`}>
            <span>Your answer{q.type === 'numeric' && q.unit ? ` (${q.unit})` : ''}</span>
            <input
              id={`${quiz.id}-${q.id}-input`}
              type="text"
              inputMode={q.type === 'numeric' ? 'decimal' : 'text'}
              value={q.type === 'numeric' ? numericText : textInput}
              disabled={answered}
              aria-invalid={numericInvalid || undefined}
              aria-describedby={numericInvalid ? hintId : undefined}
              onChange={(e) => {
                if (q.type === 'numeric') setNumericText(e.target.value);
                else setTextInput(e.target.value);
              }}
              className="rounded border px-2 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            />
          </label>
          {numericInvalid && (
            <p id={hintId} className="mt-1 text-sm text-red-700 dark:text-red-400">
              Enter a number — decimals and scientific notation (e.g. 1.2e3) are accepted.
            </p>
          )}
        </div>
      )}

      {/* FR-QUIZ-005: feedback announced politely; region exists before content. */}
      <div aria-live="polite" className="mt-3 min-h-6">
        {feedback &&
          (() => {
            const state = correctnessState(feedback.correct, feedback.points, feedback.isMulti);
            const label =
              state === 'correct'
                ? 'Correct!'
                : state === 'partial'
                  ? `Partially correct (${Math.round(feedback.points * 100)}%).`
                  : 'Incorrect.';
            return (
              <div>
                <p className="font-semibold">{label}</p>
                <div className="mt-1 text-sm opacity-80">{md(q.explanation)}</div>
              </div>
            );
          })()}
      </div>

      <button
        type="button"
        onClick={answered ? handleNext : handleSubmit}
        disabled={!answered && submitDisabled(current)}
        className="mt-3 rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        {answered ? (index + 1 >= total ? 'Finish' : 'Next') : 'Submit'}
      </button>
    </section>
  );
}
