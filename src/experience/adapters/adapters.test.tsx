import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { ScreenSequence } from '../../screens';

import {
  adaptScreenSequence,
  LegacyMarkdownExperience,
  V1ScreenActivityAdapter,
  coreChoicePlugin,
} from './index';
import { getActivityPlugin } from '../plugins';

const sequence: ScreenSequence = {
  schemaVersion: 1,
  id: 'legacy-sequence',
  title: 'Legacy sequence',
  screens: [
    {
      type: 'tap-choice',
      id: 'choose',
      prompt: 'Choose the right answer.',
      choices: [{ text: 'Wrong' }, { text: 'Right' }],
      correctIndex: 1,
      successFeedback: 'Exactly.',
    },
  ],
};

describe('v1 content adapters (#40)', () => {
  it('maps a representative gated screen sequence to a linear checkpointed graph', () => {
    const graph = adaptScreenSequence(sequence, { packId: 'legacy-pack', lessonId: 'lesson-1' });
    expect(graph.entryNodeId).toBe('choose');
    expect(graph.nodes.map((node) => node.id)).toEqual(['choose', '__complete__']);
    const first = graph.nodes[0];
    if (!first || first.kind !== 'scene') throw new Error('fixture must start with a scene');
    expect(first).toMatchObject({
      kind: 'scene',
      goal: { operator: 'activity-complete' },
      effects: [{ operator: 'checkpoint', label: 'Legacy screen: choose' }],
      transitions: { fallback: { to: '__complete__' } },
    });
    expect(getActivityPlugin(first.activity.key)).toBe(coreChoicePlugin);
    expect(getActivityPlugin(first.activity.key)?.version).toBe(first.activity.version);
  });

  it('delegates v1 gating to the original runner and emits exactly one normalised completion', async () => {
    const user = userEvent.setup();
    const graph = adaptScreenSequence(sequence, { packId: 'legacy-pack', lessonId: 'lesson-1' });
    const scene = graph.nodes[0];
    if (!scene || scene.kind !== 'scene') throw new Error('fixture must have one scene');
    const props = scene.activity.props as unknown as {
      legacyLessonId: string;
      screen: ScreenSequence['screens'][number];
      index: number;
      total: number;
    };
    const reportOutcome = vi.fn();
    render(
      <V1ScreenActivityAdapter props={props} disabled={false} reportOutcome={reportOutcome} />,
    );
    const finish = screen.getByRole('button', { name: 'Finish' });
    expect(finish).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: 'Right' }));
    await user.click(finish);
    await user.click(finish);
    expect(reportOutcome).toHaveBeenCalledTimes(1);
    expect(reportOutcome).toHaveBeenCalledWith({ completed: true });
  });

  it('keeps legacy Markdown searchable, printable, and read-aloud ready through the existing renderer', async () => {
    const print = vi.fn();
    vi.stubGlobal('print', print);
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        speak: vi.fn(),
        cancel: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
        speaking: false,
        paused: false,
      },
    });
    class MockUtterance {
      onboundary: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      rate = 1;
      constructor(public text: string) {}
    }
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: MockUtterance,
    });
    render(
      <LegacyMarkdownExperience title="Legacy document" markdown={'# Heading\n\nReadable body.'} />,
    );
    const article = screen.getByRole('article', { name: 'Legacy document' });
    // Search consumes generated source text; the wrapper keeps that text in
    // semantic DOM rather than hiding or replacing it with an image/canvas.
    expect(article).toHaveTextContent('Readable body.');
    const controls = article.querySelector('.print\\:hidden');
    expect(controls?.contains(screen.getByText('Readable body.'))).toBe(false);
    expect(screen.getByRole('button', { name: 'Read aloud' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Print this lesson' }));
    expect(print).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });
});
