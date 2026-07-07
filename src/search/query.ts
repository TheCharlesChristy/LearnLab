// Dependency-free client-side ranking over the search index (D-022).
//
// Pure functions only — no fetch, no DOM — so this is trivial to unit test
// and keeps the "closed leaf subsystem" contract (SRS §3.5): SearchPage.tsx
// only ever imports from `../../search` (this file's barrel), never reaches
// into `query.ts`/`load-search-index.ts` directly.

import type { SearchIndex, SearchIndexLesson, SearchSubject } from './load-search-index';

export interface SearchResult {
  subject: SearchSubject;
  courseId: string;
  courseTitle: string;
  moduleId: string;
  moduleTitle: string;
  lessonId: string;
  lessonTitle: string;
  /** ~150 chars of `body`, centered on the first matched token, for display. */
  excerpt: string;
  score: number;
}

const TITLE_WEIGHT = 3;
const MODULE_OR_COURSE_TITLE_WEIGHT = 2;
const BODY_WEIGHT = 1;

/** ~150 chars total: `EXCERPT_RADIUS` either side of the match. */
const EXCERPT_RADIUS = 75;

function tokenize(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

/** Counts non-overlapping occurrences of `token` in the already-lowercased `haystack`. */
function countOccurrences(haystack: string, token: string): number {
  if (token.length === 0) return 0;
  let count = 0;
  let pos = 0;
  for (;;) {
    const idx = haystack.indexOf(token, pos);
    if (idx === -1) break;
    count += 1;
    pos = idx + token.length;
  }
  return count;
}

function scoreLesson(lesson: SearchIndexLesson, tokens: string[]): number {
  const titleLower = lesson.lessonTitle.toLowerCase();
  const moduleTitleLower = lesson.moduleTitle.toLowerCase();
  const courseTitleLower = lesson.courseTitle.toLowerCase();
  const bodyLower = lesson.body.toLowerCase();

  let score = 0;
  for (const token of tokens) {
    score += countOccurrences(titleLower, token) * TITLE_WEIGHT;
    score += countOccurrences(moduleTitleLower, token) * MODULE_OR_COURSE_TITLE_WEIGHT;
    score += countOccurrences(courseTitleLower, token) * MODULE_OR_COURSE_TITLE_WEIGHT;
    score += countOccurrences(bodyLower, token) * BODY_WEIGHT;
  }
  return score;
}

/** Builds a ~150-char excerpt of `body` centered on the first token match. */
function buildExcerpt(body: string, tokens: string[]): string {
  const bodyLower = body.toLowerCase();
  let matchIndex = -1;
  for (const token of tokens) {
    if (token.length === 0) continue;
    const idx = bodyLower.indexOf(token);
    if (idx !== -1 && (matchIndex === -1 || idx < matchIndex)) matchIndex = idx;
  }
  const center = matchIndex === -1 ? 0 : matchIndex;
  const start = Math.max(0, center - EXCERPT_RADIUS);
  const end = Math.min(body.length, center + EXCERPT_RADIUS);
  let excerpt = body.slice(start, end).trim();
  if (start > 0) excerpt = `…${excerpt}`;
  if (end < body.length) excerpt = `${excerpt}…`;
  return excerpt;
}

/**
 * Ranks `index.lessons` against `query` (D-022): case-insensitive whitespace
 * tokenization, then a token-occurrence count weighted by field (lessonTitle
 * ×3, moduleTitle/courseTitle ×2, body ×1). No fuzzy matching. Sorted by
 * score descending, ties broken alphabetically by lessonTitle, capped at
 * `limit`. An empty/whitespace-only query short-circuits to `[]`.
 */
export function searchLessons(index: SearchIndex, query: string, limit = 20): SearchResult[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const results: SearchResult[] = [];
  for (const lesson of index.lessons) {
    const score = scoreLesson(lesson, tokens);
    if (score <= 0) continue;
    results.push({
      subject: lesson.subject,
      courseId: lesson.courseId,
      courseTitle: lesson.courseTitle,
      moduleId: lesson.moduleId,
      moduleTitle: lesson.moduleTitle,
      lessonId: lesson.lessonId,
      lessonTitle: lesson.lessonTitle,
      excerpt: buildExcerpt(lesson.body, tokens),
      score,
    });
  }

  results.sort((a, b) => b.score - a.score || a.lessonTitle.localeCompare(b.lessonTitle));
  return results.slice(0, limit);
}
