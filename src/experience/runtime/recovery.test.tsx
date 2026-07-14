import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { projectRunBoundary, projectRunStart } from '../run-state';
import type { ExperienceRun, RunBoundaryInput } from '../run-state';
import type { ExperienceGraph } from '../types';

import { SceneRunner } from './SceneRunner';

const graph: ExperienceGraph = {
  schemaVersion: 2,
  id: 'recovery-experience',
  packId: 'recovery-pack',
  version: '1.0.0',
  stateVersion: '1.0.0',
  entryNodeId: 'finish',
  nodes: [
    {
      id: 'finish',
      kind: 'ending',
      presentation: { kind: 'explanation', body: 'The repaired relay is transmitting.' },
      effects: [],
      termination: { status: 'complete', summary: 'Mission complete.' },
    },
  ],
};

describe('SceneRunner terminal persistence and recovery (#65)', () => {
  it('persists an ending exactly once, offers keyboard retry after a failed write, and stays complete after reload', async () => {
    const user = userEvent.setup();
    let persisted = projectRunStart({
      runId: 'terminal-recovery',
      eventId: 'start',
      packId: graph.packId,
      experienceId: graph.id,
      packVersion: graph.version,
      experienceVersion: graph.version,
      stateVersion: graph.stateVersion,
      entryNodeId: graph.entryNodeId,
      occurredAt: 1,
    });
    let attempts = 0;
    const appendBoundary = vi.fn(async (_runId: string, input: RunBoundaryInput) => {
      attempts += 1;
      if (attempts === 1) throw new Error('temporary local write failure');
      persisted = projectRunBoundary(persisted, {
        ...input,
        runId: persisted.runId,
        schemaVersion: 1,
        sequence: persisted.eventCount,
        occurredAt: persisted.eventCount + 1,
        kind: 'boundary-applied',
      });
      return persisted;
    });

    function Harness({ initialRun }: { initialRun: ExperienceRun }) {
      const [run, setRun] = useState(initialRun);
      return (
        <SceneRunner
          graph={graph}
          run={run}
          onRunChange={setRun}
          persistence={{ appendBoundary }}
          createEventId={(node, sequence) => `${node}:${sequence}`}
          development={false}
          renderActivity={() => null}
        />
      );
    }

    const view = render(<Harness initialRun={persisted} />);
    await expect(screen.findByRole('heading', { name: 'Complete' })).resolves.toBeVisible();
    const retry = await screen.findByRole('button', { name: 'Try again' });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'We could not save the end of this experience. Your progress has not changed.',
    );
    retry.focus();
    await user.keyboard('{Enter}');

    await waitFor(() => expect(persisted.ending).toBe('complete'));
    expect(appendBoundary).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    // Recreating the learner view with the persisted projection is the same
    // recovery boundary a route reload uses; it must never write a second end.
    view.unmount();
    render(<Harness initialRun={persisted} />);
    await expect(screen.findByRole('heading', { name: 'Complete' })).resolves.toBeVisible();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(appendBoundary).toHaveBeenCalledTimes(2);
  });
});
