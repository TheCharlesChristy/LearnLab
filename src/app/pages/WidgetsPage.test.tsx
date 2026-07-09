// Tests for the WidgetsPage explorer: one widget's playground visible by
// default (no click needed), documentation collapsed until requested,
// sidebar selection/search, and graceful handling of a bad :widgetKey.
// Uses the real route table (renderRoute) since the page now depends on
// useParams — same harness LessonPage.test.tsx uses for param-driven pages.
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderRoute } from '../__tests__/helpers';

describe('WidgetsPage', () => {
  it('redirects bare /widgets to the first widget, alphabetically', async () => {
    renderRoute('/widgets');
    expect(await screen.findByRole('heading', { name: 'code-runner', level: 2 })).toBeInTheDocument();
  });

  it('shows the selected widget\'s playground immediately, with documentation collapsed', async () => {
    renderRoute('/widgets/truth-table');

    expect(await screen.findByRole('heading', { name: 'truth-table', level: 2 })).toBeInTheDocument();
    // Playground form is visible with no click needed.
    expect(await screen.findByLabelText(/^expr/)).toBeInTheDocument();
    // Documentation (props table) is not shown until requested.
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    await userEvent.click(screen.getByText('Show documentation'));
    expect(await screen.findByRole('table')).toBeInTheDocument();
  });

  it('selecting a different sidebar item swaps the visible playground', async () => {
    renderRoute('/widgets/truth-table');
    await screen.findByRole('heading', { name: 'truth-table', level: 2 });

    await userEvent.click(screen.getByRole('link', { name: 'flashcards' }));

    expect(await screen.findByRole('heading', { name: 'flashcards', level: 2 })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'truth-table', level: 2 })).not.toBeInTheDocument();
  });

  it('an invalid prop surfaces the real DirectiveErrorCard', async () => {
    renderRoute('/widgets/truth-table');
    const exprField = await screen.findByLabelText(/^expr/);

    await userEvent.clear(exprField);
    await waitFor(
      () => {
        expect(screen.getByText(/expr: required/)).toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  it('sidebar search narrows the list without blanking the open widget', async () => {
    renderRoute('/widgets/truth-table');
    await screen.findByRole('heading', { name: 'truth-table', level: 2 });

    const searchInput = screen.getByLabelText('Search widgets');
    await userEvent.type(searchInput, 'flashcards');

    await waitFor(() => {
      expect(screen.queryByRole('link', { name: 'code-runner' })).not.toBeInTheDocument();
    });
    // The already-open widget's playground is untouched by the sidebar filter.
    expect(screen.getByRole('heading', { name: 'truth-table', level: 2 })).toBeInTheDocument();
    expect(await screen.findByLabelText(/^expr/)).toBeInTheDocument();
  });

  it('shows a graceful fallback for an unknown widget key', async () => {
    renderRoute('/widgets/nonexistent-widget');
    expect(await screen.findByText('Unknown widget: nonexistent-widget')).toBeInTheDocument();
    // The sidebar (with real widgets to pick from) is still shown.
    expect(screen.getByRole('link', { name: 'truth-table' })).toBeInTheDocument();
  });
});
