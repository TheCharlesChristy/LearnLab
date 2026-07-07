// Tests for the pure ranking function (D-022).
import { describe, expect, it } from 'vitest';

import type { SearchIndex } from './load-search-index';
import { searchLessons } from './query';

const index: SearchIndex = {
  schemaVersion: 1,
  generatedAt: '2026-07-01T00:00:00.000Z',
  lessons: [
    {
      subject: 'maths',
      courseId: 'alevel-pure',
      courseTitle: 'A-level Pure Mathematics',
      moduleId: 'quadratics',
      moduleTitle: 'Quadratics',
      lessonId: 'quadratic-formula',
      lessonTitle: 'The quadratic formula',
      body: 'This lesson derives the quadratic formula by completing the square. The quadratic formula solves ax^2 + bx + c = 0.',
    },
    {
      subject: 'physics',
      courseId: 'gcse-physics',
      courseTitle: 'GCSE Physics',
      moduleId: 'waves',
      moduleTitle: 'Waves',
      lessonId: 'wave-equation',
      lessonTitle: 'The wave equation',
      body: 'Waves transfer energy without transferring matter. This lesson has nothing to do with the quadratic formula, but mentions quadratic once in passing.',
    },
    {
      subject: 'cs',
      courseId: 'alevel-cs',
      courseTitle: 'A-level Computer Science',
      moduleId: 'algorithms-1-search-sort',
      moduleTitle: 'Searching and Sorting',
      lessonId: 'binary-search',
      lessonTitle: 'Binary search',
      body: 'Binary search repeatedly halves a sorted array to find a target value in logarithmic time.',
    },
    {
      subject: 'ai',
      courseId: 'ai-foundations',
      courseTitle: 'AI Foundations',
      moduleId: 'what-is-ai',
      moduleTitle: 'What is AI?',
      lessonId: 'intro',
      lessonTitle: 'Introduction',
      body: 'An introduction to artificial intelligence with no relevant keywords in it at all.',
    },
  ],
};

describe('searchLessons', () => {
  it('returns [] for an empty query', () => {
    expect(searchLessons(index, '')).toEqual([]);
  });

  it('returns [] for a whitespace-only query', () => {
    expect(searchLessons(index, '   \t  ')).toEqual([]);
  });

  it('returns [] when nothing matches', () => {
    expect(searchLessons(index, 'nonexistentxyz')).toEqual([]);
  });

  it('is case-insensitive', () => {
    const lower = searchLessons(index, 'quadratic');
    const upper = searchLessons(index, 'QUADRATIC');
    expect(upper.map((r) => r.lessonId)).toEqual(lower.map((r) => r.lessonId));
    expect(lower.length).toBeGreaterThan(0);
  });

  it('ranks a lessonTitle match above a body-only match', () => {
    const results = searchLessons(index, 'quadratic');
    // "The quadratic formula" matches in the title (×3) and repeatedly in the
    // body; the wave-equation lesson only matches "quadratic" once in the body.
    expect(results[0]?.lessonId).toBe('quadratic-formula');
    expect(results[0]?.score).toBeGreaterThan(results[1]?.score ?? -Infinity);
    expect(results.map((r) => r.lessonId)).toContain('wave-equation');
  });

  it('includes only lessons with at least one token match', () => {
    const results = searchLessons(index, 'quadratic');
    expect(results.map((r) => r.lessonId)).not.toContain('intro');
    expect(results.map((r) => r.lessonId)).not.toContain('binary-search');
  });

  it('matches on module/course titles too', () => {
    const results = searchLessons(index, 'searching');
    expect(results.map((r) => r.lessonId)).toContain('binary-search');
  });

  it('respects the limit and still returns highest scores first', () => {
    const results = searchLessons(index, 'a', 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('breaks score ties alphabetically by lessonTitle', () => {
    const tiny: SearchIndex = {
      schemaVersion: 1,
      generatedAt: '2026-07-01T00:00:00.000Z',
      lessons: [
        {
          subject: 'maths',
          courseId: 'c',
          courseTitle: 'Course',
          moduleId: 'm',
          moduleTitle: 'Module',
          lessonId: 'zzz',
          lessonTitle: 'Zebra lesson about foo',
          body: 'foo',
        },
        {
          subject: 'maths',
          courseId: 'c',
          courseTitle: 'Course',
          moduleId: 'm',
          moduleTitle: 'Module',
          lessonId: 'aaa',
          lessonTitle: 'Apple lesson about foo',
          body: 'foo',
        },
      ],
    };
    const results = searchLessons(tiny, 'foo');
    expect(results.map((r) => r.lessonId)).toEqual(['aaa', 'zzz']);
  });

  it('builds an excerpt centered on the first body match', () => {
    const results = searchLessons(index, 'formula');
    const top = results.find((r) => r.lessonId === 'quadratic-formula');
    expect(top).toBeDefined();
    expect(top?.excerpt.toLowerCase()).toContain('formula');
    expect(top?.excerpt.length).toBeLessThanOrEqual(160);
  });

  it('handles multi-token queries by summing per-token scores', () => {
    const results = searchLessons(index, 'quadratic formula');
    expect(results[0]?.lessonId).toBe('quadratic-formula');
  });
});
