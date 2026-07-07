import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { intersectionObservers } from '../../test-setup';
import { pyItemId, seedFor } from '../py-item-host';

vi.mock('../content-api', async () => (await import('./fixtures')).contentApiMock());
vi.mock('../../progress', async () => (await import('./fixtures')).progressMock());
vi.mock('../../markdown', async () => (await import('./fixtures')).markdownMock());
vi.mock('../../python', async () => (await import('./fixtures')).pythonMock());

import * as contentApi from '../content-api';
import * as progress from '../../progress';

import { PY_DIRECTIVE, pyItemSpy, resetPyItemSpy } from './fixtures';
import { renderRoute } from './helpers';

afterEach(() => resetPyItemSpy());

const EXPECTED_META = {
  courseId: 'alevel-pure',
  subject: 'maths',
  lessonsTotal: 2,
  hasAssessment: true,
  lessonIds: ['l1', 'l2'],
};

describe('LessonPage (FR-SHELL-004)', () => {
  it('"Mark lesson complete" calls markLessonComplete with the correct ModuleMeta', async () => {
    const user = userEvent.setup();
    renderRoute('/module/diff-1/lesson/l1');

    await user.click(await screen.findByRole('button', { name: 'Mark lesson complete' }));

    expect(progress.markLessonComplete).toHaveBeenCalledWith('diff-1', 'l1', EXPECTED_META);
  });

  it('auto-completes via the end-of-content scroll sentinel (FR-SHELL-004)', async () => {
    renderRoute('/module/diff-1/lesson/l1');
    await screen.findByTestId('markdown-lesson');

    const sentinel = screen.getByTestId('lesson-end-sentinel');
    const observer = intersectionObservers.find((o) => o.elements.includes(sentinel));
    expect(observer).toBeDefined();

    act(() => observer!.callback([{ isIntersecting: true }]));
    await waitFor(() =>
      expect(progress.markLessonComplete).toHaveBeenCalledWith('diff-1', 'l1', EXPECTED_META),
    );
  });

  it('touches the lesson on mount (in-progress tracking)', async () => {
    renderRoute('/module/diff-1/lesson/l1');
    await screen.findByTestId('markdown-lesson');
    expect(progress.touchLesson).toHaveBeenCalledWith('diff-1', 'l1', EXPECTED_META);
    // FR-PROG-007: persistence requested after the first meaningful write.
    expect(progress.requestPersistentStorage).toHaveBeenCalled();
  });

  it('shows a retry card when the lesson markdown fails to fetch (FR-CONT-007)', async () => {
    vi.mocked(contentApi.loadLessonMarkdown)
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce('# Recovered');

    const user = userEvent.setup();
    renderRoute('/module/diff-1/lesson/l1');

    expect(await screen.findByText(/Could not load this lesson/)).toBeInTheDocument();
    // Rest of the page is functional: navigation + completion still render.
    expect(screen.getByRole('button', { name: 'Mark lesson complete' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Next: Power rule/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByTestId('markdown-lesson')).toHaveTextContent('Recovered');
  });

  it('offers Previous/Next lesson navigation', async () => {
    renderRoute('/module/diff-1/lesson/l2');
    await screen.findByTestId('markdown-lesson');
    expect(screen.getByRole('link', { name: /Previous: Gradients/ })).toBeInTheDocument();
    // Last lesson links onwards to the assessment.
    expect(screen.getByRole('link', { name: /Take the assessment/ })).toBeInTheDocument();
  });
});

describe('PyItemHost wiring (§3.4, §6.3, FR-PY)', () => {
  const expectedItemId = pyItemId(PY_DIRECTIVE.src);
  const expectedSeed = seedFor('diff-1', expectedItemId);

  it('renders an embedded ::py item with the correct sourceUrl/params/seed/savedState', async () => {
    renderRoute('/module/diff-1/lesson/l1');
    await screen.findByTestId('py-item');

    expect(progress.getItemState).toHaveBeenCalledWith('diff-1', expectedItemId);
    const props = pyItemSpy.props!;
    expect(props.itemId).toBe(expectedItemId);
    // moduleBaseUrl mock = /content/<coursePath>/<dir>/
    expect(props.sourceUrl).toBe('/content/maths/alevel-pure/diff-1/items/power-rule-quiz.py');
    expect(props.params).toEqual(PY_DIRECTIVE.params);
    expect(props.height).toBe(PY_DIRECTIVE.height);
    expect(props.seed).toBe(expectedSeed);
    // getItemState mock resolves null → first run.
    expect(props.savedState).toBeNull();
  });

  it("onProgress 'scored' records a python-item attempt with the score", async () => {
    renderRoute('/module/diff-1/lesson/l1');
    await screen.findByTestId('py-item');

    const onProgress = pyItemSpy.props!.onProgress as (p: unknown) => void;
    act(() => onProgress({ itemId: expectedItemId, kind: 'scored', score: 3, maxScore: 4 }));

    expect(progress.recordAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        moduleId: 'diff-1',
        itemId: expectedItemId,
        kind: 'python-item',
        score: 3,
        maxScore: 4,
        answers: {},
      }),
    );
  });

  it("onProgress 'completed' records a 1/1 completion marker", async () => {
    renderRoute('/module/diff-1/lesson/l1');
    await screen.findByTestId('py-item');

    const onProgress = pyItemSpy.props!.onProgress as (p: unknown) => void;
    act(() => onProgress({ itemId: expectedItemId, kind: 'completed' }));

    expect(progress.recordAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'python-item', score: 1, maxScore: 1 }),
    );
  });

  it('onPersist writes item state via setItemState', async () => {
    renderRoute('/module/diff-1/lesson/l1');
    await screen.findByTestId('py-item');

    const onPersist = pyItemSpy.props!.onPersist as (s: unknown) => void;
    act(() => onPersist({ _v: 1, score: 2 }));

    expect(progress.setItemState).toHaveBeenCalledWith('diff-1', expectedItemId, {
      _v: 1,
      score: 2,
    });
  });

  it('full-page python lesson renders the PyItemHost, not markdown', async () => {
    vi.mocked(contentApi.findModule).mockResolvedValueOnce({
      subjectId: 'maths',
      coursePath: 'maths/alevel-pure',
      course: {
        schemaVersion: 1,
        id: 'alevel-pure',
        title: 'A-level Pure Mathematics',
        subject: 'maths',
        level: 'alevel',
        description: 'x',
        modules: [{ id: 'diff-1', dir: 'diff-1' }],
      },
      moduleRef: { id: 'diff-1', dir: 'diff-1' },
      module: {
        schemaVersion: 1,
        id: 'diff-1',
        title: 'Differentiation I',
        description: 'x',
        estMinutes: 90,
        prerequisites: [],
        objectives: ['a', 'b'],
        lessons: [
          {
            id: 'sim',
            title: 'Projectile sim',
            file: 'items/projectile.py',
            kind: 'python',
            estMinutes: 20,
          },
        ],
        version: '1.0.0',
        authors: ['charles'],
      },
    } as never);

    renderRoute('/module/diff-1/lesson/sim');
    await screen.findByTestId('py-item');

    expect(screen.queryByTestId('markdown-lesson')).not.toBeInTheDocument();
    const props = pyItemSpy.props!;
    expect(props.itemId).toBe('items/projectile');
    expect(props.sourceUrl).toBe('/content/maths/alevel-pure/diff-1/items/projectile.py');
    expect(props.title).toBe('Projectile sim');
    // Mark-complete still works around the item.
    expect(screen.getByRole('button', { name: 'Mark lesson complete' })).toBeInTheDocument();
  });
});
