// Behaviour tests for the matching-pairs implementation (SRS §5.3 row,
// D-028): click-to-select matching, correct/incorrect feedback, completion
// reported via LessonContext.notifyEngagement (never src/progress directly),
// malformed/fetch-failure error cards, graceful no-op with no LessonContext
// in scope, and keyboard operability (NFR-A11Y-001).

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);

import { LessonContext } from '../../content';
import type { LessonContextValue } from '../../content';

import MatchingPairs from './MatchingPairs';
import { parseProps } from './index';

function makeLessonContext(overrides: Partial<LessonContextValue> = {}): LessonContextValue {
  return {
    moduleId: 'calc',
    moduleBaseUrl: '/content/modules/calc/',
    recordAttempt: vi.fn(async () => {}),
    getItemState: vi.fn(async () => null),
    setItemState: vi.fn(async () => {}),
    recordReview: vi.fn(async () => {}),
    seedReviewItem: vi.fn(async () => {}),
    notifyEngagement: vi.fn(),
    ...overrides,
  };
}

function withLesson(children: ReactNode, value: LessonContextValue) {
  return <LessonContext.Provider value={value}>{children}</LessonContext.Provider>;
}

const DATA = {
  title: 'Match the terms',
  pairs: [
    { left: 'Derivative', right: 'Rate of change' },
    { left: 'Integral', right: 'Area under a curve' },
  ],
};

function mockFetchJson(data: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, status: 200, json: async () => data })) as unknown as typeof fetch,
  );
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe('parseProps', () => {
  it('requires a non-empty src', () => {
    expect(parseProps({})).toEqual({
      ok: false,
      errors: [
        'src: required — a path to a matching-pairs JSON file, e.g. src="cards/key-terms.json"',
      ],
    });
    expect(parseProps({ src: '' })).toEqual({ ok: false, errors: expect.any(Array) });
  });

  it('accepts a valid src', () => {
    expect(parseProps({ src: 'cards/terms.json' })).toEqual({
      ok: true,
      props: { src: 'cards/terms.json' },
    });
  });
});

describe('MatchingPairs', () => {
  it('renders both columns and the title/instructions', async () => {
    mockFetchJson(DATA);
    render(<MatchingPairs src="cards.json" />);
    expect(await screen.findByText('Match the terms')).toBeInTheDocument();
    expect(screen.getByText('Derivative')).toBeInTheDocument();
    expect(screen.getByText('Rate of change')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(4);
  });

  it('selecting a correct pair marks both matched and announces it', async () => {
    mockFetchJson(DATA);
    render(<MatchingPairs src="cards.json" />);
    await screen.findByText('Derivative');

    await userEvent.click(screen.getByRole('button', { name: 'Derivative' }));
    await userEvent.click(screen.getByRole('button', { name: 'Rate of change' }));

    expect(screen.getByRole('button', { name: 'Derivative' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Rate of change' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Matched: Derivative');
  });

  it('selecting an incorrect pair announces a mismatch and clears the selection', async () => {
    mockFetchJson(DATA);
    render(<MatchingPairs src="cards.json" />);
    await screen.findByText('Derivative');

    await userEvent.click(screen.getByRole('button', { name: 'Derivative' }));
    await userEvent.click(screen.getByRole('button', { name: 'Area under a curve' }));

    expect(screen.getByRole('status')).toHaveTextContent('Not a match, try again.');
    expect(screen.getByRole('button', { name: 'Derivative' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Area under a curve' })).not.toBeDisabled();
  });

  it('completing all pairs shows the completion banner and reports notifyEngagement (never src/progress directly)', async () => {
    mockFetchJson(DATA);
    const ctx = makeLessonContext();
    render(withLesson(<MatchingPairs src="cards.json" />, ctx));
    await screen.findByText('Derivative');

    await userEvent.click(screen.getByRole('button', { name: 'Derivative' }));
    await userEvent.click(screen.getByRole('button', { name: 'Rate of change' }));
    await userEvent.click(screen.getByRole('button', { name: 'Integral' }));
    await userEvent.click(screen.getByRole('button', { name: 'Area under a curve' }));

    expect(await screen.findByText(/All 2 pairs matched!/)).toBeInTheDocument();
    await waitFor(() => expect(ctx.notifyEngagement).toHaveBeenCalledWith({ kind: 'game-complete' }));
    expect(ctx.notifyEngagement).toHaveBeenCalledTimes(1);

    // "Play again" resets the board without re-firing notifyEngagement.
    await userEvent.click(screen.getByRole('button', { name: 'Play again' }));
    expect(screen.getByRole('button', { name: 'Derivative' })).not.toBeDisabled();
  });

  it('works with no LessonContext in scope: renders and matches without crashing', async () => {
    mockFetchJson(DATA);
    render(<MatchingPairs src="cards.json" />);
    await screen.findByText('Derivative');

    await userEvent.click(screen.getByRole('button', { name: 'Derivative' }));
    await userEvent.click(screen.getByRole('button', { name: 'Rate of change' }));

    expect(screen.getByRole('button', { name: 'Derivative' })).toBeDisabled();
  });

  it('shows an error card naming the problem when "pairs" has fewer than 2 entries', async () => {
    mockFetchJson({ pairs: [{ left: 'a', right: 'b' }] });
    render(<MatchingPairs src="cards.json" />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('pairs:');
    expect(alert).toHaveTextContent('at least 2 entries');
  });

  it('shows an error card naming the problem when a pair is missing left/right', async () => {
    mockFetchJson({ pairs: [{ left: 'a' }, { left: 'b', right: 'c' }] });
    render(<MatchingPairs src="cards.json" />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('pairs[0].right:');
  });

  it('shows a retry card on fetch failure and retries on click', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => DATA });
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    render(<MatchingPairs src="cards.json" />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent("Couldn’t load the matching game");

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Derivative')).toBeInTheDocument();
  });

  it('buttons are keyboard-operable', async () => {
    mockFetchJson(DATA);
    render(<MatchingPairs src="cards.json" />);
    const first = await screen.findByRole('button', { name: 'Derivative' });
    first.focus();
    await userEvent.keyboard('{Enter}');
    const second = screen.getByRole('button', { name: 'Rate of change' });
    second.focus();
    await userEvent.keyboard('{Enter}');
    expect(first).toBeDisabled();
  });
});
