import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ToastProvider, toast } from '../toast';

describe('toast system (NFR-REL-001 / FR-PWA-001)', () => {
  it('renders queued toasts in a polite live region and dismisses', async () => {
    const user = userEvent.setup();
    render(<ToastProvider>app</ToastProvider>);

    act(() => {
      toast({ message: 'Progress could not be saved.', durationMs: null });
    });

    const region = screen.getByRole('region', { name: 'Notifications' });
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByText('Progress could not be saved.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(screen.queryByText('Progress could not be saved.')).not.toBeInTheDocument();
  });

  it('runs the action callback (e.g. Reload to update) and dismisses', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<ToastProvider>app</ToastProvider>);

    act(() => {
      toast({
        message: 'A new version is ready.',
        actionLabel: 'Reload to update',
        onAction,
        durationMs: null,
      });
    });

    await user.click(screen.getByRole('button', { name: 'Reload to update' }));
    expect(onAction).toHaveBeenCalled();
    expect(screen.queryByText('A new version is ready.')).not.toBeInTheDocument();
  });
});
