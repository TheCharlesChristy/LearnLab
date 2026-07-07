import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../content-api', async () => (await import('./fixtures')).contentApiMock());
vi.mock('../../progress', async () => (await import('./fixtures')).progressMock());

import * as contentApi from '../content-api';
import * as progress from '../../progress';

import { EMPTY_INDEX } from './fixtures';
import { renderRoute } from './helpers';

describe('CataloguePage (FR-SHELL-002, FR-CONT-001)', () => {
  it('groups courses by subject with level, stats and percent complete', async () => {
    vi.mocked(progress.useOverallProgress).mockReturnValue([
      {
        moduleId: 'diff-1',
        courseId: 'alevel-pure',
        subject: 'maths',
        status: 'completed',
        updatedAt: 1,
        lessonsDone: 2,
        lessonsTotal: 2,
      },
    ] as never);

    renderRoute('/');

    expect(
      await screen.findByRole('heading', { name: 'Mathematics' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Physics' })).toBeInTheDocument();
    expect(screen.getByText('A-level Pure Mathematics')).toBeInTheDocument();
    expect(screen.getByText(/2 modules · ~180 min/)).toBeInTheDocument();
    // 1 of 2 modules completed → 50%.
    const bar = screen.getByRole('progressbar', {
      name: /A-level Pure Mathematics: 50% complete/,
    });
    expect(bar).toHaveAttribute('aria-valuenow', '50');
    // Physics course with no progress → 0%.
    expect(
      screen.getByRole('progressbar', { name: /A-level Physics: 0% complete/ }),
    ).toBeInTheDocument();
  });

  it('renders the empty-state hero when the index has no courses', async () => {
    vi.mocked(contentApi.loadContentIndex).mockResolvedValueOnce(EMPTY_INDEX);
    renderRoute('/');
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'No courses yet' })).toBeInTheDocument(),
    );
  });
});
