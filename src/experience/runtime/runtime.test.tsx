import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { projectRunBoundary, projectRunStart } from '../run-state';
import type { ExperienceRun, RunBoundaryInput, StartExperienceRunInput } from '../run-state';
import type { ExperienceGraph } from '../types';

import { SceneRunner } from './SceneRunner';
import { evaluateCondition, evaluateGoal } from './evaluation';
import { planSceneAdvance, selectTransition } from './traversal';

const START: StartExperienceRunInput = {
  runId: 'runtime-test',
  eventId: 'created',
  packId: 'pack',
  experienceId: 'experience',
  packVersion: '1.0.0',
  experienceVersion: '1.0.0',
  stateVersion: '1.0.0',
  entryNodeId: 'start',
  initialVariables: { '/route': 'right' },
  occurredAt: 1,
};

const graph: ExperienceGraph = {
  schemaVersion: 2,
  id: 'experience',
  packId: 'pack',
  version: '1.0.0',
  stateVersion: '1.0.0',
  entryNodeId: 'start',
  nodes: [
    {
      id: 'start',
      kind: 'scene',
      presentation: { kind: 'briefing', title: 'Start', body: 'Act.' },
      activity: { key: 'choice', version: '1.0.0', props: {} },
      goal: { operator: 'activity-complete' },
      feedback: { success: 'Done.' },
      effects: [{ operator: 'set', path: '/route', value: 'left' }],
      transitions: {
        branches: [
          { when: { operator: 'state-equals', path: '/route', value: 'left' }, to: 'left' },
        ],
        fallback: { to: 'right' },
      },
    },
    {
      id: 'left',
      kind: 'scene',
      presentation: { kind: 'explanation', body: 'Left.' },
      activity: { key: 'choice', version: '1.0.0', props: {} },
      goal: { operator: 'activity-complete' },
      feedback: { success: 'Done.' },
      effects: [],
      transitions: { branches: [], fallback: { to: 'finish' } },
    },
    {
      id: 'right',
      kind: 'scene',
      presentation: { kind: 'explanation', body: 'Right.' },
      activity: { key: 'choice', version: '1.0.0', props: {} },
      goal: { operator: 'activity-complete' },
      feedback: { success: 'Done.' },
      effects: [],
      transitions: { branches: [], fallback: { to: 'finish' } },
    },
    {
      id: 'finish',
      kind: 'ending',
      presentation: { kind: 'world-event', body: 'Resolved.' },
      effects: [],
      termination: { status: 'complete', summary: 'All paths reconverge.' },
    },
  ],
};

describe('SceneRunner runtime semantics (#38)', () => {
  it('requires an explicit successful activity outcome and evaluates only registered goal operators', () => {
    expect(evaluateGoal({ operator: 'activity-complete' }, undefined)).toBe(false);
    expect(evaluateGoal({ operator: 'activity-complete' }, { completed: true })).toBe(true);
    expect(
      evaluateGoal({ operator: 'equals', path: '/answer', value: 6 }, { values: { '/answer': 6 } }),
    ).toBe(true);
    expect(
      evaluateGoal(
        { operator: 'regex-match', path: '/answer', pattern: '[' },
        { values: { '/answer': 'x' } },
      ),
    ).toBe(false);
  });

  it('uses ordered branches after effects, then reconverges at the declared terminal node', () => {
    const run = projectRunStart(START);
    const first = planSceneAdvance(graph, run, 'first', { outcome: { completed: true } });
    expect(first?.target.id).toBe('left');
    expect(first?.transition.conditional).toBe(true);

    const leftRun = projectRunBoundary(run, {
      runId: run.runId,
      schemaVersion: 1,
      sequence: run.eventCount,
      eventId: 'first',
      occurredAt: 2,
      kind: 'boundary-applied',
      nodeId: 'start',
      effects: graph.nodes[0]!.kind === 'scene' ? graph.nodes[0]!.effects : [],
      nextNodeId: 'left',
    });
    expect(
      planSceneAdvance(graph, leftRun, 'second', { outcome: { completed: true } })?.target.id,
    ).toBe('finish');

    const rightRun: ExperienceRun = {
      ...run,
      currentNodeId: 'right',
      branchHistory: ['start', 'right'],
    };
    expect(
      planSceneAdvance(graph, rightRun, 'third', { outcome: { completed: true } })?.target.id,
    ).toBe('finish');
  });

  it('keeps compositional conditions pure and falls back deterministically', () => {
    const context = {
      state: { '/x': 2 },
      outcome: { values: { '/answer': 'yes' } },
      masteryBySkill: { force: 'secure' as const },
    };
    expect(
      evaluateCondition(
        {
          operator: 'all',
          conditions: [
            { operator: 'state-in', path: '/x', values: [1, 2] },
            {
              operator: 'not',
              condition: { operator: 'outcome-equals', path: '/answer', value: 'no' },
            },
            { operator: 'mastery-band', skillId: 'force', band: 'secure' },
          ],
        },
        context,
      ),
    ).toBe(true);
    expect(
      selectTransition(
        {
          branches: [{ when: { operator: 'state-equals', path: '/x', value: 3 }, to: 'never' }],
          fallback: { to: 'fallback' },
        },
        context,
      ),
    ).toEqual({ to: 'fallback', conditional: false, label: undefined });
  });

  it('gates the UI, resets failed-scene local state, and persists terminal completion once', async () => {
    const user = userEvent.setup();
    let persisted = projectRunStart({ ...START, entryNodeId: 'gate', runId: 'gate-run' });
    const gateGraph: ExperienceGraph = {
      ...graph,
      entryNodeId: 'gate',
      nodes: [
        {
          id: 'gate',
          kind: 'scene',
          presentation: { kind: 'briefing', title: 'Gate', body: 'Choose.' },
          activity: { key: 'choice', version: '1.0.0', props: {} },
          goal: { operator: 'equals', path: '/answer', value: 'right' },
          feedback: { success: 'Correct.', failure: 'Not yet.' },
          effects: [{ operator: 'set', path: '/passed', value: true }],
          transitions: {
            branches: [
              { when: { operator: 'state-equals', path: '/passed', value: true }, to: 'finish' },
            ],
            fallback: { to: 'finish' },
          },
        },
        graph.nodes[3]!,
      ],
    };
    const appendBoundary = vi.fn(async (_runId: string, input: RunBoundaryInput) => {
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

    function ChoiceActivity({
      reportOutcome,
      disabled,
    }: {
      reportOutcome: (outcome: { completed: boolean; values: { '/answer': string } }) => void;
      disabled: boolean;
    }) {
      const [answer, setAnswer] = useState('');
      return (
        <div>
          <p>{answer || 'No answer chosen'}</p>
          <button disabled={disabled} onClick={() => setAnswer('wrong')}>
            Wrong
          </button>
          <button disabled={disabled} onClick={() => setAnswer('right')}>
            Right
          </button>
          <button
            disabled={disabled}
            onClick={() => reportOutcome({ completed: true, values: { '/answer': answer } })}
          >
            Submit
          </button>
        </div>
      );
    }
    function Harness() {
      const [run, setRun] = useState(persisted);
      return (
        <SceneRunner
          graph={gateGraph}
          run={run}
          onRunChange={setRun}
          persistence={{ appendBoundary }}
          createEventId={(node, sequence) => `${node}-${sequence}`}
          development={false}
          renderActivity={({ reportOutcome, disabled }) => (
            <ChoiceActivity reportOutcome={reportOutcome} disabled={disabled} />
          )}
        />
      );
    }
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Wrong' }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByText('Not yet.')).toBeInTheDocument();
    expect(appendBoundary).not.toHaveBeenCalled();
    expect(screen.getByText('No answer chosen')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Right' }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByText('All paths reconverge.')).toBeInTheDocument();
    await waitFor(() => expect(persisted.ending).toBe('complete'));
    expect(appendBoundary).toHaveBeenCalledTimes(2);
  });
});
