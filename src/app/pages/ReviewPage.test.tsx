import 'fake-indexeddb/auto';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '../../progress';
import { clearReviewCatalogueCache, saveMixedReviewSession } from '../../review';

import ReviewPage from './ReviewPage';

function renderReview() {
  return render(<MemoryRouter><ReviewPage /></MemoryRouter>);
}

async function addDue(moduleId: string, itemId: string, dueAt = Date.now() - 1) {
  await db.reviewState.put({
    moduleId, itemId, dueAt, easinessFactor: 2.5, intervalDays: 0, repetitions: 0,
    lastReviewedAt: dueAt, lastQuality: 2, updatedAt: dueAt,
  });
}

beforeEach(async () => {
  clearReviewCatalogueCache();
  saveMixedReviewSession(undefined);
  await db.open();
  await Promise.all(db.tables.map((table) => table.clear()));
});

afterEach(() => vi.unstubAllGlobals());

describe('ReviewPage mixed cross-course sessions (#60)', () => {
  it('shows a friendly empty state when nothing is due', async () => {
    renderReview();
    expect(await screen.findByText(/Nothing due for review right now/)).toBeInTheDocument();
  });

  it('uses a bounded session and returns the learner to their campaign after a grade', async () => {
    const now = Date.now();
    await addDue('m1', 'flashcards:deck.json:0', now - 1_000);
    const user = userEvent.setup();
    renderReview();

    expect(await screen.findByText('Reviewing 1 of 1 mixed items')).toBeInTheDocument();
    expect(screen.getByText('m1')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to module' })).toHaveAttribute('href', '/module/m1');
    await user.click(screen.getByRole('button', { name: 'Good' }));

    expect(await screen.findByText('Review session complete')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Return to learning' })).toHaveAttribute('href', '/');
    const row = await db.reviewState.get(['m1', 'flashcards:deck.json:0']);
    expect(row?.dueAt).toBeGreaterThan(now);
    expect(row?.lastQuality).toBe(4);
  });

  it('renders a standalone v2 recognition review and requires an attempt before a grade', async () => {
    await addDue('v2:bridge-missions', 'balanced-force-review');
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true, status: 200,
      json: async () => ({
        schemaVersion: 1,
        items: [{
          ownerId: 'v2:bridge-missions', contentVersion: '1.0.0', id: 'balanced-force-review',
          title: 'Balanced forces', standaloneContext: 'A bridge deck has equal opposing forces.',
          prompt: 'Are the forces balanced?', skillIds: ['force-balance'],
          activity: { key: 'seeded-choice', version: '1.0.0', props: {
            prompt: 'Choose.', options: [{ id: 'yes', label: 'Yes' }, { id: 'no', label: 'No' }], correctId: 'yes',
          } },
          goal: { operator: 'activity-complete' }, feedback: { success: 'Equal opposing forces give zero resultant force.' },
        }],
      }),
    })));

    renderReview();
    expect(await screen.findByText('A bridge deck has equal opposing forces.')).toBeInTheDocument();
    expect(screen.queryByText('Equal opposing forces give zero resultant force.')).not.toBeInTheDocument();
    expect(await screen.findByRole('radio', { name: 'Yes' }, { timeout: 5_000 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Good' })).toBeDisabled();
  });

  it('continues safely when a V2 activity is no longer in the catalogue', async () => {
    await addDue('v2:old-course', 'removed-item');
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ schemaVersion: 1, items: [] }) })));
    const user = userEvent.setup();
    renderReview();
    expect(await screen.findByText('This review item is no longer available')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Skip unavailable item' }));
    expect(await screen.findByText('Review session complete')).toBeInTheDocument();
  });

});
