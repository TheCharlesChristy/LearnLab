import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  coreChoicePlugin,
  coreEntryPlugin,
  coreFadedStepPlugin,
  coreFlashRecallPlugin,
  corePredictPlugin,
  coreRevealPlugin,
  coreSortMatchPlugin,
} from './core-screen-plugins';
import CoreScreenActivity from './CoreScreenActivity';
import type { CoreScreenActivityProps } from './core-screen-plugins';

function renderCoreScreen(props: CoreScreenActivityProps) {
  const reportOutcome = vi.fn();
  const view = render(
    <CoreScreenActivity
      props={props}
      context={{ seed: 'core-adapter-test', activityInstanceId: 'core-adapter-test', attempt: 0 }}
      disabled={false}
      reportOutcome={reportOutcome}
    />,
  );
  return { reportOutcome, unmount: view.unmount };
}

function fixture(plugin: { previewFixtures: readonly { props: CoreScreenActivityProps }[] }) {
  const item = plugin.previewFixtures[0];
  if (!item) throw new Error('Core interaction fixture is required.');
  return item.props;
}

describe('core screen ActivityPlugin adapters (#43)', () => {
  it('keeps prediction and choice controls gated while emitting their normalised traces once', async () => {
    const user = userEvent.setup();
    const prediction = renderCoreScreen(fixture(corePredictPlugin));
    expect(screen.getByRole('button', { name: 'Finish' })).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: 'Safe' }));
    await user.click(screen.getByRole('button', { name: 'Finish' }));
    await user.click(screen.getByRole('button', { name: 'Finish' }));
    expect(prediction.reportOutcome).toHaveBeenCalledTimes(1);
    expect(prediction.reportOutcome).toHaveBeenCalledWith(
      corePredictPlugin.previewFixtures[0]!.expectedOutcome,
    );
    prediction.unmount();

    const choice = renderCoreScreen(fixture(coreChoicePlugin));
    await user.click(screen.getByRole('radio', { name: 'Safe' }));
    await user.click(screen.getByRole('button', { name: 'Finish' }));
    expect(choice.reportOutcome).toHaveBeenCalledWith(
      coreChoicePlugin.previewFixtures[0]!.expectedOutcome,
    );
  });

  it('retains numeric/text generation and self-explanation gates while reporting answers', async () => {
    const user = userEvent.setup();
    const entry = renderCoreScreen(fixture(coreEntryPlugin));
    await user.type(screen.getByLabelText('Your answer'), '6');
    await user.click(screen.getByRole('button', { name: 'Check' }));
    await user.click(screen.getByRole('button', { name: 'Finish' }));
    expect(entry.reportOutcome).toHaveBeenCalledWith(
      coreEntryPlugin.previewFixtures[0]!.expectedOutcome,
    );
    entry.unmount();

    const reveal = renderCoreScreen(fixture(coreRevealPlugin));
    await user.type(screen.getByLabelText('Explain why.'), 'It avoids the hazard.');
    await user.click(screen.getByRole('button', { name: 'Check my thinking' }));
    await user.click(screen.getByRole('button', { name: 'Finish' }));
    expect(reveal.reportOutcome).toHaveBeenCalledWith(
      coreRevealPlugin.previewFixtures[0]!.expectedOutcome,
    );
  });

  it('normalises faded-step, match, and flash-recall completion without changing their button interactions', async () => {
    const user = userEvent.setup();
    const faded = renderCoreScreen(fixture(coreFadedStepPlugin));
    await user.type(screen.getByLabelText('Your answer'), '4');
    await user.click(screen.getByRole('button', { name: 'Check' }));
    await user.click(screen.getByRole('button', { name: 'Finish' }));
    expect(faded.reportOutcome).toHaveBeenCalledWith(
      coreFadedStepPlugin.previewFixtures[0]!.expectedOutcome,
    );
    faded.unmount();

    const matching = renderCoreScreen(fixture(coreSortMatchPlugin));
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    await user.click(screen.getByRole('button', { name: 'Safe' }));
    await user.click(screen.getByRole('button', { name: 'Blocked' }));
    await user.click(screen.getByRole('button', { name: 'Unsafe' }));
    await user.click(screen.getByRole('button', { name: 'Finish' }));
    expect(matching.reportOutcome).toHaveBeenCalledWith(
      coreSortMatchPlugin.previewFixtures[0]!.expectedOutcome,
    );
    matching.unmount();

    const recall = renderCoreScreen(fixture(coreFlashRecallPlugin));
    await user.click(screen.getByRole('button', { name: /show me/i }));
    await user.click(screen.getByRole('button', { name: 'Got it' }));
    await user.click(screen.getByRole('button', { name: 'Finish' }));
    expect(recall.reportOutcome).toHaveBeenCalledWith(
      coreFlashRecallPlugin.previewFixtures[0]!.expectedOutcome,
    );
  });
});
