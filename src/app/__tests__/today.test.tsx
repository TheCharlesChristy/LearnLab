// Home "Today" panel (D-033): Review / Continue / Next up / intact streak.

import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../content-api', async () => (await import('./fixtures')).contentApiMock());
vi.mock('../../progress', async () => (await import('./fixtures')).progressMock());

import * as progress from '../../progress';

import { renderRoute } from './helpers';

function forecast(overrides: Record<string, unknown> = {}) {
  return {
    total: 5,
    dueNow: 0,
    dueTomorrow: 0,
    dueThisWeek: 0,
    nextDueAt: null,
    recall: 0.9,
    byModule: [],
    ...overrides,
  } as never;
}

function lesson(lessonId: string, status: 'in-progress' | 'completed') {
  return { moduleId: 'diff-1', lessonId, status, updatedAt: 1, timeSpentSec: 0 } as never;
}

describe('TodayPanel (D-033)', () => {
  it('welcomes a brand-new learner', async () => {
    vi.mocked(progress.useReviewForecast).mockReturnValue(forecast({ total: 0 }));
    vi.mocked(progress.useLastLessonActivity).mockReturnValue(null);
    renderRoute('/');
    expect(await screen.findByText('Welcome to LearnLab')).toBeInTheDocument();
  });

  it('puts due reviews first and continues the in-progress lesson', async () => {
    vi.mocked(progress.useReviewForecast).mockReturnValue(forecast({ dueNow: 7 }));
    vi.mocked(progress.useLastLessonActivity).mockReturnValue(lesson('l1', 'in-progress'));
    renderRoute('/');

    const review = await screen.findByRole('link', { name: /7 items ready/ });
    expect(review).toHaveAttribute('href', '/review?start=1');
    const next = await screen.findByRole('link', { name: /Continue.*Gradients/ });
    expect(next).toHaveAttribute('href', '/module/diff-1/lesson/l1');
  });

  it('suggests the next lesson, then the assessment, after completions', async () => {
    vi.mocked(progress.useReviewForecast).mockReturnValue(forecast({ nextDueAt: Date.now() + 3 * 86_400_000 }));
    vi.mocked(progress.useLastLessonActivity).mockReturnValue(lesson('l1', 'completed'));
    const { unmount } = renderRoute('/');
    expect(await screen.findByText('All caught up')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /Next up.*Power rule/ })).toHaveAttribute(
      'href',
      '/module/diff-1/lesson/l2',
    );
    unmount();

    vi.mocked(progress.useLastLessonActivity).mockReturnValue(lesson('l2', 'completed'));
    renderRoute('/');
    expect(await screen.findByRole('link', { name: /Next up.*check yourself/ })).toHaveAttribute(
      'href',
      '/module/diff-1/assessment',
    );
  });

  it('shows an intact streak but never a broken one', async () => {
    vi.mocked(progress.useReviewForecast).mockReturnValue(forecast());
    vi.mocked(progress.useLastLessonActivity).mockReturnValue(lesson('l1', 'in-progress'));
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    vi.mocked(progress.useEngagement).mockReturnValue({ currentStreak: 4, lastActiveDateKey: today } as never);
    const { unmount } = renderRoute('/');
    expect(await screen.findByText(/4-day streak — today counts/)).toBeInTheDocument();
    unmount();

    vi.mocked(progress.useEngagement).mockReturnValue({ currentStreak: 4, lastActiveDateKey: '2020-01-01' } as never);
    renderRoute('/');
    await screen.findByText('Today');
    expect(screen.queryByText(/streak/)).not.toBeInTheDocument();
  });
});
