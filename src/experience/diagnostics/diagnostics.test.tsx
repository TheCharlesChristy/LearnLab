import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { MasteryEvidence } from '../mastery';
import type { ExperienceEvent, ExperienceRun } from '../run-state';
import type { ExperienceGraph } from '../types';

import { DiagnosticsDashboard } from './DiagnosticsDashboard';
import { createPlaytestExport, parsePlaytestExport } from './export';
import { buildDiagnostics, compareDiagnostics } from './project';
import { TesterDiagnosticsPanel } from './TesterDiagnosticsPanel';

const run: ExperienceRun = {
  runId: 'r1',
  schemaVersion: 1,
  packId: 'pack',
  experienceId: 'episode',
  packVersion: '1',
  experienceVersion: '1',
  stateVersion: '1',
  currentNodeId: 'end',
  variables: {},
  unlockedCapabilityIds: [],
  branchHistory: ['start', 'end'],
  evidence: [],
  celebrations: [],
  ending: 'complete',
  eventCount: 2,
  createdAt: 1_000,
  updatedAt: 2_000,
};
const initialRun = {
  runId: run.runId,
  schemaVersion: run.schemaVersion,
  packId: run.packId,
  experienceId: run.experienceId,
  packVersion: run.packVersion,
  experienceVersion: run.experienceVersion,
  stateVersion: run.stateVersion,
  currentNodeId: run.currentNodeId,
  variables: run.variables,
  unlockedCapabilityIds: run.unlockedCapabilityIds,
  branchHistory: run.branchHistory,
  evidence: run.evidence,
  celebrations: run.celebrations,
  ending: run.ending,
};
const events: ExperienceEvent[] = [
  {
    kind: 'run-created',
    runId: 'r1',
    schemaVersion: 1,
    sequence: 0,
    eventId: 'start',
    occurredAt: 1_000,
    initial: initialRun,
  },
  {
    kind: 'boundary-applied',
    runId: 'r1',
    schemaVersion: 1,
    sequence: 1,
    eventId: 'advance',
    occurredAt: 2_000,
    nodeId: 'start',
    nextNodeId: 'end',
    ending: 'complete',
    effects: [],
    telemetry: { attempts: 2, hintsUsed: 1 },
  },
];
const graph: ExperienceGraph = {
  schemaVersion: 2,
  id: 'episode',
  packId: 'pack',
  version: '1',
  stateVersion: '1',
  entryNodeId: 'start',
  nodes: [
    {
      id: 'start',
      kind: 'scene',
      presentation: { kind: 'briefing', body: 'Start' },
      activity: { key: 'choice', version: '1', props: {} },
      goal: { operator: 'activity-complete' },
      feedback: { success: 'ok' },
      effects: [],
      transitions: {
        branches: [{ when: { operator: 'state-equals', path: '/x', value: true }, to: 'end' }],
        fallback: { to: 'end' },
      },
    },
    {
      id: 'end',
      kind: 'ending',
      presentation: { kind: 'explanation', body: 'End' },
      termination: { status: 'complete', summary: 'End' },
    },
  ],
};
const evidence: MasteryEvidence[] = [
  {
    schemaVersion: 1,
    id: 'review',
    occurredAt: 2_000 + 24 * 60 * 60 * 1000,
    skillId: 'skill',
    source: 'review',
    content: { packId: 'pack', packVersion: '1' },
    opportunity: 'retrieval',
    outcome: 'success',
    support: 'independent',
    hintUse: 'none',
    hintCount: 0,
    confidence: 'sure',
    latency: 'expected',
    transfer: 'same-context',
  },
];

describe('local playtest diagnostics (#62)', () => {
  it('projects bounded local records into the required privacy-safe measures', () => {
    const summary = buildDiagnostics({
      sessionLabel: 'vertical slice',
      runs: [run],
      events,
      evidence,
      graphs: [graph],
      generatedAt: 9,
    });
    expect(summary).toMatchObject({
      sessionLabel: 'vertical slice',
      timeToFirstAction: { samples: 1, medianMs: 1000 },
      attempts: { reported: 2 },
      hints: { reported: 1 },
      continuation: { eligibleCompletions: 1, continued: 0, rate: 0 },
      delayedOutcomes: { eligibleEvidence: 1, successes: 1, rate: 1 },
    });
    expect(summary.nodeExits).toEqual([{ id: 'start', count: 1 }]);
    expect(summary.branches).toEqual([{ id: 'start → end', count: 1 }]);
  });

  it('requires explicit consent, exports only named summaries, and rejects bad imports without writes', () => {
    const summary = buildDiagnostics({
      sessionLabel: 'baseline',
      runs: [run],
      events,
      evidence: [],
      graphs: [graph],
    });
    expect(() =>
      createPlaytestExport([summary], { confirmed: false as never, confirmedAt: 1 }),
    ).toThrow(/explicit tester confirmation/);
    const exported = createPlaytestExport([summary], { confirmed: true, confirmedAt: 2 }, 3);
    expect(exported.includedFields.map((field) => field.name)).toContain('delayedOutcomes');
    expect(exported).not.toHaveProperty('events');
    expect(parsePlaytestExport(exported).sessions).toHaveLength(1);
    expect(() => parsePlaytestExport({ kind: 'wrong' })).toThrow(/not a supported/);
  });

  it('renders a local baseline-versus-slice comparison dashboard', () => {
    const baseline = buildDiagnostics({
      sessionLabel: 'baseline',
      runs: [run],
      events,
      evidence: [],
      graphs: [graph],
    });
    const slice = buildDiagnostics({
      sessionLabel: 'slice',
      runs: [run],
      events,
      evidence,
      graphs: [graph],
    });
    render(<DiagnosticsDashboard comparison={compareDiagnostics(baseline, slice)} />);
    expect(screen.getByRole('heading', { name: 'Local playtest comparison' })).toBeInTheDocument();
    expect(screen.getByText(/No data is sent anywhere/)).toBeInTheDocument();
    expect(
      screen.getByRole('rowheader', { name: 'Delayed outcome success rate' }),
    ).toBeInTheDocument();
  });

  it('gates tester export on an affirmative control and recovers from malformed local imports', async () => {
    const user = userEvent.setup();
    const exported = vi.fn();
    const baseline = buildDiagnostics({
      sessionLabel: 'baseline',
      runs: [run],
      events,
      evidence: [],
      graphs: [graph],
    });
    const slice = buildDiagnostics({
      sessionLabel: 'slice',
      runs: [run],
      events,
      evidence,
      graphs: [graph],
    });
    render(
      <TesterDiagnosticsPanel baseline={baseline} verticalSlice={slice} onExport={exported} />,
    );
    expect(screen.getByRole('button', { name: 'Export diagnostics' })).toBeDisabled();
    expect(screen.getByText('delayedOutcomes')).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: /explicitly agree/i }));
    await user.click(screen.getByRole('button', { name: 'Export diagnostics' }));
    expect(exported).toHaveBeenCalledWith(expect.objectContaining({ sessions: [baseline, slice] }));

    const input = screen.getByLabelText('Import diagnostics file for local comparison');
    fireEvent.change(input, {
      target: {
        files: [
          {
            text: async () =>
              JSON.stringify(createPlaytestExport([baseline], { confirmed: true, confirmedAt: 1 })),
          },
        ],
      },
    });
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Imported local summary: baseline'),
    );
    fireEvent.change(input, { target: { files: [{ text: async () => '{ bad json' }] } });
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Playtest import rejected'),
    );
    expect(screen.getByRole('heading', { name: 'Local playtest comparison' })).toBeInTheDocument();
  });
});
