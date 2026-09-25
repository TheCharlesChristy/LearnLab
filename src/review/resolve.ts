// Review-item resolver (D-033): (moduleId, itemId) → the renderable question.
//
// Item-id namespaces, as written by the content-side seeders:
//   flashcards:<src>:<cardIndex>   Flashcards widget (src is module-relative)
//   screen:<lessonId>:<screenId>   ScreenSequenceEngine checkpoint screens
//   <quizId>:<questionId>          QuizEngine (assessments and inline quizzes)
//
// Everything is resolved at runtime through the existing (cached) content
// loaders, so no new build artefact is needed. Quiz ids aren't file names,
// so a quiz item is found by checking the module's assessment first, then
// every inline `::widget{type="quiz" src=…}` referenced by its Markdown
// lessons — the same files build-content.mjs already validates.

import {
  findModule,
  loadLessonMarkdown,
  loadQuiz,
  loadScreenSequence,
  moduleBaseUrl,
} from '../content';
import type { ModuleLocation } from '../content';
import type { Question, Quiz } from '../quiz';
import type { Screen } from '../screens';

import { displayTextAnswer } from './answer-display';
import type { ReviewCardContent, ReviewItemResolution, ReviewItemSource } from './types';

export interface ResolverDeps {
  findModule: (moduleId: string) => Promise<ModuleLocation | null>;
  loadQuiz: (coursePath: string, dir: string, file: string) => Promise<Quiz>;
  loadScreenSequence: typeof loadScreenSequence;
  loadLessonMarkdown: (coursePath: string, dir: string, file: string) => Promise<string>;
  /** Fetch a module-relative JSON file (flashcard decks have no dedicated loader). */
  fetchJson: (url: string) => Promise<unknown>;
  moduleBaseUrl: (coursePath: string, dir: string) => string;
}

async function defaultFetchJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

export const defaultResolverDeps: ResolverDeps = {
  findModule,
  loadQuiz,
  loadScreenSequence,
  loadLessonMarkdown,
  fetchJson: defaultFetchJson,
  moduleBaseUrl,
};

class NotFound extends Error {}

/** Split `a:b:c` at the LAST colon — the trailing segment is an index/id without colons. */
function splitLast(s: string): [string, string] | null {
  const i = s.lastIndexOf(':');
  return i > 0 && i < s.length - 1 ? [s.slice(0, i), s.slice(i + 1)] : null;
}

function sourceFor(loc: ModuleLocation, lesson?: { id: string; title: string }): ReviewItemSource {
  return {
    moduleId: loc.module.id,
    moduleTitle: loc.module.title,
    courseTitle: loc.course.title,
    lessonTitle: lesson?.title,
    href: lesson ? `/module/${loc.module.id}/lesson/${lesson.id}` : `/module/${loc.module.id}`,
  };
}

/** Map one checkpoint screen onto a review card; null for non-checkpoint screen types. */
export function cardFromScreen(screen: Screen): ReviewCardContent | null {
  switch (screen.type) {
    case 'tap-choice':
      return {
        kind: 'choice',
        prompt: screen.prompt,
        choices: screen.choices.map((c) => c.text),
        correct: [screen.correctIndex],
        multi: false,
        choiceFeedback: screen.choices.map((c) => c.feedback),
        explanation: screen.successFeedback,
      };
    case 'entry':
    case 'faded-step':
      return {
        kind: 'entry',
        prompt: screen.prompt,
        context: screen.type === 'faded-step' ? screen.worked : undefined,
        inputMode: screen.inputMode,
        answer: screen.answer,
        tolerance: screen.tolerance,
        unit: screen.unit,
        accept: screen.accept,
        caseSensitive: screen.caseSensitive,
        displayAnswer:
          screen.inputMode === 'numeric'
            ? screen.answer !== undefined
              ? `${screen.answer}${screen.unit ? ` ${screen.unit}` : ''}`
              : undefined
            : (displayTextAnswer(screen.accept) ?? undefined),
        explanation: screen.successFeedback,
      };
    case 'flash-recall':
      return { kind: 'recall', front: screen.front, back: screen.back };
    case 'sort-match':
      return {
        kind: 'match',
        prompt: screen.prompt,
        pairs: screen.pairs,
        explanation: screen.successFeedback,
      };
    default:
      return null;
  }
}

export function cardFromQuestion(q: Question): ReviewCardContent {
  switch (q.type) {
    case 'mcq':
      return {
        kind: 'choice',
        prompt: q.text,
        choices: q.choices,
        correct: [q.answer],
        multi: false,
        explanation: q.explanation,
      };
    case 'multi':
      return {
        kind: 'choice',
        prompt: q.text,
        choices: q.choices,
        correct: [...q.answers].sort((a, b) => a - b),
        multi: true,
        explanation: q.explanation,
      };
    case 'numeric':
      return {
        kind: 'entry',
        prompt: q.text,
        inputMode: 'numeric',
        answer: q.answer,
        tolerance: q.tolerance,
        unit: q.unit,
        displayAnswer: `${q.answer}${q.unit ? ` ${q.unit}` : ''}`,
        explanation: q.explanation,
      };
    case 'text':
      return {
        kind: 'entry',
        prompt: q.text,
        inputMode: 'text',
        accept: q.accept,
        caseSensitive: q.caseSensitive,
        displayAnswer: displayTextAnswer(q.accept) ?? undefined,
        explanation: q.explanation,
      };
  }
}

const QUIZ_WIDGET_SRC = /type="quiz"[^}]*?\bsrc="([^"]+)"/g;

async function resolveQuizItem(
  loc: ModuleLocation,
  quizId: string,
  questionId: string,
  deps: ResolverDeps,
): Promise<{ card: ReviewCardContent; source: ReviewItemSource }> {
  const { coursePath, moduleRef, module: mod } = loc;
  const find = (quiz: Quiz) =>
    quiz.id === quizId ? quiz.questions.find((q) => q.id === questionId) : undefined;

  if (mod.assessment) {
    const quiz = await deps.loadQuiz(coursePath, moduleRef.dir, mod.assessment.file);
    const q = find(quiz);
    if (q) return { card: cardFromQuestion(q), source: sourceFor(loc) };
  }
  for (const lesson of mod.lessons) {
    if (lesson.kind === 'screens' || lesson.kind === 'python') continue;
    const md = await deps.loadLessonMarkdown(coursePath, moduleRef.dir, lesson.file);
    const srcs = new Set([...md.matchAll(QUIZ_WIDGET_SRC)].map((m) => m[1]!.replace(/^\.\//, '')));
    for (const src of srcs) {
      if (src === mod.assessment?.file) continue; // already checked
      const q = find(await deps.loadQuiz(coursePath, moduleRef.dir, src));
      if (q) return { card: cardFromQuestion(q), source: sourceFor(loc, lesson) };
    }
  }
  throw new NotFound();
}

function parseDeck(data: unknown): { front: string; back: string }[] {
  const cards = (data as { cards?: unknown } | null)?.cards;
  if (!Array.isArray(cards)) throw new NotFound();
  return cards.filter(
    (c): c is { front: string; back: string } =>
      typeof c === 'object' &&
      c !== null &&
      typeof (c as { front?: unknown }).front === 'string' &&
      typeof (c as { back?: unknown }).back === 'string',
  );
}

async function resolveInner(
  loc: ModuleLocation,
  itemId: string,
  deps: ResolverDeps,
): Promise<{ card: ReviewCardContent; source: ReviewItemSource }> {
  const { coursePath, moduleRef, module: mod } = loc;

  if (itemId.startsWith('flashcards:')) {
    const parts = splitLast(itemId.slice('flashcards:'.length));
    if (!parts) throw new NotFound();
    const [src, indexStr] = parts;
    const url = deps.moduleBaseUrl(coursePath, moduleRef.dir) + src.replace(/^\.\//, '');
    const card = parseDeck(await deps.fetchJson(url))[Number(indexStr)];
    if (!card) throw new NotFound();
    return { card: { kind: 'recall', front: card.front, back: card.back }, source: sourceFor(loc) };
  }

  if (itemId.startsWith('screen:')) {
    const parts = splitLast(itemId.slice('screen:'.length));
    if (!parts) throw new NotFound();
    const [lessonId, screenId] = parts;
    const lesson = mod.lessons.find((l) => l.id === lessonId && l.kind === 'screens');
    if (!lesson) throw new NotFound();
    const seq = await deps.loadScreenSequence(coursePath, moduleRef.dir, lesson.file);
    const screen = seq.screens.find((s) => s.id === screenId);
    const card = screen ? cardFromScreen(screen) : null;
    if (!card) throw new NotFound();
    return { card, source: sourceFor(loc, lesson) };
  }

  const parts = splitLast(itemId);
  if (!parts) throw new NotFound();
  return resolveQuizItem(loc, parts[0], parts[1], deps);
}

/**
 * Resolve one queue row. Never throws: content that has been removed maps to
 * `missing: 'not-found'` (the UI offers to drop it from the queue); a
 * network/parse failure maps to `missing: 'load-error'` (the UI skips it for
 * this session but keeps it scheduled).
 */
export async function resolveReviewItem(
  moduleId: string,
  itemId: string,
  deps: ResolverDeps = defaultResolverDeps,
): Promise<ReviewItemResolution> {
  try {
    const loc = await deps.findModule(moduleId);
    if (!loc) return { moduleId, itemId, missing: true, reason: 'not-found' };
    const { card, source } = await resolveInner(loc, itemId, deps);
    return { moduleId, itemId, card, source };
  } catch (err) {
    return {
      moduleId,
      itemId,
      missing: true,
      reason: err instanceof NotFound ? 'not-found' : 'load-error',
    };
  }
}
