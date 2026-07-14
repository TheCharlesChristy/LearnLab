import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import coursePackFixture from '../../fixtures/experience-v2/course-pack.valid.json';
import linearGraphFixture from '../../fixtures/experience-v2/linear.valid.json';
import { wrap } from '../app/__tests__/helpers';
import StudioPage from './StudioPage';

describe('LearnLab Studio shell (#46)', () => {
  it('opens a local graph and retains structural edits through undo and redo', async () => {
    const user = userEvent.setup();
    wrap(<StudioPage />);

    const packFile = new File([JSON.stringify(coursePackFixture)], 'course-pack.json', { type: 'application/json' });
    await user.upload(screen.getByLabelText('Open course pack', { selector: 'input' }), packFile);
    const graphFile = new File([JSON.stringify(linearGraphFixture)], 'bridge.json', { type: 'application/json' });
    await user.upload(screen.getByLabelText('Open graph JSON', { selector: 'input' }), graphFile);

    expect(await screen.findByText('Graph map')).toBeInTheDocument();
    expect(screen.getByText('Selected pack: bridge-missions (course-pack.json).')).toBeInTheDocument();
    expect(screen.getByText('Selected graph: bridge.json.')).toBeInTheDocument();
    expect(await screen.findByText('Graph is valid for export.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add ending' }));
    const newEndingId = 'ending-1';
    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled();
    expect(screen.getAllByText(newEndingId).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.queryByText(newEndingId)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Redo' }));
    expect(screen.getAllByText(newEndingId).length).toBeGreaterThan(0);
  });
});
