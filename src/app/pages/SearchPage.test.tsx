// Tests for SearchPage (D-022): mocks the search subsystem barrel so this
// stays a pure component test, independent of the real fetch/ranking code
// (covered separately by src/search/*.test.ts).
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { SearchResult } from '../../search';

const { loadSearchIndex, searchLessons } = vi.hoisted(() => ({
  loadSearchIndex: vi.fn(),
  searchLessons: vi.fn(),
}));

vi.mock('../../search', () => ({ loadSearchIndex, searchLessons }));

import SearchPage from './SearchPage';

const fixtureIndex = { schemaVersion: 1 as const, generatedAt: 'x', lessons: [] };

const results: SearchResult[] = [
  {
    subject: 'maths',
    courseId: 'alevel-pure',
    courseTitle: 'A-level Pure Mathematics',
    moduleId: 'quadratics',
    moduleTitle: 'Quadratics',
    lessonId: 'quadratic-formula',
    lessonTitle: 'The quadratic formula',
    excerpt: 'This lesson derives the quadratic formula by completing the square.',
    score: 12,
  },
  {
    subject: 'physics',
    courseId: 'gcse-physics',
    courseTitle: 'GCSE Physics',
    moduleId: 'waves',
    moduleTitle: 'Waves',
    lessonId: 'wave-equation',
    lessonTitle: 'The wave equation',
    excerpt: 'Mentions quadratic once in passing.',
    score: 1,
  },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <SearchPage />
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('SearchPage', () => {
  it('shows a loading spinner while the index fetches', async () => {
    loadSearchIndex.mockReturnValue(new Promise(() => {})); // never resolves
    renderPage();
    expect(await screen.findByRole('status')).toHaveTextContent(/loading/i);
  });

  it('shows a retry card when the index fails to load', async () => {
    loadSearchIndex.mockRejectedValue(new Error('network down'));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent(/could not load/i);
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('prompts for input before anything is typed', async () => {
    loadSearchIndex.mockResolvedValue(fixtureIndex);
    renderPage();
    expect(await screen.findByText(/start typing to search/i)).toBeInTheDocument();
    expect(searchLessons).not.toHaveBeenCalled();
  });

  it('renders results as links to the lesson route once the query resolves', async () => {
    loadSearchIndex.mockResolvedValue(fixtureIndex);
    searchLessons.mockReturnValue(results);
    renderPage();

    const input = await screen.findByLabelText(/search lesson content/i);
    await userEvent.type(input, 'quadratic');

    const link1 = await screen.findByRole('link', { name: /the quadratic formula/i });
    expect(link1).toHaveAttribute('href', '/module/quadratics/lesson/quadratic-formula');

    const link2 = screen.getByRole('link', { name: /the wave equation/i });
    expect(link2).toHaveAttribute('href', '/module/waves/lesson/wave-equation');

    expect(screen.getByText(/A-level Pure Mathematics/)).toBeInTheDocument();
    expect(screen.getByText(/completing the square/)).toBeInTheDocument();
  });

  it('announces the result count in a polite live region', async () => {
    loadSearchIndex.mockResolvedValue(fixtureIndex);
    searchLessons.mockReturnValue(results);
    renderPage();

    const input = await screen.findByLabelText(/search lesson content/i);
    await userEvent.type(input, 'quadratic');

    await waitFor(() => {
      expect(screen.getByText('2 results found')).toBeInTheDocument();
    });
  });

  it('shows a friendly no-results message when nothing matches', async () => {
    loadSearchIndex.mockResolvedValue(fixtureIndex);
    searchLessons.mockReturnValue([]);
    renderPage();

    const input = await screen.findByLabelText(/search lesson content/i);
    await userEvent.type(input, 'nonexistentxyz');

    expect(await screen.findByText(/no lessons matched/i)).toBeInTheDocument();
  });
});
