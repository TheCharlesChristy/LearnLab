// Tests for the search-index loader (D-022): mirrors src/content/loaders.ts's
// fetch/cache/error-handling contract test-for-test.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  SearchIndexLoadError,
  clearSearchIndexCache,
  loadSearchIndex,
  searchIndexUrl,
} from './load-search-index';
import type { SearchIndex } from './load-search-index';

const validIndex: SearchIndex = {
  schemaVersion: 1,
  generatedAt: '2026-07-01T00:00:00.000Z',
  lessons: [
    {
      subject: 'maths',
      courseId: 'alevel-pure',
      courseTitle: 'A-level Pure Mathematics',
      moduleId: 'differentiation-1',
      moduleTitle: 'Differentiation 1',
      lessonId: '01-limits',
      lessonTitle: 'Limits',
      body: 'An introduction to limits.',
    },
  ],
};

let fetchMock: ReturnType<typeof vi.fn>;

function makeJsonResponse(body: unknown, init?: { ok?: boolean; status?: number }): Response {
  const ok = init?.ok ?? true;
  const status = init?.status ?? (ok ? 200 : 500);
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

beforeEach(() => {
  clearSearchIndexCache();
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  clearSearchIndexCache();
});

describe('searchIndexUrl', () => {
  it('is relative to BASE_URL + content/', () => {
    expect(searchIndexUrl()).toBe(`${import.meta.env.BASE_URL}content/search-index.json`);
  });
});

describe('loadSearchIndex — happy path', () => {
  it('fetches and returns the parsed index', async () => {
    vi.stubEnv('DEV', false);
    fetchMock = vi.fn(() => Promise.resolve(makeJsonResponse(validIndex)));
    vi.stubGlobal('fetch', fetchMock);

    const result = await loadSearchIndex();
    expect(result.lessons).toHaveLength(1);
    expect(result.lessons[0]?.lessonId).toBe('01-limits');
    expect(fetchMock).toHaveBeenCalledWith(searchIndexUrl());
  });

  it('caches successful loads (fetch called once across repeat calls)', async () => {
    vi.stubEnv('DEV', false);
    fetchMock = vi.fn(() => Promise.resolve(makeJsonResponse(validIndex)));
    vi.stubGlobal('fetch', fetchMock);

    await loadSearchIndex();
    await loadSearchIndex();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('loadSearchIndex — error paths', () => {
  it('throws a fetch-kind error on a network failure', async () => {
    fetchMock = vi.fn(() => Promise.reject(new Error('offline')));
    vi.stubGlobal('fetch', fetchMock);

    await expect(loadSearchIndex()).rejects.toBeInstanceOf(SearchIndexLoadError);
    await loadSearchIndex().catch((err: unknown) => {
      expect((err as SearchIndexLoadError).kind).toBe('fetch');
    });
  });

  it('throws a fetch-kind error on a non-2xx response', async () => {
    fetchMock = vi.fn(() => Promise.resolve(makeJsonResponse(null, { ok: false, status: 404 })));
    vi.stubGlobal('fetch', fetchMock);

    let caught: unknown;
    try {
      await loadSearchIndex();
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(SearchIndexLoadError);
    expect((caught as SearchIndexLoadError).kind).toBe('fetch');
    expect((caught as SearchIndexLoadError).status).toBe(404);
  });

  it('throws a fetch-kind error on malformed JSON', async () => {
    fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('bad json')),
        text: () => Promise.resolve('not json'),
      } as unknown as Response),
    );
    vi.stubGlobal('fetch', fetchMock);

    let caught: unknown;
    try {
      await loadSearchIndex();
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(SearchIndexLoadError);
    expect((caught as SearchIndexLoadError).kind).toBe('fetch');
  });

  it('throws a validation-kind error for a schemaVersion newer than supported', async () => {
    vi.stubEnv('DEV', false);
    fetchMock = vi.fn(() =>
      Promise.resolve(makeJsonResponse({ ...validIndex, schemaVersion: 2 })),
    );
    vi.stubGlobal('fetch', fetchMock);

    let caught: unknown;
    try {
      await loadSearchIndex();
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(SearchIndexLoadError);
    expect((caught as SearchIndexLoadError).kind).toBe('validation');
  });

  it('does not cache a failed load, so a retry can succeed', async () => {
    fetchMock = vi
      .fn()
      .mockResolvedValueOnce(makeJsonResponse(null, { ok: false, status: 500 }))
      .mockResolvedValueOnce(makeJsonResponse(validIndex));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('DEV', false);

    await expect(loadSearchIndex()).rejects.toBeInstanceOf(SearchIndexLoadError);
    const result = await loadSearchIndex();
    expect(result.lessons).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('loadSearchIndex — dev-mode Ajv validation', () => {
  it('rejects a payload that fails the search-index schema in dev builds', async () => {
    vi.stubEnv('DEV', true);
    fetchMock = vi.fn(() =>
      Promise.resolve(makeJsonResponse({ schemaVersion: 1, generatedAt: 'x', lessons: 'nope' })),
    );
    vi.stubGlobal('fetch', fetchMock);

    let caught: unknown;
    try {
      await loadSearchIndex();
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(SearchIndexLoadError);
    expect((caught as SearchIndexLoadError).kind).toBe('validation');
  });

  it('accepts a schema-valid payload in dev builds', async () => {
    vi.stubEnv('DEV', true);
    fetchMock = vi.fn(() => Promise.resolve(makeJsonResponse(validIndex)));
    vi.stubGlobal('fetch', fetchMock);

    const result = await loadSearchIndex();
    expect(result.lessons).toHaveLength(1);
  });
});
