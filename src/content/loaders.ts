// Content loaders — SRS §5.2.
//
// - FR-CONT-001: `loadContentIndex` fetches `content/index.json`; the
//   catalogue renders from it alone.
// - FR-CONT-002: all content fetches are lazy and relative to
//   `import.meta.env.BASE_URL + 'content/'`.
// - FR-CONT-003: in dev builds every loaded JSON is revalidated with Ajv
//   (allErrors); prod builds skip runtime validation entirely (CI guarantees
//   validity). Ajv, ajv-formats and the schema JSONs are loaded via dynamic
//   import inside the dev-only branch so no Ajv bytes reach the prod bundle
//   (NFR-PERF-001).
// - FR-CONT-007: fetch failures throw ContentLoadError (kind 'fetch') so the
//   shell can render retry cards; failed loads are not cached, so retrying
//   refetches.
// - NFR-MAINT-002: files with `schemaVersion` newer than this reader fail
//   loudly with an actionable message, in dev and prod alike.

import type { ValidateFunction } from 'ajv';

import type { Quiz } from '../quiz/types';
import type { ScreenSequence } from '../screens/types';
import type { ContentIndex, Course, Module, ModuleRef, SubjectId, CourseRef } from './types';

/** The schemaVersion this reader understands (NFR-MAINT-002). */
const SUPPORTED_SCHEMA_VERSION = 1;

export class ContentLoadError extends Error {
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
    this.name = 'ContentLoadError';
    this.kind = options.kind;
    this.url = options.url;
    if (options.status !== undefined) this.status = options.status;
    if (options.errors !== undefined) this.errors = options.errors;
  }
}

// ---------------------------------------------------------------------------
// URL helpers (FR-CONT-002)
// ---------------------------------------------------------------------------

export function contentUrl(rel: string): string {
  return import.meta.env.BASE_URL + 'content/' + rel;
}

export function moduleBaseUrl(coursePath: string, dir: string): string {
  return contentUrl(`${coursePath}/${dir}/`);
}

// ---------------------------------------------------------------------------
// In-memory cache — content is static, so one fetch per URL per session.
// ---------------------------------------------------------------------------

const urlCache = new Map<string, Promise<unknown>>();
const moduleLocationCache = new Map<string, ModuleLocation | null>();

/** Empties all loader caches (tests + dev hot reload). */
export function clearContentCache(): void {
  urlCache.clear();
  moduleLocationCache.clear();
}

function cached<T>(url: string, produce: () => Promise<T>): Promise<T> {
  const hit = urlCache.get(url);
  if (hit !== undefined) return hit as Promise<T>;
  const pending = produce().catch((err: unknown) => {
    // Never cache failures: FR-CONT-007 retry cards must be able to refetch.
    urlCache.delete(url);
    throw err;
  });
  urlCache.set(url, pending);
  return pending;
}

// ---------------------------------------------------------------------------
// Fetch + parse
// ---------------------------------------------------------------------------

async function fetchOk(url: string): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new ContentLoadError(`Failed to fetch ${url} (network error)`, { kind: 'fetch', url });
  }
  if (!res.ok) {
    throw new ContentLoadError(`Failed to fetch ${url} (HTTP ${res.status})`, {
      kind: 'fetch',
      url,
      status: res.status,
    });
  }
  return res;
}

/** NFR-MAINT-002: accept equal versions, fail loudly on unknown newer ones. */
function checkSchemaVersion(data: unknown, url: string): void {
  if (data === null || typeof data !== 'object' || !('schemaVersion' in data)) return;
  const version = (data as { schemaVersion: unknown }).schemaVersion;
  if (typeof version === 'number' && version > SUPPORTED_SCHEMA_VERSION) {
    throw new ContentLoadError(
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

// ---------------------------------------------------------------------------
// Dev-only Ajv revalidation (FR-CONT-003)
// ---------------------------------------------------------------------------

type SchemaKind = 'content-index' | 'course' | 'module' | 'quiz' | 'screen-sequence';

let devValidatorsPromise: Promise<Record<SchemaKind, ValidateFunction>> | null = null;

function getDevValidators(): Promise<Record<SchemaKind, ValidateFunction>> {
  devValidatorsPromise ??= (async () => {
    // Dynamic imports inside this dev-gated function keep Ajv and the schema
    // JSONs out of the production bundle (NFR-PERF-001): the only call site is
    // behind `if (import.meta.env.DEV)`, which Vite dead-code-eliminates.
    const [
      ajvModule,
      formatsModule,
      indexSchema,
      courseSchema,
      moduleSchema,
      quizSchema,
      screenSequenceSchema,
    ] = await Promise.all([
      import('ajv/dist/2020'),
      import('ajv-formats'),
      import('../../schemas/content-index.schema.json'),
      import('../../schemas/course.schema.json'),
      import('../../schemas/module.schema.json'),
      import('../../schemas/quiz.schema.json'),
      import('../../schemas/screen-sequence.schema.json'),
    ]);
    const Ajv2020 = ajvModule.default;
    const addFormats = formatsModule.default;
    const ajv = new Ajv2020({ allErrors: true, discriminator: true });
    addFormats(ajv);
    return {
      'content-index': ajv.compile(indexSchema.default),
      course: ajv.compile(courseSchema.default),
      module: ajv.compile(moduleSchema.default),
      quiz: ajv.compile(quizSchema.default),
      'screen-sequence': ajv.compile(screenSequenceSchema.default),
    };
  })();
  return devValidatorsPromise;
}

async function devValidate(data: unknown, schemaKind: SchemaKind, url: string): Promise<void> {
  const validators = await getDevValidators();
  const validate = validators[schemaKind];
  if (!validate(data)) {
    const errors = (validate.errors ?? []).map((e) => ({
      pointer: e.instancePath,
      message: e.message ?? 'is invalid',
    }));
    throw new ContentLoadError(
      `${url} failed ${schemaKind} schema validation (${errors.length} error${errors.length === 1 ? '' : 's'})`,
      { kind: 'validation', url, errors },
    );
  }
}

// ---------------------------------------------------------------------------
// Loaders
// ---------------------------------------------------------------------------

function loadJson<T>(url: string, schemaKind: SchemaKind): Promise<T> {
  return cached(url, async () => {
    const res = await fetchOk(url);
    let data: unknown;
    try {
      data = await res.json();
    } catch {
      // Malformed JSON from a static host is a broken/partial transfer:
      // surface it as a retryable fetch error (FR-CONT-007).
      throw new ContentLoadError(`Failed to fetch ${url} (response is not valid JSON)`, {
        kind: 'fetch',
        url,
      });
    }
    checkSchemaVersion(data, url);
    if (import.meta.env.DEV) {
      await devValidate(data, schemaKind, url);
    }
    return data as T;
  });
}

/** FR-CONT-001: the catalogue's single registry. */
export function loadContentIndex(): Promise<ContentIndex> {
  return loadJson<ContentIndex>(contentUrl('index.json'), 'content-index');
}

/** @param coursePath e.g. `"maths/alevel-pure"` (relative to `content/`). */
export function loadCourse(coursePath: string): Promise<Course> {
  return loadJson<Course>(contentUrl(`${coursePath}/course.json`), 'course');
}

export function loadModule(coursePath: string, dir: string): Promise<Module> {
  return loadJson<Module>(contentUrl(`${coursePath}/${dir}/module.json`), 'module');
}

export function loadLessonMarkdown(coursePath: string, dir: string, file: string): Promise<string> {
  const url = contentUrl(`${coursePath}/${dir}/${file}`);
  return cached(url, async () => (await fetchOk(url)).text());
}

export function loadQuiz(coursePath: string, dir: string, file: string): Promise<Quiz> {
  return loadJson<Quiz>(contentUrl(`${coursePath}/${dir}/${file}`), 'quiz');
}

/** `Lesson.kind: "screens"` (docs/BRILLIANT_REWRITE_PLAN.md). */
export function loadScreenSequence(coursePath: string, dir: string, file: string): Promise<ScreenSequence> {
  return loadJson<ScreenSequence>(contentUrl(`${coursePath}/${dir}/${file}`), 'screen-sequence');
}

// ---------------------------------------------------------------------------
// Lookups across the content tree
// ---------------------------------------------------------------------------

export interface ModuleLocation {
  subjectId: SubjectId;
  coursePath: string;
  course: Course;
  moduleRef: ModuleRef;
  module: Module;
}

/**
 * Resolves a globally-unique module id (§4.1) by walking the index and each
 * `course.json` in catalogue order. Lazy and cached: course files are fetched
 * at most once per session and repeat lookups hit the location cache.
 */
export async function findModule(moduleId: string): Promise<ModuleLocation | null> {
  const hit = moduleLocationCache.get(moduleId);
  if (hit !== undefined) return hit;

  const index = await loadContentIndex();
  for (const subject of index.subjects) {
    for (const courseRef of subject.courses) {
      const course = await loadCourse(courseRef.path);
      const moduleRef = course.modules.find((m) => m.id === moduleId);
      if (moduleRef) {
        const module = await loadModule(courseRef.path, moduleRef.dir);
        const location: ModuleLocation = {
          subjectId: subject.id,
          coursePath: courseRef.path,
          course,
          moduleRef,
          module,
        };
        moduleLocationCache.set(moduleId, location);
        return location;
      }
    }
  }
  moduleLocationCache.set(moduleId, null);
  return null;
}

/**
 * D-005: course ids are only guaranteed unique within a subject, so course
 * resolution scans subjects in catalogue order (maths → physics → cs → ai)
 * and takes the first id match.
 */
export async function findCourse(
  courseId: string,
): Promise<{ subjectId: SubjectId; ref: CourseRef } | null> {
  const index = await loadContentIndex();
  for (const subject of index.subjects) {
    for (const ref of subject.courses) {
      if (ref.id === courseId) return { subjectId: subject.id, ref };
    }
  }
  return null;
}
