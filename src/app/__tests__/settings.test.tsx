import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../content-api', async () => (await import('./fixtures')).contentApiMock());
vi.mock('../../progress', async () => (await import('./fixtures')).progressMock());
vi.mock('../../python', async () => (await import('./fixtures')).pythonMock());

import * as progress from '../../progress';
import { ToastProvider } from '../../ui';
import { pyItemSpy, resetPyItemSpy } from './fixtures';
import SettingsPage from '../pages/SettingsPage';
import { ThemeProvider } from '../theme';

function renderSettings() {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <SettingsPage />
      </ToastProvider>
    </ThemeProvider>,
  );
}

afterEach(() => {
  document.documentElement.classList.remove('dark');
  resetPyItemSpy();
});

describe('SettingsPage (FR-SET-001)', () => {
  it('theme toggle applies the .dark class and persists to kv (FR-SHELL-005)', async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.click(screen.getByRole('radio', { name: 'Dark' }));
    expect(document.documentElement).toHaveClass('dark');
    expect(progress.kvSet).toHaveBeenCalledWith('theme', 'dark');

    await user.click(screen.getByRole('radio', { name: 'Light' }));
    expect(document.documentElement).not.toHaveClass('dark');
    expect(progress.kvSet).toHaveBeenCalledWith('theme', 'light');
  });

  it('offers calm, opt-in sensory settings for mastery celebrations', async () => {
    const user = userEvent.setup();
    renderSettings();

    const visual = screen.getByRole('checkbox', { name: /Visual celebrations/ });
    const sound = screen.getByRole('checkbox', { name: /Celebration sound/ });
    const haptics = screen.getByRole('checkbox', { name: /Haptic feedback/ });
    expect(visual).not.toBeChecked();
    expect(sound).not.toBeChecked();
    expect(haptics).not.toBeChecked();
    expect(screen.getByText(/only after demonstrated mastery/)).toBeInTheDocument();
    expect(screen.getByText(/not part of a progress export/)).toBeInTheDocument();

    await user.click(visual);
    await user.click(sound);
    await user.click(haptics);
    expect(visual).toBeChecked();
    expect(sound).toBeChecked();
    expect(haptics).toBeChecked();
    expect(screen.getByRole('combobox', { name: 'Celebration motion' })).toHaveValue('system');
  });

  it('erase dialog requires typing exactly ERASE (FR-PROG-005)', async () => {
    const reload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload },
      writable: true,
      configurable: true,
    });

    const user = userEvent.setup();
    renderSettings();

    await user.click(screen.getByRole('button', { name: 'Erase all local data' }));
    const confirm = screen.getByRole('button', { name: 'Erase everything' });
    expect(confirm).toBeDisabled();

    const input = screen.getByRole('textbox', { name: /Type ERASE to confirm/ });
    await user.type(input, 'erase');
    expect(confirm).toBeDisabled();

    await user.clear(input);
    await user.type(input, 'ERASE');
    expect(confirm).toBeEnabled();

    await user.click(confirm);
    await waitFor(() => expect(progress.eraseAll).toHaveBeenCalled());
    await waitFor(() => expect(reload).toHaveBeenCalled());
  });

  it('shows the import summary on success', async () => {
    const user = userEvent.setup();
    renderSettings();

    const file = new File([JSON.stringify({ app: 'learnlab' })], 'p.json', {
      type: 'application/json',
    });
    await user.upload(screen.getByLabelText('Import progress file'), file);

    expect(await screen.findByText('Imported 3, skipped 1.')).toBeInTheDocument();
    expect(progress.importProgress).toHaveBeenCalledWith({ app: 'learnlab' });
  });

  it('shows the rejection reason on invalid import and changes nothing', async () => {
    vi.mocked(progress.importProgress).mockRejectedValueOnce(
      new Error('not a learnlab progress export'),
    );
    const user = userEvent.setup();
    renderSettings();

    const file = new File([JSON.stringify({ bogus: true })], 'bad.json', {
      type: 'application/json',
    });
    await user.upload(screen.getByLabelText('Import progress file'), file);

    expect(
      await screen.findByText(/Import rejected: not a learnlab progress export/),
    ).toBeInTheDocument();
  });

  it('shows download, Python runtime status, storage state, version and privacy note', async () => {
    const user = userEvent.setup();
    renderSettings();

    // FR-SET-001: live runtime status. Before load: idle + pinned version.
    expect(screen.getByText('Not loaded')).toBeInTheDocument();
    expect(screen.getByText(/Pyodide version: 0\.27\.7 \(pinned\)/)).toBeInTheDocument();
    expect(screen.getByText(/Loaded packages:/)).toBeInTheDocument();
    expect(screen.getByText(/Storage mode:/)).toBeInTheDocument();
    expect(screen.getByText('App version')).toBeInTheDocument();
    expect(screen.getByText(/never transmits learner data/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'LearnLab on GitHub' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Download my progress' }));
    expect(progress.downloadProgress).toHaveBeenCalled();
  });

  it('reflects live runtime status (FR-SET-001)', () => {
    pyItemSpy.runtime = {
      state: 'ready',
      pyodideVersion: '0.27.7',
      sdkVersion: '1.2.3',
      loadedPackages: ['numpy', 'sympy'],
      phaseText: undefined,
      error: undefined,
    };
    renderSettings();

    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText(/learnsdk version: 1\.2\.3/)).toBeInTheDocument();
    expect(screen.getByText(/numpy, sympy/)).toBeInTheDocument();
  });

  it('the Restart Python runtime button is enabled and calls pyHost.restart() (FR-SET-001)', async () => {
    const user = userEvent.setup();
    renderSettings();

    const btn = screen.getByRole('button', { name: 'Restart Python runtime' });
    expect(btn).toBeEnabled();
    await user.click(btn);
    expect(pyItemSpy.restart).toHaveBeenCalled();
  });
});
