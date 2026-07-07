// Pure marking functions — normative per SRS §4.6 marking rules.
// No React, no IO (console.warn on invalid author regex only).

import type { McqQuestion, MultiQuestion, NumericQuestion, TextQuestion } from './types';

/** mcq: correct iff the selected index equals `answer` (§4.6). */
export function markMcq(question: McqQuestion, selected: number): boolean {
  return selected === question.answer;
}

/** multi: correct iff the selected set equals `answers` exactly (§4.6). Used for
 *  feedback-wording purposes ("Correct!" vs "Incorrect.") — the numeric score
 *  for `multi` is computed by `scoreMulti` instead (§13 roadmap: partial credit). */
export function markMulti(question: MultiQuestion, selected: readonly number[]): boolean {
  const want = new Set(question.answers);
  const got = new Set(selected);
  if (want.size !== got.size) return false;
  for (const index of want) {
    if (!got.has(index)) return false;
  }
  return true;
}

/**
 * multi: per-question partial credit (§13 roadmap, D-023). Score is
 * `max(0, (correctPicks − incorrectPicks) / answers.length)`, clamped to
 * [0, 1] — a pinned algorithm, not a design choice. `correctPicks` counts
 * selected indices that are in `answers`; `incorrectPicks` counts selected
 * indices that are not. Duplicate selections are ignored (set semantics),
 * matching `markMulti`.
 */
export function scoreMulti(question: MultiQuestion, selected: readonly number[]): number {
  const want = new Set(question.answers);
  const got = new Set(selected);
  let correctPicks = 0;
  let incorrectPicks = 0;
  for (const index of got) {
    if (want.has(index)) correctPicks++;
    else incorrectPicks++;
  }
  return Math.max(0, (correctPicks - incorrectPicks) / want.size);
}

// FR-QUIZ-004: accept '-', decimals, and scientific notation (e.g. 1.2e3); reject otherwise.
const NUMERIC_INPUT_RE = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

/**
 * Parse learner numeric input. Returns the finite number, or `null` when the
 * input is not a valid decimal/scientific-notation number (FR-QUIZ-004).
 */
export function parseNumericInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!NUMERIC_INPUT_RE.test(trimmed)) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

/** numeric: correct iff `abs(value − answer) ≤ tolerance` (§4.6; bound is inclusive). */
export function markNumeric(question: NumericQuestion, value: number): boolean {
  return Math.abs(value - question.answer) <= question.tolerance;
}

/**
 * text: correct iff the trimmed input full-matches ANY `accept` regex source (§4.6).
 * Full match is enforced by anchoring as `^(?:source)$`. `caseSensitive` defaults
 * to false (adds the 'i' flag). An invalid regex source is treated as no-match
 * and reported via console.warn (content validation should have caught it).
 */
export function markText(question: TextQuestion, input: string): boolean {
  const trimmed = input.trim();
  const flags = question.caseSensitive ? '' : 'i';
  for (const source of question.accept) {
    let re: RegExp;
    try {
      re = new RegExp(`^(?:${source})$`, flags);
    } catch {
      console.warn(
        `[quiz] invalid accept regex for question "${question.id}": ${JSON.stringify(source)}`,
      );
      continue;
    }
    if (re.test(trimmed)) return true;
  }
  return false;
}
