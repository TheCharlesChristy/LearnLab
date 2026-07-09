// Tests for WidgetsPage: search narrowing the grid, and the WidgetPlayground
// panel (real registry + real docs/WIDGETS.md, exercised against the
// lightweight truth-table widget — pure prop-driven, no fetch/LessonContext).
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import WidgetsPage from './WidgetsPage';

function renderPage() {
  return render(
    <MemoryRouter>
      <WidgetsPage />
    </MemoryRouter>,
  );
}

describe('WidgetsPage', () => {
  it('lists every registered widget by default', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'truth-table', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'function-grapher', level: 2 })).toBeInTheDocument();
  });

  it('narrows the grid as the search box is typed into', async () => {
    renderPage();
    const input = screen.getByLabelText('Search widgets');
    await userEvent.type(input, 'truth-table');

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'function-grapher', level: 2 })).not.toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: 'truth-table', level: 2 })).toBeInTheDocument();
    expect(screen.getByText(/^\d+ of 13 widgets$/)).toBeInTheDocument();
  });

  it('shows an empty state for a query that matches nothing', async () => {
    renderPage();
    const input = screen.getByLabelText('Search widgets');
    await userEvent.type(input, 'nonexistentxyz');

    await waitFor(() => {
      expect(screen.getByText(/No widgets matched/)).toBeInTheDocument();
    });
  });

  it('opening a playground renders a live, editable preview', async () => {
    renderPage();
    const heading = screen.getByRole('heading', { name: 'truth-table', level: 2 });
    const card = heading.parentElement as HTMLElement;

    await userEvent.click(within(card).getByText('Try it'));

    const exprField = await within(card).findByLabelText(/^expr/);
    await waitFor(() => {
      expect(within(card).getByRole('table')).toBeInTheDocument();
    });

    await userEvent.clear(exprField);
    await waitFor(
      () => {
        expect(within(card).getByText(/expr: required/)).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });
});
