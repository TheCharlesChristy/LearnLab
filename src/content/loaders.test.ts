// Tests for content loaders + dev-mode Ajv guards (SRS §5.2, §11).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Quiz } from '../quiz/types';
import {
  ContentLoadError,
  clearContentCache,
  contentUrl,
  findCourse,
  findModule,
  loadContentIndex,
  loadCourse,
  loadLessonMarkdown,
  loadModule,
  loadQuiz,
  moduleBaseUrl,
} from './index';
import type { ContentIndex, Course, Module } from './types';

// ---------------------------------------------------------------------------
// Fixtures (schema-valid — dev builds revalidate with Ajv, FR-CONT-003)
// ---------------------------------------------------------------------------

const contentIndex: ContentIndex = {
  schemaVersion: 1,
  generatedAt: '2026-06-11T09:00:00.000Z',
  subjects: [
    {
      id: 'maths',
      title: 'Mathematics',
      courses: [
        {
          id: 'alevel-pure',
          path: 'maths/alevel-pure',
          title: 'A-level Pure Mathematics',
          level: 'alevel',
          moduleCount: 1,
          totalEstMinutes: 45,
        },
        {
          id: 'shared-id',
          path: 'maths/shared-id',
          title: 'Maths course with shared id',
          level: 'gcse',
          moduleCount: 0,
          totalEstMinutes: 0,
        },
      ],
    },
    {
      id: 'physics',
      title: 'Physics',
      courses: [
        {
          id: 'gcse-physics',
          path: 'physics/gcse-physics',
          title: 'GCSE Physics',
          level: 'gcse',
          moduleCount: 1,
          totalEstMinutes: 30,
        },
        {
          id: 'shared-id',
          path: 'physics/shared-id',
          title: 'Physics course with shared id',
          level: 'gcse',
          moduleCount: 0,
          totalEstMinutes: 0,
        },
      ],
    },
  ],
};

const pureCourse: Course = {
  schemaVersion: 1,
  id: 'alevel-pure',
  title: 'A-level Pure Mathematics',
  subject: 'maths',
  level: 'alevel',
  description: 'Pure maths from first principles.',
  modules: [{ id: 'differentiation-1', dir: 'differentiation-1' }],
};

const physicsCourse: Course = {
  schemaVersion: 1,
  id: 'gcse-physics',
  title: 'GCSE Physics',
  subject: 'physics',
  level: 'gcse',
  description: 'Forces, energy and waves.',
  modules: [{ id: 'forces-1', dir: 'forces-1' }],
};

const sharedMaths: Course = {
  schemaVersion: 1,
  id: 'shared-id',
  title: 'Maths course with shared id',
  subject: 'maths',
  level: 'gcse',
  description: 'Duplicate-id course in maths.',
  modules: [],
};

const sharedPhysics: Course = {
  schemaVersion: 1,
  id: 'shared-id',
  title: 'Physics course with shared id',
  subject: 'physics',
  level: 'gcse',
  description: 'Duplicate-id course in physics.',
  modules: [],
};

const diffModule: Module = {
  schemaVersion: 1,
  id: 'differentiation-1',
  title: 'Differentiation 1',
  description: 'First steps in differentiation.',
  estMinutes: 45,
  prerequisites: [],
  objectives: ['Differentiate polynomials', 'Find stationary points'],
  lessons: [{ id: 'limits', title: 'Limits', file: '01-limits.md', estMinutes: 15 }],
  assessment: { file: 'assessment.json', passMark: 0.7 },
  version: '1.0.0',
  authors: ['LearnLab'],
};

const forcesModule: Module = {
  schemaVersion: 1,
  id: 'forces-1',
  title: 'Forces 1',
  description: 'Newtonian forces.',
  estMinutes: 30,
  prerequisites: [],
  objectives: ['State Newton’s laws', 'Resolve forces'],
  lessons: [{ id: 'newton', title: 'Newton', file: '01-newton.md', estMinutes: 10 }],
  version: '1.0.0',
  authors: ['LearnLab'],
};

const quiz: Quiz = {
  schemaVersion: 1,
  id: 'differentiation-1-assessment',
  title: 'Differentiation 1 assessment',
  questions: [
    {
      type: 'mcq',
      id: 'q1',
      text: 'd/dx of $x^2$?',
      choices: ['$2x$', '$x$'],
      answer: 0,
      explanation: 'Power rule.',
    },
  ],
};

// ---------------------------------------------------------------------------
// fetch mock — routes URL → JSON body or markdown string; 404 otherwise.
// ---------------------------------------------------------------------------

const routes = new Map<string, unknown>();
let fetchMock: ReturnType<typeof vi.fn>;

function makeResponse(url: string): Response {
  if (!routes.has(url)) {
    return {
      ok: false,
      status: 404,
      json: () => Promise.reject(new Error('not json')),
      text: () => Promise.resolve('not found'),
    } as unknown as Response;
  }
  const body = routes.get(url);
  return {
    ok: true,
    status: 200,
    json: () =>
      typeof body === 'string'
        ? Promise.resolve(JSON.parse(body) as unknown)
        : Promise.resolve(body),
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
  } as unknown as Response;
}

function routeAll(): void {
  routes.set('/content/index.json', contentIndex);
  routes.set('/content/maths/alevel-pure/course.json', pureCourse);
  routes.set('/content/maths/shared-id/course.json', sharedMaths);
  routes.set('/content/physics/gcse-physics/course.json', physicsCourse);
  routes.set('/content/physics/shared-id/course.json', sharedPhysics);
  routes.set('/content/maths/alevel-pure/differentiation-1/module.json', diffModule);
  routes.set('/content/physics/gcse-physics/forces-1/module.json', forcesModule);
  routes.set('/content/maths/alevel-pure/differentiation-1/01-limits.md', '# Limits\n\nHello.');
  routes.set('/content/maths/alevel-pure/differentiation-1/assessment.json', quiz);
}

async function expectContentLoadError(promise: Promise<unknown>): Promise<ContentLoadError> {
  let caught: unknown;
  try {
    await promise;
  } catch (err) {
    caught = err;
  }
  expect(caught).toBeInstanceOf(ContentLoadError);
  return caught as ContentLoadError;
}

beforeEach(() => {
  routes.clear();
  routeAll();
  fetchMock = vi.fn((input: RequestInfo | URL) => Promise.resolve(makeResponse(String(input))));
  vi.stubGlobal('fetch', fetchMock);
  clearContentCache();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

// ---------------------------------------------------------------------------
// URL helpers (FR-CONT-002)
// ---------------------------------------------------------------------------

describe('contentUrl / moduleBaseUrl', () => {
  it('builds URLs relative to BASE_URL + content/', () => {
    expect(contentUrl('index.json')).toBe(import.meta.env.BASE_URL + 'content/index.json');
    expect(contentUrl('maths/alevel-pure/course.json')).toBe(
      import.meta.env.BASE_URL + 'content/maths/alevel-pure/course.json',
    );
  });

  it('moduleBaseUrl ends with a trailing slash (LessonContext contract)', () => {
    const url = moduleBaseUrl('maths/alevel-pure', 'differentiation-1');
    expect(url).toBe(import.meta.env.BASE_URL + 'content/maths/alevel-pure/differentiation-1/');
    expect(url.endsWith('/')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Happy paths
// ---------------------------------------------------------------------------

describe('loaders — happy paths', () => {
  it('loadContentIndex returns the parsed index', async () => {
    const index = await loadContentIndex();
    expect(index.subjects.map((s) => s.id)).toEqual(['maths', 'physics']);
    expect(fetchMock).toHaveBeenCalledWith('/content/index.json');
  });

  it('loadCourse fetches <coursePath>/course.json', async () => {
    const course = await loadCourse('maths/alevel-pure');
    expect(course.id).toBe('alevel-pure');
    expect(fetchMock).toHaveBeenCalledWith('/content/maths/alevel-pure/course.json');
  });

  it('loadModule fetches <coursePath>/<dir>/module.json', async () => {
    const module = await loadModule('maths/alevel-pure', 'differentiation-1');
    expect(module.id).toBe('differentiation-1');
    expect(module.lessons).toHaveLength(1);
  });

  it('loadLessonMarkdown returns raw markdown text', async () => {
    const md = await loadLessonMarkdown('maths/alevel-pure', 'differentiation-1', '01-limits.md');
    expect(md).toBe('# Limits\n\nHello.');
  });

  it('loadQuiz returns the parsed quiz', async () => {
    const q = await loadQuiz('maths/alevel-pure', 'differentiation-1', 'assessment.json');
    expect(q.id).toBe('differentiation-1-assessment');
    expect(q.questions[0]?.type).toBe('mcq');
  });
});

// ---------------------------------------------------------------------------
// Caching
// ---------------------------------------------------------------------------

describe('caching', () => {
  it('caches JSON per URL — fetch called once across repeat + concurrent loads', async () => {
    const [a, b] = await Promise.all([loadContentIndex(), loadContentIndex()]);
    const c = await loadContentIndex();
    expect(a).toBe(b);
    expect(a).toBe(c);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('caches markdown per URL', async () => {
    await loadLessonMarkdown('maths/alevel-pure', 'differentiation-1', '01-limits.md');
    await loadLessonMarkdown('maths/alevel-pure', 'differentiation-1', '01-limits.md');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('clearContentCache forces a refetch', async () => {
    await loadCourse('maths/alevel-pure');
    clearContentCache();
    await loadCourse('maths/alevel-pure');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not cache failures — retry refetches (FR-CONT-007)', async () => {
    routes.delete('/content/maths/alevel-pure/course.json');
    await expectContentLoadError(loadCourse('maths/alevel-pure'));
    routes.set('/content/maths/alevel-pure/course.json', pureCourse);
    const course = await loadCourse('maths/alevel-pure');
    expect(course.id).toBe('alevel-pure');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// Fetch errors (FR-CONT-007)
// ---------------------------------------------------------------------------

describe('fetch errors', () => {
  it('non-OK status → ContentLoadError kind fetch with url + status', async () => {
    const err = await expectContentLoadError(loadCourse('maths/missing'));
    expect(err.kind).toBe('fetch');
    expect(err.url).toBe('/content/maths/missing/course.json');
    expect(err.status).toBe(404);
  });

  it('network rejection → ContentLoadError kind fetch without status', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('offline'));
    const err = await expectContentLoadError(loadContentIndex());
    expect(err.kind).toBe('fetch');
    expect(err.url).toBe('/content/index.json');
    expect(err.status).toBeUndefined();
  });

  it('markdown fetch failure carries the lesson URL', async () => {
    const err = await expectContentLoadError(
      loadLessonMarkdown('maths/alevel-pure', 'differentiation-1', '99-nope.md'),
    );
    expect(err.kind).toBe('fetch');
    expect(err.url).toBe('/content/maths/alevel-pure/differentiation-1/99-nope.md');
  });

  it('malformed JSON body → retryable fetch error', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.reject(new SyntaxError('Unexpected token')),
      text: () => Promise.resolve('{oops'),
    } as unknown as Response);
    const err = await expectContentLoadError(loadContentIndex());
    expect(err.kind).toBe('fetch');
  });
});

// ---------------------------------------------------------------------------
// Dev-mode Ajv validation (FR-CONT-003)
// ---------------------------------------------------------------------------

describe('dev-mode schema validation', () => {
  it('invalid course.json → kind validation with JSON-pointer error list', async () => {
    // Invalid: bad subject enum, missing description, extra property.
    routes.set('/content/maths/alevel-pure/course.json', {
      schemaVersion: 1,
      id: 'alevel-pure',
      title: 'A-level Pure Mathematics',
      subject: 'astrology',
      level: 'alevel',
      modules: [],
      bogus: true,
    });
    const err = await expectContentLoadError(loadCourse('maths/alevel-pure'));
    expect(err.kind).toBe('validation');
    expect(err.url).toBe('/content/maths/alevel-pure/course.json');
    expect(err.errors).toBeDefined();
    expect(err.errors!.length).toBeGreaterThanOrEqual(3); // allErrors
    for (const e of err.errors!) {
      expect(typeof e.pointer).toBe('string');
      expect(e.message.length).toBeGreaterThan(0);
    }
    expect(err.errors!.some((e) => e.pointer === '/subject')).toBe(true);
    expect(err.errors!.some((e) => e.message.includes('description'))).toBe(true);
  });

  it('invalid index, module and quiz files are also rejected', async () => {
    routes.set('/content/index.json', { schemaVersion: 1, subjects: [] }); // missing generatedAt
    routes.set('/content/maths/alevel-pure/differentiation-1/module.json', {
      ...diffModule,
      objectives: ['only one'], // minItems 2
    });
    routes.set('/content/maths/alevel-pure/differentiation-1/assessment.json', {
      ...quiz,
      questions: [],
    }); // minItems 1
    expect((await expectContentLoadError(loadContentIndex())).kind).toBe('validation');
    expect(
      (await expectContentLoadError(loadModule('maths/alevel-pure', 'differentiation-1'))).kind,
    ).toBe('validation');
    expect(
      (
        await expectContentLoadError(
          loadQuiz('maths/alevel-pure', 'differentiation-1', 'assessment.json'),
        )
      ).kind,
    ).toBe('validation');
  });

  it('prod builds skip Ajv validation (FR-CONT-003: CI guarantees validity)', async () => {
    vi.stubEnv('DEV', false);
    routes.set('/content/maths/alevel-pure/course.json', {
      schemaVersion: 1,
      id: 'alevel-pure',
      subject: 'astrology', // invalid, but prod must not validate
    });
    const course = await loadCourse('maths/alevel-pure');
    expect(course.subject).toBe('astrology');
  });
});

// ---------------------------------------------------------------------------
// schemaVersion compatibility (NFR-MAINT-002)
// ---------------------------------------------------------------------------

describe('schemaVersion guard', () => {
  it('schemaVersion 2 → actionable validation error', async () => {
    routes.set('/content/maths/alevel-pure/course.json', { ...pureCourse, schemaVersion: 2 });
    const err = await expectContentLoadError(loadCourse('maths/alevel-pure'));
    expect(err.kind).toBe('validation');
    expect(err.message).toMatch(/newer LearnLab/i);
    expect(err.message).toMatch(/refresh|update/i);
    expect(err.errors?.[0]?.pointer).toBe('/schemaVersion');
  });

  it('guards even when prod validation is skipped', async () => {
    vi.stubEnv('DEV', false);
    routes.set('/content/index.json', { ...contentIndex, schemaVersion: 3 });
    const err = await expectContentLoadError(loadContentIndex());
    expect(err.kind).toBe('validation');
    expect(err.message).toMatch(/newer LearnLab/i);
  });
});

// ---------------------------------------------------------------------------
// findModule / findCourse
// ---------------------------------------------------------------------------

describe('findModule', () => {
  it('resolves a module in a later subject, in catalogue order', async () => {
    const loc = await findModule('forces-1');
    expect(loc).not.toBeNull();
    expect(loc!.subjectId).toBe('physics');
    expect(loc!.coursePath).toBe('physics/gcse-physics');
    expect(loc!.course.id).toBe('gcse-physics');
    expect(loc!.moduleRef).toEqual({ id: 'forces-1', dir: 'forces-1' });
    expect(loc!.module.title).toBe('Forces 1');
  });

  it('returns null for an unknown module after scanning all courses', async () => {
    expect(await findModule('no-such-module')).toBeNull();
    // Walked the index and all four course.json files.
    expect(fetchMock).toHaveBeenCalledWith('/content/maths/alevel-pure/course.json');
    expect(fetchMock).toHaveBeenCalledWith('/content/physics/shared-id/course.json');
  });

  it('caches lookups — repeat calls do not refetch', async () => {
    const first = await findModule('differentiation-1');
    const callsAfterFirst = fetchMock.mock.calls.length;
    const second = await findModule('differentiation-1');
    expect(second).toBe(first);
    expect(fetchMock.mock.calls.length).toBe(callsAfterFirst);
    // Negative results are cached too.
    await findModule('no-such-module');
    const callsAfterMiss = fetchMock.mock.calls.length;
    await findModule('no-such-module');
    expect(fetchMock.mock.calls.length).toBe(callsAfterMiss);
  });
});

describe('findCourse (D-005)', () => {
  it('finds a course and its subject', async () => {
    const hit = await findCourse('gcse-physics');
    expect(hit).not.toBeNull();
    expect(hit!.subjectId).toBe('physics');
    expect(hit!.ref.path).toBe('physics/gcse-physics');
  });

  it('takes the first match in catalogue order when ids collide', async () => {
    const hit = await findCourse('shared-id');
    expect(hit!.subjectId).toBe('maths');
    expect(hit!.ref.path).toBe('maths/shared-id');
  });

  it('returns null for an unknown course id', async () => {
    expect(await findCourse('no-such-course')).toBeNull();
  });
});
