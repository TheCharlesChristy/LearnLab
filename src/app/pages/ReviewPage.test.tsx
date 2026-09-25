// Review page (D-033): real retrieval sessions over resolved content, with
// confidence lock-in, hypercorrection feedback, in-session relearning and a
// debrief. Uses the real progress layer (fake-indexeddb) and a mocked
// content barrel so the resolver finds a small fixture module.

import 'fake-indexeddb/auto';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { db } from '../../progress';
import type { ReviewState } from '../../progress';

import { whenDue } from '../when-due';

import ReviewPage from './ReviewPage';

vi.mock('../../content', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../content')>();
  const loc = {
    subjectId: 'maths',
    coursePath: 'maths/c',
    course: { schemaVersion: 1, id: 'c', title: 'Course', subject: 'maths', level: 'alevel', description: '', modules: [] },
    moduleRef: { id: 'm1', dir: 'm1' },
    module: {
      schemaVersion: 1,
      id: 'm1',
      title: 'Module One',
      description: '',
      estMinutes: 5,
      prerequisites: [],
      objectives: [],
      lessons: [{ id: 'l1', title: 'Lesson One', file: 'l1.screens.json', kind: 'screens', estMinutes: 5 }],
      version: '1.0.0',
      authors: [],
    },
  };
  return {
    ...actual,
    findModule: vi.fn(async (id: string) => (id === 'm1' ? loc : null)),
    loadScreenSequence: vi.fn(async () => ({
      schemaVersion: 1,
      id: 'l1',
      title: 'Lesson One',
      screens: [
        {
          type: 'tap-choice',
          id: 'capital',
          prompt: 'Capital of France?',
          choices: [{ text: 'Lyon', feedback: 'Lyon is the third-largest city.' }, { text: 'Paris' }],
          correctIndex: 1,
          successFeedback: 'Paris has been the capital since 987.',
        },
      ],
    })),
  };
});

function due(itemId: string, moduleId = 'm1'): ReviewState {
  const t = Date.now() - 3 * 86_400_000;
  return {
    moduleId,
    itemId,
    easinessFactor: 2.5,
    intervalDays: 2,
    repetitions: 1,
    dueAt: t,
    lastReviewedAt: t,
    lastQuality: 4,
    updatedAt: t,
    stability: 2.3,
    difficulty: 5,
  };
}

function renderReview(path = '/review') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ReviewPage />
    </MemoryRouter>,
  );
}

beforeEach(async () => {
  await db.open();
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe('ReviewPage (D-033)', () => {
  it('explains how the queue fills when nothing has ever been tracked', async () => {
    renderReview();
    expect(await screen.findByText('Your review queue fills up as you learn')).toBeInTheDocument();
  });

  it('asks the real question; a sure, correct answer is marked and scheduled', async () => {
    await db.reviewState.put(due('screen:l1:capital'));
    const user = userEvent.setup();
    renderReview();

    expect(await screen.findByText(/1 item to review/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Start review' }));

    expect(await screen.findByText('Capital of France?')).toBeInTheDocument();
    expect(screen.getByText(/Lesson One · Module One/)).toBeInTheDocument();
    // Can't lock in before answering.
    expect(screen.getByRole('button', { name: 'Sure' })).toBeDisabled();

    await user.click(screen.getByRole('radio', { name: 'Paris' }));
    await user.click(screen.getByRole('button', { name: 'Sure' }));
    expect(screen.getByText('Correct!')).toBeInTheDocument();
    expect(screen.getByText('Paris has been the capital since 987.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(await screen.findByText('Session complete')).toBeInTheDocument();
    expect(screen.getByText('1/1')).toBeInTheDocument();

    await vi.waitFor(async () => {
      const row = await db.reviewState.get(['m1', 'screen:l1:capital']);
      expect(row!.stability!).toBeGreaterThan(2.3); // a spaced success grows stability
      expect(row!.dueAt).toBeGreaterThan(Date.now());
      const cal = await db.kv.get('calibration');
      expect(cal!.value).toMatchObject({ sure: { answered: 1, correct: 1 } });
    });
  });

  it('a confident mistake gets hypercorrection feedback, then comes back once in-session', async () => {
    await db.reviewState.put(due('screen:l1:capital'));
    const user = userEvent.setup();
    renderReview('/review?start=1'); // ?start=1 skips the intro

    await user.click(await screen.findByRole('radio', { name: 'Lyon' }));
    await user.click(screen.getByRole('button', { name: 'Sure' }));
    expect(screen.getByText('You were sure — and it was something else.')).toBeInTheDocument();
    expect(screen.getByText('Lyon is the third-largest city.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    // Relearning pass.
    expect(await screen.findByText(/Second pass/)).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Paris' }));
    await user.click(screen.getByRole('button', { name: 'Think so' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('Session complete')).toBeInTheDocument();
    expect(screen.getByText('0/1')).toBeInTheDocument();
    expect(screen.getByText('Confident mistakes fixed')).toBeInTheDocument();

    await vi.waitFor(async () => {
      const row = await db.reviewState.get(['m1', 'screen:l1:capital']);
      expect(row!.lapses).toBe(1);
      expect(row!.intervalDays).toBeLessThanOrEqual(2); // relearned, but due again soon
    });
  });

  it('drops items whose content no longer exists', async () => {
    await db.reviewState.put(due('screen:l1:deleted-screen'));
    renderReview();
    expect(await screen.findByText('Your review queue fills up as you learn')).toBeInTheDocument();
    expect(await db.reviewState.count()).toBe(0);
  });
});

describe('whenDue', () => {
  it('phrases due times coarsely', () => {
    const now = new Date(2026, 5, 10, 9, 0).getTime();
    expect(whenDue(now - 1, now)).toBe('now');
    expect(whenDue(now + 30 * 60_000, now)).toBe('within the hour');
    expect(whenDue(now + 5 * 3_600_000, now)).toBe('later today');
    expect(whenDue(now + 24 * 3_600_000, now)).toBe('tomorrow');
    expect(whenDue(now + 4 * 86_400_000, now)).toBe('in 4 days');
  });
});
