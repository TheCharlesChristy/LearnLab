// Behaviour tests for the Flashcards implementation (SRS §5.3 row): renders
// the front, flip reveals the back, grading persists via LessonContext
// (itemId `flashcards:<src>`, D-012) and advances the deck, prior grades are
// restored on mount, deck-complete state after the last card, malformed/
// fetch-failure error cards, graceful no-op persistence with no LessonContext
// in scope, and keyboard operability (NFR-A11Y-001).

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);

import { LessonContext } from '../../content';
import type { LessonContextValue } from '../../content';

import Flashcards from './Flashcards';

function makeLessonContext(overrides: Partial<LessonContextValue> = {}): LessonContextValue {
  return {
    moduleId: 'calc',
    moduleBaseUrl: '/content/modules/calc/',
    recordAttempt: vi.fn(async () => {}),
    getItemState: vi.fn(async () => null),
    setItemState: vi.fn(async () => {}),
    recordReview: vi.fn(async () => {}),
    seedReviewItem: vi.fn(async () => {}),
    ...overrides,
  };
}

function withLesson(children: ReactNode, value: LessonContextValue) {
  return <LessonContext.Provider value={value}>{children}</LessonContext.Provider>;
}

const CARDS = {
  cards: [
    { front: 'What is **2+2**?', back: '4' },
    { front: 'Capital of France?', back: 'Paris' },
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

describe('Flashcards', () => {
  it('shows the front of the first card and a Flip button, not the back', async () => {
    mockFetchJson(CARDS);
    render(<Flashcards src="cards.json" />);
    const strong = await screen.findByText('2+2');
    expect(strong.tagName).toBe('STRONG');
    expect(screen.queryByText('4')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Flip' })).toBeInTheDocument();
  });

  it('flip reveals the back and shows grade buttons; aria-live announces the flip', async () => {
    mockFetchJson(CARDS);
    render(<Flashcards src="cards.json" />);
    await screen.findByRole('button', { name: 'Flip' });

    await userEvent.click(screen.getByRole('button', { name: 'Flip' }));

    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Again' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Good' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Card flipped');
  });

  it('grading calls setItemState with itemId flashcards:<src> and a JSON-safe grades object, and advances to the next card', async () => {
    mockFetchJson(CARDS);
    const ctx = makeLessonContext();
    render(withLesson(<Flashcards src="cards/unit1.json" />, ctx));

    await userEvent.click(await screen.findByRole('button', { name: 'Flip' }));
    await userEvent.click(screen.getByRole('button', { name: 'Good' }));

    expect(ctx.setItemState).toHaveBeenCalledTimes(1);
    const [itemId, grades] = (ctx.setItemState as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      unknown,
    ];
    expect(itemId).toBe('flashcards:cards/unit1.json');
    // JSON-safe: round-trips cleanly and matches the expected shape.
    expect(JSON.parse(JSON.stringify(grades))).toEqual({
      0: { grade: 'good', reviewedAt: expect.any(Number) },
    });

    // Advanced to the second card's front.
    expect(await screen.findByText('Capital of France?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Flip' })).toBeInTheDocument();
  });

  it('grading also feeds the per-card review queue via recordReview (§13 roadmap, D-021/D-022)', async () => {
    mockFetchJson(CARDS);
    const ctx = makeLessonContext();
    render(withLesson(<Flashcards src="cards/unit1.json" />, ctx));

    await userEvent.click(await screen.findByRole('button', { name: 'Flip' }));
    await userEvent.click(screen.getByRole('button', { name: 'Good' }));

    expect(ctx.recordReview).toHaveBeenCalledTimes(1);
    expect(ctx.recordReview).toHaveBeenCalledWith('flashcards:cards/unit1.json:0', 'good');
  });

  it('grading "Again" records the grade and still advances to the next card', async () => {
    mockFetchJson(CARDS);
    const ctx = makeLessonContext();
    render(withLesson(<Flashcards src="cards.json" />, ctx));

    await userEvent.click(await screen.findByRole('button', { name: 'Flip' }));
    await userEvent.click(screen.getByRole('button', { name: 'Again' }));

    const [, grades] = (ctx.setItemState as ReturnType<typeof vi.fn>).mock.calls[0] as [
      string,
      unknown,
    ];
    expect(JSON.parse(JSON.stringify(grades))).toEqual({
      0: { grade: 'again', reviewedAt: expect.any(Number) },
    });
    expect(await screen.findByText('Capital of France?')).toBeInTheDocument();
  });

  it('restores prior grades from getItemState on mount and reflects them in the initial render', async () => {
    mockFetchJson(CARDS);
    const ctx = makeLessonContext({
      getItemState: vi.fn(async () => ({ 0: { grade: 'good', reviewedAt: 1000 } })),
    });
    render(withLesson(<Flashcards src="cards/unit1.json" />, ctx));

    // Card 0 already graded "good" — session should resume on card 2 (index 1)
    // and the indicator should reflect one graded card.
    expect(await screen.findByText('Capital of France?')).toBeInTheDocument();
    expect(ctx.getItemState).toHaveBeenCalledWith('flashcards:cards/unit1.json');
    expect(screen.getByText('Graded 1/2')).toBeInTheDocument();
  });

  it('shows a deck-complete state after grading the last remaining card', async () => {
    mockFetchJson(CARDS);
    const ctx = makeLessonContext({
      getItemState: vi.fn(async () => ({ 0: { grade: 'good', reviewedAt: 1000 } })),
    });
    render(withLesson(<Flashcards src="cards.json" />, ctx));

    // Resumes on card 2; grade it "good" to complete the deck.
    await userEvent.click(await screen.findByRole('button', { name: 'Flip' }));
    await userEvent.click(screen.getByRole('button', { name: 'Good' }));

    expect(await screen.findAllByText('Deck complete')).toHaveLength(2);
    expect(screen.getByRole('status')).toHaveTextContent('Deck complete');
    expect(screen.getByRole('button', { name: 'Review again' })).toBeInTheDocument();
  });

  it('shows an error card naming the problem when "cards" is missing', async () => {
    mockFetchJson({ notCards: [] });
    render(<Flashcards src="cards.json" />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Invalid flashcards data');
    expect(alert).toHaveTextContent('cards:');
  });

  it('shows an error card naming the problem when "cards" is empty', async () => {
    mockFetchJson({ cards: [] });
    render(<Flashcards src="cards.json" />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('cards:');
    expect(alert).toHaveTextContent('non-empty array');
  });

  it('shows an error card naming the problem when a card is missing front/back', async () => {
    mockFetchJson({ cards: [{ front: 'Q only' }] });
    render(<Flashcards src="cards.json" />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('cards[0].back:');
  });

  it('shows a retry card on fetch failure and retries on click', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => CARDS });
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    render(<Flashcards src="cards.json" />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent("Couldn’t load flashcards");

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('button', { name: 'Flip' })).toBeInTheDocument();
  });

  it('works with no LessonContext in scope: renders and grades without crashing, no persistence attempted', async () => {
    mockFetchJson(CARDS);
    render(<Flashcards src="cards.json" />);

    await userEvent.click(await screen.findByRole('button', { name: 'Flip' }));
    await userEvent.click(screen.getByRole('button', { name: 'Good' }));

    // Advances in-memory even with no context to persist to.
    expect(await screen.findByText('Capital of France?')).toBeInTheDocument();
  });

  it('flip and grade buttons are keyboard-operable', async () => {
    mockFetchJson(CARDS);
    const ctx = makeLessonContext();
    render(withLesson(<Flashcards src="cards.json" />, ctx));

    const flipBtn = await screen.findByRole('button', { name: 'Flip' });
    flipBtn.focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Good' })).toBeInTheDocument();

    screen.getByRole('button', { name: 'Good' }).focus();
    await userEvent.keyboard('{Enter}');

    await waitFor(() => expect(ctx.setItemState).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Capital of France?')).toBeInTheDocument();
  });
});
