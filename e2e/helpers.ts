// Shared helpers for the LearnLab e2e suite.
//
// The tests run against the fixture course tree (decision D-001):
//   tests/fixtures/content/valid/maths/test-course/pipeline-module
// Fixture data (lesson titles, assessment answers, pass mark) is read from
// disk here so the tests never hard-code answers that could drift from the
// fixtures.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const fixtureRoot = path.join(repoRoot, 'tests', 'fixtures', 'content', 'valid');
export const fixtureModuleDir = path.join(fixtureRoot, 'maths', 'test-course', 'pipeline-module');

export const COURSE_ID = 'test-course';
export const MODULE_ID = 'pipeline-module';

// ---------------------------------------------------------------------------
// Fixture types (subset of schemas/quiz.schema.json used by the tests)
// ---------------------------------------------------------------------------

interface BaseQuestion {
  id: string;
  text: string;
  explanation: string;
}
export interface McqQuestion extends BaseQuestion {
  type: 'mcq';
  choices: string[];
  answer: number;
}
export interface MultiQuestion extends BaseQuestion {
  type: 'multi';
  choices: string[];
  answers: number[];
}
export interface NumericQuestion extends BaseQuestion {
  type: 'numeric';
  answer: number;
  tolerance: number;
  unit?: string;
}
export interface TextQuestion extends BaseQuestion {
  type: 'text';
  accept: string[];
}
export type FixtureQuestion = McqQuestion | MultiQuestion | NumericQuestion | TextQuestion;

export interface FixtureQuiz {
  id: string;
  title: string;
  questions: FixtureQuestion[];
}

export interface FixtureModule {
  id: string;
  title: string;
  lessons: { id: string; title: string; file: string }[];
  assessment: { file: string; passMark: number };
}

export function loadFixtureModule(): FixtureModule {
  return JSON.parse(
    fs.readFileSync(path.join(fixtureModuleDir, 'module.json'), 'utf8'),
  ) as FixtureModule;
}

export function loadFixtureAssessment(): FixtureQuiz {
  const mod = loadFixtureModule();
  return JSON.parse(
    fs.readFileSync(path.join(fixtureModuleDir, mod.assessment.file), 'utf8'),
  ) as FixtureQuiz;
}

// ---------------------------------------------------------------------------
// Question matching — the quiz shuffles questions and choices with seed
// hash(quizId + ':' + attemptNumber) (FR-QUIZ-002), so the tests match the
// currently rendered question by TEXT, never by position.
// ---------------------------------------------------------------------------

/**
 * Split an authored question text into match fragments: the plain-prose
 * pieces plus the inner content of every $…$ maths span (KaTeX keeps the
 * raw TeX in its MathML annotation and renders the same glyphs, so simple
 * expressions like `2+2` appear verbatim in the DOM text).
 */
function fragmentsOf(text: string): string[] {
  const prose = text
    .split(/\$[^$]*\$/g)
    .map((s) => s.trim())
    .filter(Boolean);
  const maths = [...text.matchAll(/\$([^$]+)\$/g)]
    .map((m) => (m[1] ?? '').trim())
    .filter(Boolean);
  return [...prose, ...maths];
}

/**
 * Find the fixture question shown in `rendered` (the quiz region's text).
 * Every fragment of the authored text must appear; when several questions
 * match (e.g. "Pick A." vs "Pick A again."), the longest authored text wins.
 */
export function findQuestionByRenderedText(
  rendered: string,
  questions: FixtureQuestion[],
): FixtureQuestion {
  const candidates = questions
    .filter((q) => fragmentsOf(q.text).every((fragment) => rendered.includes(fragment)))
    .sort((a, b) => b.text.length - a.text.length);
  const match = candidates[0];
  if (!match) {
    throw new Error(`No fixture question matches the rendered text:\n${rendered}`);
  }
  return match;
}

/** Turn a `text` question's regex pattern into a literal answer ("e\^x" → "e^x"). */
export function literalFromAcceptPattern(pattern: string): string {
  return pattern.replace(/\\(.)/g, '$1');
}

/** A keyboard-/mouse-typable correct answer for a numeric or text question. */
export function typedAnswerFor(q: NumericQuestion | TextQuestion): string {
  return q.type === 'numeric' ? String(q.answer) : literalFromAcceptPattern(q.accept[0] ?? '');
}
