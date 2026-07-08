// Behaviour tests for the StepReveal implementation (SRS §5.3 row):
// reveals steps one at a time via the keyboard, shows the all-revealed state
// after the last step, renders Markdown bodies, retry card on fetch failure,
// relative src resolution via LessonContext.

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

afterEach(cleanup);

import { LessonContext } from '../../content';
import type { LessonContextValue } from '../../content';

import StepReveal from './StepReveal';

function withLesson(children: ReactNode, moduleBaseUrl = '/content/modules/calc/') {
  const value: LessonContextValue = {
    moduleId: 'calc',
    moduleBaseUrl,
    recordAttempt: async () => {},
    getItemState: async () => null,
    setItemState: async () => {},
    recordReview: async () => {},
    seedReviewItem: async () => {},
    notifyEngagement: () => {},
  };
  return <LessonContext.Provider value={value}>{children}</LessonContext.Provider>;
}

const STEPS = {
  steps: [
    { title: 'Set up', body: 'Start from **first principles**.' },
    { title: 'Differentiate', body: 'Apply the power rule.' },
    { title: 'Evaluate', body: 'Substitute $x = 2$.' },
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

describe('StepReveal', () => {
  it('shows only the first step initially and a Show-next button', async () => {
    mockFetchJson(STEPS);
    render(<StepReveal src="steps.json" />);
    expect(await screen.findByText(/Step 1: Set up/)).toBeInTheDocument();
    expect(screen.queryByText(/Step 2:/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Show next step/ })).toBeInTheDocument();
  });

  it('renders step bodies as Markdown (bold rendered as <strong>)', async () => {
    mockFetchJson(STEPS);
    render(<StepReveal src="steps.json" />);
    const strong = await screen.findByText('first principles');
    expect(strong.tagName).toBe('STRONG');
  });

  it('reveals steps one at a time via the keyboard', async () => {
    mockFetchJson(STEPS);
    render(<StepReveal src="steps.json" />);
    const btn = await screen.findByRole('button', { name: /Show next step/ });

    btn.focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByText(/Step 2: Differentiate/)).toBeInTheDocument();
    expect(screen.queryByText(/Step 3:/)).not.toBeInTheDocument();

    // Button is re-rendered; query again then activate with Space.
    screen.getByRole('button', { name: /Show next step/ }).focus();
    await userEvent.keyboard(' ');
    expect(screen.getByText(/Step 3: Evaluate/)).toBeInTheDocument();
  });

  it('reports all-revealed after the last step (aria-live note + data attribute) and hides the button', async () => {
    mockFetchJson(STEPS);
    const { container } = render(<StepReveal src="steps.json" />);
    await screen.findByText(/Step 1:/);

    await userEvent.click(screen.getByRole('button', { name: /Show next step/ }));
    await userEvent.click(screen.getByRole('button', { name: /Show next step/ }));

    expect(screen.getByText('All steps revealed')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Show next step/ })).not.toBeInTheDocument();
    expect(
      container.querySelector('[data-step-reveal-complete="true"]'),
    ).not.toBeNull();
  });

  it('resolves relative src against moduleBaseUrl when lesson context is present', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200, json: async () => STEPS }));
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);
    render(withLesson(<StepReveal src="steps.json" />));
    await screen.findByText(/Step 1:/);
    expect(fetchMock).toHaveBeenCalledWith('/content/modules/calc/steps.json');
  });

  it('shows a retry card on fetch failure and retries on click', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => STEPS });
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    render(<StepReveal src="steps.json" />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent("Couldn’t load steps");

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText(/Step 1:/)).toBeInTheDocument();
  });

  it('shows an error card naming the problem on bad shape', async () => {
    mockFetchJson({ steps: [{ title: '', body: 'x' }] });
    render(<StepReveal src="steps.json" />);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Invalid steps data');
    expect(alert).toHaveTextContent('steps[0].title:');
  });
});
