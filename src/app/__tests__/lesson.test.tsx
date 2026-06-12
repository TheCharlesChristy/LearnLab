import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { intersectionObservers } from '../../test-setup';

vi.mock('../content-api', async () => (await import('./fixtures')).contentApiMock());
vi.mock('../../progress', async () => (await import('./fixtures')).progressMock());
vi.mock('../../markdown', async () => (await import('./fixtures')).markdownMock());

import * as contentApi from '../content-api';
import * as progress from '../../progress';

import { renderRoute } from './helpers';

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
