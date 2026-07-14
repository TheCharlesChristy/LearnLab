import 'fake-indexeddb/auto';

import { Suspense, useState } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { eraseExperienceRuns } from '../run-state';
import { replayStoredRun, startExperienceRun } from '../run-state';
import { experienceRunEventCount } from '../../progress';
import { loadResumePlan } from '../resume';
import type { ResumeTarget } from '../resume';
import { SceneRunner } from '../runtime';
import type { ExperienceRun } from '../run-state';
import { getActivityPlugin } from '../plugins';
import type { ScreenSequence } from '../../screens';

import { adaptScreenSequence } from './v1-screens';

const sequence: ScreenSequence = {
  schemaVersion: 1,
  id: 'adapter-integration',
  title: 'Adapter integration',
  screens: [
    {
      type: 'tap-choice',
      id: 'first',
      prompt: 'First choice.',
      choices: [{ text: 'No' }, { text: 'Yes' }],
      correctIndex: 1,
      successFeedback: 'First complete.',
    },
    {
      type: 'tap-choice',
      id: 'second',
      prompt: 'Second choice.',
      choices: [{ text: 'Left' }, { text: 'Right' }],
      correctIndex: 1,
      successFeedback: 'Second complete.',
    },
  ],
};

const graph = adaptScreenSequence(sequence, { packId: 'adapter-pack', lessonId: 'legacy-lesson' });

function target(migrations: ResumeTarget['pack']['state']['migrations']): ResumeTarget {
  return {
    graph: { ...graph, version: '2.0.0', stateVersion: '2.0.0' },
    pack: {
      id: graph.packId,
      version: '2.0.0',
      state: { version: '2.0.0', declarations: [], migrations },
    },
  };
}

function RuntimeHarness({ initialRun }: { initialRun: ExperienceRun }) {
  const [run, setRun] = useState(initialRun);
  return (
    <SceneRunner
      graph={graph}
      run={run}
      onRunChange={setRun}
      createEventId={(nodeId, sequenceNumber) => `adapter-${nodeId}-${sequenceNumber}`}
      development={false}
      renderActivity={({ scene, run: activeRun, reportOutcome, disabled }) => {
        const plugin = getActivityPlugin(scene.activity.key);
        if (!plugin) throw new Error(`Missing adapter activity ${scene.activity.key}`);
        const Activity = plugin.component;
        return (
          <Suspense fallback={<p>Loading adapter activity</p>}>
            <Activity
              props={scene.activity.props}
              context={{
                seed: 'adapter-integration',
                activityInstanceId: `${activeRun.runId}:${scene.id}`,
                attempt: 0,
              }}
              disabled={disabled}
              reportOutcome={(outcome) => reportOutcome({ completed: outcome.completed })}
            />
          </Suspense>
        );
      }}
    />
  );
}

beforeEach(async () => {
  await eraseExperienceRuns();
});

afterEach(() => {
  cleanup();
});

describe('adapted v1 sequence runtime integration (#40)', () => {
  it('resumes a real checkpoint, plans version changes safely, and records completion exactly once', async () => {
    const user = userEvent.setup();
    const started = await startExperienceRun({
      runId: 'adapter-run',
      eventId: 'adapter-start',
      packId: graph.packId,
      experienceId: graph.id,
      packVersion: graph.version,
      experienceVersion: graph.version,
      stateVersion: graph.stateVersion,
      entryNodeId: graph.entryNodeId,
    });

    const firstRender = render(<RuntimeHarness initialRun={started} />);
    await user.click(await screen.findByRole('radio', { name: 'Yes' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByText('Second choice.');

    const checkpointed = await replayStoredRun('adapter-run');
    expect(checkpointed.currentNodeId).toBe('second');
    expect(checkpointed.checkpoint).toMatchObject({ nodeId: 'first' });
    expect(await experienceRunEventCount('adapter-run')).toBe(2);

    // Reload uses the same public replay facade that a learner route will use.
    firstRender.unmount();
    const resumed = await replayStoredRun('adapter-run');
    render(<RuntimeHarness initialRun={resumed} />);
    expect(await screen.findByText('Second choice.')).toBeInTheDocument();

    const migrate = await loadResumePlan(
      'adapter-run',
      target([{ fromVersion: '1.0.0', toVersion: '2.0.0', strategy: 'preserve-declared-state' }]),
    );
    expect(migrate.kind).toBe('migrate');
    const reset = await loadResumePlan(
      'adapter-run',
      target([{ fromVersion: '1.0.0', toVersion: '2.0.0', strategy: 'reset' }]),
    );
    expect(reset.kind).toBe('reset');
    const fallback = await loadResumePlan('adapter-run', target([]));
    expect(fallback.kind).toBe('fallback');

    await user.click(screen.getByRole('radio', { name: 'Right' }));
    await user.click(screen.getByRole('button', { name: 'Finish' }));
    expect(await screen.findByRole('heading', { name: 'Complete' })).toBeInTheDocument();
    await waitFor(async () =>
      expect((await replayStoredRun('adapter-run')).ending).toBe('complete'),
    );
    expect(await experienceRunEventCount('adapter-run')).toBe(4);

    // Re-rendering an already completed run must not append another ending event.
    expect(await replayStoredRun('adapter-run')).toMatchObject({ ending: 'complete' });
    expect(await experienceRunEventCount('adapter-run')).toBe(4);
  });
});
