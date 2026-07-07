import 'fake-indexeddb/auto';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';

import { db } from '../../progress';

import ReviewPage from './ReviewPage';

function renderReview() {
  return render(
    <MemoryRouter>
      <ReviewPage />
    </MemoryRouter>,
  );
}

beforeEach(async () => {
  await db.open();
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe('ReviewPage (§13 roadmap, D-021)', () => {
  it('shows a friendly empty state when nothing is due', async () => {
    renderReview();

    expect(
      await screen.findByText('Nothing due for review right now — nice work!'),
    ).toBeInTheDocument();
  });

  it('shows a due item with Again/Good buttons; grading it advances and empties the queue', async () => {
    const now = Date.now();
    await db.reviewState.put({
      moduleId: 'm1',
      itemId: 'flashcards:deck.json:0',
      easinessFactor: 2.5,
      intervalDays: 0,
      repetitions: 0,
      dueAt: now - 1000,
      lastReviewedAt: now - 1000,
      lastQuality: 2,
      updatedAt: now - 1000,
    });

    const user = userEvent.setup();
    renderReview();

    expect(await screen.findByText(/Reviewing 1 of 1 due/)).toBeInTheDocument();
    expect(screen.getByText('m1')).toBeInTheDocument();
    expect(screen.getByText('flashcards:deck.json:0')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to module' })).toHaveAttribute(
      'href',
      '/module/m1',
    );

    const goodButton = screen.getByRole('button', { name: 'Good' });
    await user.click(goodButton);

    // recordReview schedules the item at least a day out (SM-2-lite), so the
    // live due-items query drops it and the empty state reappears.
    expect(
      await screen.findByText('Nothing due for review right now — nice work!'),
    ).toBeInTheDocument();

    const row = await db.reviewState.get(['m1', 'flashcards:deck.json:0']);
    expect(row?.dueAt).toBeGreaterThan(now);
    expect(row?.lastQuality).toBe(4); // GRADE_QUALITY.good
  });

  it('grading "Again" also reschedules the item out of the due list', async () => {
    const now = Date.now();
    await db.reviewState.put({
      moduleId: 'm2',
      itemId: 'quiz:q1:q1',
      easinessFactor: 2.5,
      intervalDays: 0,
      repetitions: 0,
      dueAt: now - 1000,
      lastReviewedAt: now - 1000,
      lastQuality: 2,
      updatedAt: now - 1000,
    });

    const user = userEvent.setup();
    renderReview();

    expect(await screen.findByText(/Reviewing 1 of 1 due/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Again' }));

    await waitFor(async () => {
      const row = await db.reviewState.get(['m2', 'quiz:q1:q1']);
      expect(row?.dueAt).toBeGreaterThan(now);
    });
    expect(
      await screen.findByText('Nothing due for review right now — nice work!'),
    ).toBeInTheDocument();
  });
});
