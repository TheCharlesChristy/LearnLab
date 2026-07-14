import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { extractSpeakableContent } from '../../tts/extract-speakable-text';

import {
  EnvironmentalStatus,
  SceneActivity,
  SceneBriefing,
  SceneConsequence,
  SceneDebrief,
  SceneDialogue,
  SceneError,
  SceneObjective,
  SceneShell,
  SceneTransition,
} from './ScenePresentation';

function CompleteScene({ consequence = false, transition = false, error = false }: {
  consequence?: boolean;
  transition?: boolean;
  error?: boolean;
}) {
  return (
    <SceneShell sceneLabel="Scene 2" resetKey="scene-2">
      <SceneBriefing eyebrow="Mission briefing" title="Restore the relay">
        The station has lost contact with its weather relay.
      </SceneBriefing>
      <SceneObjective>Calibrate the receiver before the storm arrives.</SceneObjective>
      <EnvironmentalStatus items={[{ label: 'Wind', value: '18 km/h' }, { label: 'Signal', value: 'Weak' }]} />
      <SceneDialogue speaker="Ari, field engineer">Start with the antenna angle.</SceneDialogue>
      <SceneActivity>
        <button type="button">Calibrate antenna</button>
      </SceneActivity>
      <SceneConsequence revealed={consequence}>The relay locks onto the beacon.</SceneConsequence>
      <SceneTransition active={transition}>Choose whether to transmit now or collect another reading.</SceneTransition>
      <SceneError visible={error}>The saved reading could not be restored.</SceneError>
      <SceneDebrief>The receiver was calibrated from measured evidence.</SceneDebrief>
    </SceneShell>
  );
}

describe('SceneShell presentation primitives (#51)', () => {
  it('gives objective, activity, consequence, and next decision distinct semantic hierarchy', async () => {
    const user = userEvent.setup();
    render(<CompleteScene consequence transition />);

    expect(screen.getByRole('heading', { name: 'Objective' })).toHaveProperty('tagName', 'H2');
    expect(screen.getByRole('heading', { name: 'Activity' })).toHaveProperty('tagName', 'H2');
    expect(screen.getByRole('heading', { name: 'Consequence' })).toHaveProperty('tagName', 'H2');
    expect(screen.getByRole('heading', { name: 'Next decision' })).toHaveProperty('tagName', 'H2');
    expect(screen.getByRole('button', { name: 'Calibrate antenna' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: /continue|next|finish/i })).not.toBeInTheDocument();

    // The shell only presents an activity. It cannot turn an arbitrary click
    // into a revealed outcome or a navigable transition.
    await user.click(screen.getByRole('button', { name: 'Calibrate antenna' }));
    expect(screen.getByText('The relay locks onto the beacon.')).toBeInTheDocument();
  });

  it('does not reveal an outcome when an activity is merely clicked', async () => {
    const user = userEvent.setup();
    render(<CompleteScene />);
    await user.click(screen.getByRole('button', { name: 'Calibrate antenna' }));
    expect(screen.queryByRole('heading', { name: 'Consequence' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Next decision' })).not.toBeInTheDocument();
  });

  it('moves focus and exposes live announcements only when reveal, transition, and error states enter', () => {
    const view = render(<CompleteScene />);
    expect(screen.queryByRole('heading', { name: 'Consequence' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Next decision' })).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    view.rerender(<CompleteScene consequence />);
    expect(screen.getByRole('heading', { name: 'Consequence' })).toHaveFocus();
    expect(screen.getByText('Consequence revealed.')).toHaveAttribute('aria-live', 'polite');

    view.rerender(<CompleteScene consequence transition />);
    expect(screen.getByRole('heading', { name: 'Next decision' })).toHaveFocus();
    expect(screen.getByText('Next decision available.')).toHaveAttribute('aria-live', 'polite');

    view.rerender(<CompleteScene consequence transition error />);
    expect(screen.getByRole('alert')).toHaveAttribute('aria-labelledby');
    expect(screen.getByRole('heading', { name: 'Something needs attention' })).toHaveFocus();
  });

  it('keeps decorative chrome and live messages out of read-aloud text', () => {
    const { getByTestId } = render(<CompleteScene consequence transition />);
    const readable = getByTestId('scene-shell-readable');
    const text = extractSpeakableContent(readable);

    expect(text.text).toContain('Restore the relay');
    expect(text.text).toContain('Calibrate the receiver before the storm arrives.');
    expect(text.text).toContain('The relay locks onto the beacon.');
    expect(text.text).not.toContain('Scene 2');
    expect(text.text).not.toContain('Consequence revealed.');
    expect(text.text).not.toContain('Next decision available.');
  });

  it('uses responsive layout and suppresses reveal motion for reduced-motion users', () => {
    const { container } = render(<CompleteScene consequence transition />);
    expect(container.querySelector('dl')).toHaveClass('sm:grid-cols-2', 'lg:grid-cols-3');
    for (const region of container.querySelectorAll('.motion-safe\\:animate-reveal-in')) {
      expect(region).toHaveClass('motion-reduce:animate-none');
    }
  });

  it('uses semantic text structures that retain their meaning in print', () => {
    const { container } = render(<CompleteScene consequence transition />);
    expect(container.querySelector('blockquote')).toHaveTextContent('Start with the antenna angle.');
    expect(container.querySelector('figcaption')).toHaveTextContent('Ari, field engineer');
    expect(container.querySelector('dl')).toHaveTextContent('Wind');
    expect(container.querySelector('dl')).toHaveTextContent('18 km/h');
    expect(container.querySelector('[class*="print:hidden"]')).not.toBeInTheDocument();
  });
});
