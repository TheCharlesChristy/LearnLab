import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ReviewCard } from './ReviewCard';
import type { ResolvedReviewItem, ReviewCardContent } from './types';

afterEach(cleanup);

function item(card: ReviewCardContent): ResolvedReviewItem {
  return {
    moduleId: 'm',
    itemId: 'i',
    source: { moduleId: 'm', moduleTitle: 'M', courseTitle: 'C', href: '/module/m' },
    card,
  };
}

describe('ReviewCard', () => {
  it('recall: attempt, reveal, then self-grade on the 4-point scale', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    render(<ReviewCard item={item({ kind: 'recall', front: 'Define entropy', back: 'Expected surprise.' })} attempt={0} onDone={onDone} />);
    expect(screen.queryByText('Expected surprise.')).not.toBeInTheDocument();
    await user.type(screen.getByRole('textbox'), 'average surprise');
    await user.click(screen.getByRole('button', { name: 'Show answer' }));
    expect(screen.getByText('Expected surprise.')).toBeInTheDocument();
    expect(screen.getByText('average surprise')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Forgot' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Hard' }));
    expect(onDone).toHaveBeenCalledWith({ grade: 'hard', correct: true });
  });

  it('entry: marks numerics with tolerance; a correct guess schedules as hard', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    render(
      <ReviewCard
        item={item({ kind: 'entry', prompt: 'g?', inputMode: 'numeric', answer: 9.81, tolerance: 0.01, unit: 'm/s²' })}
        attempt={0}
        onDone={onDone}
      />,
    );
    const input = screen.getByRole('textbox');
    await user.type(input, 'abc');
    expect(screen.getByText(/Enter a number/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guessing' })).toBeDisabled();
    await user.clear(input);
    await user.type(input, '9.8');
    await user.click(screen.getByRole('button', { name: 'Guessing' }));
    expect(screen.getByText(/lucky guess/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onDone).toHaveBeenCalledWith({ grade: 'hard', correct: true, confidence: 'guess' });
  });

  it('entry: a wrong text answer shows the readable model answer', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    render(
      <ReviewCard
        item={item({ kind: 'entry', prompt: 'nth odd number?', inputMode: 'text', accept: ['2n\\s*-\\s*1'], displayAnswer: '2n - 1' })}
        attempt={0}
        onDone={onDone}
      />,
    );
    await user.type(screen.getByRole('textbox'), '2n+1');
    await user.click(screen.getByRole('button', { name: 'Think so' }));
    expect(screen.getByText('2n - 1')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onDone).toHaveBeenCalledWith({ grade: 'again', correct: false, confidence: 'unsure' });
  });

  it('multi: requires the exact set', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    render(
      <ReviewCard
        item={item({ kind: 'choice', prompt: 'Primes?', choices: ['2', '4', '5'], correct: [0, 2], multi: true })}
        attempt={0}
        onDone={onDone}
      />,
    );
    await user.click(screen.getByRole('checkbox', { name: '2' }));
    await user.click(screen.getByRole('checkbox', { name: '5' }));
    await user.click(screen.getByRole('button', { name: 'Sure' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onDone).toHaveBeenCalledWith({ grade: 'good', correct: true, confidence: 'sure' });
  });

  it('match: every left item must be paired with its partner', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    render(
      <ReviewCard
        item={item({ kind: 'match', prompt: 'Match', pairs: [{ left: 'H', right: 'Hydrogen' }, { left: 'He', right: 'Helium' }] })}
        attempt={0}
        onDone={onDone}
      />,
    );
    const [first, second] = screen.getAllByRole('combobox') as HTMLSelectElement[];
    await user.selectOptions(first!, 'Helium');
    await user.selectOptions(second!, 'Hydrogen');
    await user.click(screen.getByRole('button', { name: 'Think so' }));
    expect(screen.getAllByText(/Correct:/)).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(onDone).toHaveBeenCalledWith({ grade: 'again', correct: false, confidence: 'unsure' });
  });
});
