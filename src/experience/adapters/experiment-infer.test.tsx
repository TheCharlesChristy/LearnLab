import { Suspense } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { experimentInferActivityPlugin } from './experiment-infer-plugin';

function renderActivity() {
  const fixture = experimentInferActivityPlugin.previewFixtures[0];
  if (!fixture) throw new Error('Experiment fixture is required.');
  const reportOutcome = vi.fn();
  const Activity = experimentInferActivityPlugin.component;
  render(
    <Suspense fallback={<p>Loading experiment</p>}>
      <Activity
        props={fixture.props}
        context={{ seed: fixture.seed, activityInstanceId: fixture.id, attempt: 0 }}
        disabled={false}
        reportOutcome={reportOutcome}
      />
    </Suspense>,
  );
  return { fixture, reportOutcome };
}

describe('experiment-and-infer ActivityPlugin (#55)', () => {
  it('requires prediction, controlled observations, supported inference, and transfer before one normalised outcome', async () => {
    const user = userEvent.setup();
    const { fixture, reportOutcome } = renderActivity();

    const low = await screen.findByRole('button', { name: 'Run low-input condition' });
    expect(low).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'It will increase' }));
    expect(low).toBeEnabled();
    await user.click(low);
    await user.click(screen.getByRole('button', { name: 'Run high-input condition' }));
    expect(screen.getByText('Low input gives a small response.')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'The response increases as the input increases.' }),
    ).toBeEnabled();
    await user.click(
      screen.getByRole('button', { name: 'The response increases as the input increases.' }),
    );
    await user.click(screen.getByRole('button', { name: 'A larger response' }));

    expect(reportOutcome).toHaveBeenCalledOnce();
    expect(reportOutcome).toHaveBeenCalledWith(fixture.expectedOutcome);
    expect(screen.getByLabelText('Experiment and infer activity')).toBeInTheDocument();
  });

  it('keeps incorrect inference and transfer as actionable local feedback, not completion', async () => {
    const user = userEvent.setup();
    const { reportOutcome } = renderActivity();
    await user.click(await screen.findByRole('button', { name: 'It will increase' }));
    await user.click(screen.getByRole('button', { name: 'Run low-input condition' }));
    await user.click(screen.getByRole('button', { name: 'Run high-input condition' }));
    await user.click(
      screen.getByRole('button', { name: 'The response decreases as the input increases.' }),
    );
    expect(screen.getByText(/does not account for every required observation/)).toBeInTheDocument();
    expect(reportOutcome).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole('button', { name: 'The response increases as the input increases.' }),
    );
    await user.click(screen.getByRole('button', { name: 'A smaller response' }));
    expect(screen.getByText(/Try the transfer case again/)).toBeInTheDocument();
    expect(reportOutcome).not.toHaveBeenCalled();
  });
});
