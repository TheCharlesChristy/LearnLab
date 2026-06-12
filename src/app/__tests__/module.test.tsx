import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../content-api', async () => (await import('./fixtures')).contentApiMock());
vi.mock('../../progress', async () => (await import('./fixtures')).progressMock());

import * as progress from '../../progress';

import { renderRoute } from './helpers';

describe('ModulePage (FR-SHELL-003, FR-CONT-008)', () => {
  it('warns about unmet prerequisites but keeps all content accessible', async () => {
    renderRoute('/module/diff-1');

    expect(await screen.findByText(/Recommended first: proof/)).toBeInTheDocument();
    // Never blocks: lesson links and the assessment entry are still there.
    expect(screen.getByRole('link', { name: /1\. Gradients/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /2\. Power rule/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start assessment' })).toBeInTheDocument();
    // Prereq chip links to the module.
    expect(screen.getByRole('link', { name: /proof/ })).toHaveAttribute(
      'href',
      expect.stringContaining('/module/proof'),
    );
  });

  it('hides the warning when prerequisites are met and shows the best score', async () => {
    vi.mocked(progress.useOverallProgress).mockReturnValue([
      {
        moduleId: 'proof',
        courseId: 'alevel-pure',
        subject: 'maths',
        status: 'completed',
        updatedAt: 1,
        lessonsDone: 2,
        lessonsTotal: 2,
      },
    ] as never);
    vi.mocked(progress.useModuleState).mockReturnValue({
      moduleId: 'diff-1',
      courseId: 'alevel-pure',
      subject: 'maths',
      status: 'in-progress',
      updatedAt: 1,
      lessonsDone: 1,
      lessonsTotal: 2,
      assessmentBest: { score: 7, maxScore: 8, at: 1 },
    } as never);

    renderRoute('/module/diff-1');

    expect(await screen.findByText('Best score: 7/8')).toBeInTheDocument();
    expect(screen.queryByText(/Recommended first/)).not.toBeInTheDocument();
    expect(screen.getByText('Pass mark: 70%')).toBeInTheDocument();
  });
});
