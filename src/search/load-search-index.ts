// Loader for content/search-index.json (D-022, SRS §13 roadmap).
//
// Mirrors src/content/loaders.ts's fetch/cache/error-handling contract
// exactly, so the two loaders behave identically in dev, prod and under the
// PWA's base path:
// - URLs are relative to `import.meta.env.BASE_URL + 'content/'`.
// - A failed fetch (network error or non-2xx) throws SearchIndexLoadError
//   with kind 'fetch' so callers can render the shared retry-card UI.
// - Malformed JSON is treated as a broken/partial transfer (kind 'fetch').
// - schemaVersion is checked (NFR-MAINT-002): a newer schemaVersion than this
//   reader understands fails loudly instead of silently misbehaving.
// - Successful loads are cached in memory for the session (the index is
//   static content); failed loads are never cached, so retries refetch.
// - In dev builds the payload is revalidated against the pinned Ajv schema
//   (FR-CONT-003's pattern); prod builds skip runtime validation since CI
//   guarantees validity.

import type { ValidateFunction } from 'ajv';

/** The schemaVersion this reader understands (NFR-MAINT-002). */
const SUPPORTED_SCHEMA_VERSION = 1;

export type SearchSubject = 'maths' | 'physics' | 'cs' | 'ai';

/** One lesson's searchable text, as emitted by scripts/build-content.mjs. */
export interface SearchIndexLesson {
  subject: SearchSubject;
  courseId: string;
  courseTitle: string;
  moduleId: string;
  moduleTitle: string;
  lessonId: string;
  lessonTitle: string;
  /** Plain text — directive/markdown syntax already stripped at build time. */
  body: string;
}

/** content/search-index.json (generated — never hand-edited). */
export interface SearchIndex {
  schemaVersion: 1;
  generatedAt: string; // ISO 8601
  lessons: SearchIndexLesson[];
}

export class SearchIndexLoadError extends Error {
  kind: 'fetch' | 'validation';
  url: string;
  status?: number;
  errors?: { pointer: string; message: string }[];

  constructor(
    message: string,
    options: {
      kind: 'fetch' | 'validation';
      url: string;
      status?: number;
      errors?: { pointer: string; message: string }[];
    },
  ) {
    super(message);
    this.name = 'SearchIndexLoadError';
    this.kind = options.kind;
    this.url = options.url;
    if (options.status !== undefined) this.status = options.status;
    if (options.errors !== undefined) this.errors = options.errors;
  }
}

// ---------------------------------------------------------------------------
// URL helper (FR-CONT-002's convention)
// ---------------------------------------------------------------------------

export function searchIndexUrl(): string {
  return import.meta.env.BASE_URL + 'content/search-index.json';
}

// ---------------------------------------------------------------------------
// In-memory cache — one fetch per session, cleared for tests / hot reload.
// ---------------------------------------------------------------------------

let cached: Promise<SearchIndex> | null = null;

/** Empties the loader cache (tests + dev hot reload). */
export function clearSearchIndexCache(): void {
  cached = null;
}

// ---------------------------------------------------------------------------
// Dev-only Ajv revalidation (mirrors FR-CONT-003)
// ---------------------------------------------------------------------------

let devValidatorPromise: Promise<ValidateFunction> | null = null;

function getDevValidator(): Promise<ValidateFunction> {
  devValidatorPromise ??= (async () => {
    // Dynamic imports inside this dev-gated function keep Ajv and the schema
    // JSON out of the production bundle (NFR-PERF-001): the only call site is
    // behind `if (import.meta.env.DEV)`, which Vite dead-code-eliminates.
    const [ajvModule, formatsModule, schema] = await Promise.all([
      import('ajv/dist/2020'),
      import('ajv-formats'),
      import('../../schemas/search-index.schema.json'),
    ]);
    const Ajv2020 = ajvModule.default;
    const addFormats = formatsModule.default;
    const ajv = new Ajv2020({ allErrors: true });
    addFormats(ajv);
    return ajv.compile(schema.default);
  })();
  return devValidatorPromise;
}

async function devValidate(data: unknown, url: string): Promise<void> {
  const validate = await getDevValidator();
  if (!validate(data)) {
    const errors = (validate.errors ?? []).map((e) => ({
      pointer: e.instancePath,
      message: e.message ?? 'is invalid',
    }));
    throw new SearchIndexLoadError(
      `${url} failed search-index schema validation (${errors.length} error${errors.length === 1 ? '' : 's'})`,
      { kind: 'validation', url, errors },
    );
  }
}

/** NFR-MAINT-002: accept equal versions, fail loudly on unknown newer ones. */
function checkSchemaVersion(data: unknown, url: string): void {
  if (data === null || typeof data !== 'object' || !('schemaVersion' in data)) return;
  const version = (data as { schemaVersion: unknown }).schemaVersion;
  if (typeof version === 'number' && version > SUPPORTED_SCHEMA_VERSION) {
    throw new SearchIndexLoadError(
      `${url} has schemaVersion ${version}, but this version of LearnLab only understands ` +
        `schemaVersion ${SUPPORTED_SCHEMA_VERSION}. This content requires a newer LearnLab — ` +
        `refresh the page to update the app (or update your installation).`,
      {
        kind: 'validation',
        url,
        errors: [
          {
            pointer: '/schemaVersion',
            message: `unsupported newer schemaVersion ${version} (reader supports ${SUPPORTED_SCHEMA_VERSION})`,
          },
        ],
      },
    );
  }
}

async function fetchOk(url: string): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new SearchIndexLoadError(`Failed to fetch ${url} (network error)`, {
      kind: 'fetch',
      url,
    });
  }
  if (!res.ok) {
    throw new SearchIndexLoadError(`Failed to fetch ${url} (HTTP ${res.status})`, {
      kind: 'fetch',
      url,
      status: res.status,
    });
  }
  return res;
}

/** Fetches and (in dev) validates content/search-index.json (D-022). */
export function loadSearchIndex(): Promise<SearchIndex> {
  if (cached) return cached;
  const url = searchIndexUrl();
  const pending = (async () => {
    const res = await fetchOk(url);
    let data: unknown;
    try {
      data = await res.json();
    } catch {
      // Malformed JSON from a static host is a broken/partial transfer:
      // surface it as a retryable fetch error, matching loadJson's contract.
      throw new SearchIndexLoadError(`Failed to fetch ${url} (response is not valid JSON)`, {
        kind: 'fetch',
        url,
      });
    }
    checkSchemaVersion(data, url);
    if (import.meta.env.DEV) {
      await devValidate(data, url);
    }
    return data as SearchIndex;
  })().catch((err: unknown) => {
    // Never cache failures: retries must be able to refetch.
    cached = null;
    throw err;
  });
  cached = pending;
  return pending;
}
