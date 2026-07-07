import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../content-api', async () => (await import('./fixtures')).contentApiMock());
vi.mock('../../progress', async () => (await import('./fixtures')).progressMock());

import { renderRoute } from './helpers';

// jsdom has no Worker by default, which is exactly the unsupported case.
describe('unsupported-browser banner (§2.3)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('shows a dismissable, non-blocking banner when Worker is missing', async () => {
    const user = userEvent.setup();
    renderRoute('/');

    const banner = await screen.findByText(/Python items won’t run in this browser/);
    expect(banner).toBeInTheDocument();
    // Non-blocking: catalogue content renders behind it.
    expect(await screen.findByRole('heading', { name: 'Mathematics' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Dismiss browser support notice' }));
    expect(screen.queryByText(/Python items won’t run/)).not.toBeInTheDocument();
  });

  it('does not show the banner when WebAssembly and Worker exist', async () => {
    vi.stubGlobal('Worker', class MockWorker {});
    renderRoute('/');
    await screen.findByRole('heading', { name: 'Mathematics' });
    expect(screen.queryByText(/Python items won’t run/)).not.toBeInTheDocument();
  });
});
