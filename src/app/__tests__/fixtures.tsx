// Fixtures + vi.mock factories for app-shell tests. This module must not
// import the router/layout (mock factories load it while those modules are
// being mocked — keep it leaf-level to avoid circular mocking).

import type { ReactNode } from 'react';
import { vi } from 'vitest';

import { LessonContext, useLessonContext } from '../../content/lesson-context';
import type { ModuleLocation } from '../../content';
import type { ContentIndex, Course, Module } from '../../content/types';

export const INDEX: ContentIndex = {
  schemaVersion: 1,
  generatedAt: '2026-06-01T12:00:00.000Z',
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
          moduleCount: 2,
          totalEstMinutes: 180,
        },
      ],
    },
    {
      id: 'physics',
      title: 'Physics',
      courses: [
        {
          id: 'alevel-physics',
          path: 'physics/alevel-physics',
          title: 'A-level Physics',
          level: 'alevel',
          moduleCount: 4,
          totalEstMinutes: 400,
        },
      ],
    },
  ],
};

export const EMPTY_INDEX: ContentIndex = {
  schemaVersion: 1,
  generatedAt: '2026-06-01T12:00:00.000Z',
  subjects: [],
};

export const COURSE: Course = {
  schemaVersion: 1,
  id: 'alevel-pure',
  title: 'A-level Pure Mathematics',
  subject: 'maths',
  level: 'alevel',
  description: 'Core pure mathematics.',
  modules: [
    { id: 'diff-1', dir: 'diff-1' },
    { id: 'proof', dir: 'proof' },
  ],
};

export const MODULE: Module = {
  schemaVersion: 1,
  id: 'diff-1',
  title: 'Differentiation I',
  description: 'From gradients to the power rule.',
  estMinutes: 90,
  prerequisites: ['proof'],
  objectives: ['Interpret the derivative', 'Apply the power rule'],
  lessons: [
    { id: 'l1', title: 'Gradients', file: '01-gradients.md', estMinutes: 20 },
    { id: 'l2', title: 'Power rule', file: '02-power-rule.md', estMinutes: 25 },
  ],
  assessment: { file: 'assessment.json', passMark: 0.7 },
  version: '1.0.0',
  authors: ['charles'],
};

export const PROOF_MODULE: Module = {
  ...MODULE,
  id: 'proof',
  title: 'Proof',
  prerequisites: [],
  assessment: undefined,
};

export const MODULE_LOC: ModuleLocation = {
  subjectId: 'maths',
  coursePath: 'maths/alevel-pure',
  course: COURSE,
  moduleRef: { id: 'diff-1', dir: 'diff-1' },
  module: MODULE,
};

export const QUIZ = {
  schemaVersion: 1 as const,
  id: 'diff-1-assessment',
  title: 'End of module: Differentiation I',
  questions: [
    {
      id: 'q1',
      type: 'mcq' as const,
      text: 'What is 2 + 2?',
      choices: ['3', '4'],
      answer: 1,
      explanation: 'Basic arithmetic.',
    },
  ],
};

/** Factory body for mocking the content-api wrapper. */
export function contentApiMock() {
  return {
    LessonContext,
    useLessonContext,
    contentUrl: (rel: string) => `/content/${rel}`,
    moduleBaseUrl: (coursePath: string, dir: string) => `/content/${coursePath}/${dir}/`,
    loadContentIndex: vi.fn(async () => INDEX),
    loadCourse: vi.fn(async () => COURSE),
    loadModule: vi.fn(async (_path: string, dir: string) =>
      dir === 'proof' ? PROOF_MODULE : MODULE,
    ),
    loadLessonMarkdown: vi.fn(async () => '# Gradients\n\nThe slope of a curve.'),
    loadQuiz: vi.fn(async () => QUIZ),
    findModule: vi.fn(async (id: string) => (id === 'diff-1' ? MODULE_LOC : null)),
    findCourse: vi.fn(async (id: string) =>
      id === 'alevel-pure' ? { subjectId: 'maths', ref: INDEX.subjects[0]!.courses[0]! } : null,
    ),
  };
}

/** Factory body for mocking the progress barrel — no Dexie/IndexedDB. */
export function progressMock() {
  return {
    useOverallProgress: vi.fn((): unknown[] => []),
    useModuleState: vi.fn(() => undefined),
    useLessonProgressList: vi.fn((): unknown[] => []),
    useAttempts: vi.fn((): unknown[] => []),
    useBestAttempt: vi.fn(() => undefined),
    useKv: vi.fn(() => undefined),
    kvGet: vi.fn(async () => undefined),
    kvSet: vi.fn(async () => undefined),
    onWriteError: vi.fn(() => () => undefined),
    markLessonComplete: vi.fn(async () => undefined),
    touchLesson: vi.fn(async () => undefined),
    addLessonTime: vi.fn(async () => undefined),
    recordAttempt: vi.fn(async () => 1),
    getItemState: vi.fn(async () => null),
    setItemState: vi.fn(async () => undefined),
    requestPersistentStorage: vi.fn(async () => true),
    downloadProgress: vi.fn(async () => undefined),
    importProgress: vi.fn(async () => ({ imported: 3, skipped: 1 })),
    exportProgress: vi.fn(async () => ({}) as unknown),
    eraseAll: vi.fn(async () => undefined),
    KV_PERSISTENT: 'storagePersistent',
    KV_PERSIST_REQUESTED: 'storagePersistRequested',
  };
}

/** Default ::py invocation the markdown mock feeds to pyItemRenderer. */
export const PY_DIRECTIVE = {
  src: 'items/power-rule-quiz.py',
  params: { questions: 4 },
  height: 300,
};

/** Factory body for the lazily imported markdown barrel. */
export function markdownMock() {
  return {
    MarkdownLesson: ({
      markdown,
      pyItemRenderer,
    }: {
      markdown: string;
      pyItemRenderer?: (p: {
        src: string;
        params?: Record<string, unknown>;
        height?: number;
      }) => ReactNode;
    }) => (
      <div data-testid="markdown-lesson">
        {markdown}
        {pyItemRenderer ? pyItemRenderer(PY_DIRECTIVE) : null}
      </div>
    ),
    MarkdownInline: ({ markdown }: { markdown: string }) => <span>{markdown}</span>,
  };
}

/**
 * Factory body for mocking the src/python barrel. No real worker/Pyodide.
 * The fake PyItem records the props it received and exposes the wired
 * onProgress/onPersist callbacks via captured spies so tests can fire them.
 */
export const pyItemSpy = {
  props: null as Record<string, unknown> | null,
  restart: vi.fn(async () => undefined),
  runtime: {
    state: 'idle' as string,
    pyodideVersion: undefined as string | undefined,
    sdkVersion: undefined as string | undefined,
    loadedPackages: [] as string[],
    phaseText: undefined as string | undefined,
    error: undefined as string | undefined,
  },
};

export function resetPyItemSpy() {
  pyItemSpy.props = null;
  pyItemSpy.restart.mockClear();
  pyItemSpy.runtime = {
    state: 'idle',
    pyodideVersion: undefined,
    sdkVersion: undefined,
    loadedPackages: [],
    phaseText: undefined,
    error: undefined,
  };
}

export function pythonMock() {
  return {
    PyItem: (props: Record<string, unknown>) => {
      pyItemSpy.props = props;
      return <div data-testid="py-item" data-item-id={String(props.itemId)} />;
    },
    usePyRuntime: () => pyItemSpy.runtime,
    pyHost: { restart: pyItemSpy.restart },
  };
}
