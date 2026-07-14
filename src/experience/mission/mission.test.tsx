import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { MissionRunState } from './types';
import { deriveCapabilities, deriveObjectiveStages, deriveWorldMeters } from './derive';
import { MISSION_KIT_FIXTURES } from './fixtures';
import {
  MissionCapabilities,
  MissionCheckpointPanel,
  MissionObjectivePanel,
  MissionOutcomeBanner,
  WorldMeterPanel,
} from './MissionKit';

const run: MissionRunState = {
  currentNodeId: 'repair',
  variables: { '/power': 65, '/relay/tested': true, '/relay/repaired': false },
  unlockedCapabilityIds: ['field-meter'],
  celebrations: ['first-test'],
  evidence: [{ skillId: 'measure-signal', outcome: 'success', independence: 'independent', eventId: 'event-1' }],
  checkpoint: { nodeId: 'repair', eventId: 'event-1', label: 'Receiver test complete' },
};

describe('mission kit (#53)', () => {
  it('ships stable success, recoverable-failure, branch, and terminal-payoff fixtures', () => {
    expect(MISSION_KIT_FIXTURES.map((fixture) => fixture.id)).toEqual([
      'success', 'recoverable-failure', 'branch', 'terminal-payoff',
    ]);
    for (const fixture of MISSION_KIT_FIXTURES) {
      expect(fixture.objective.stages).not.toHaveLength(0);
      expect(fixture.outcome).not.toHaveLength(0);
    }
  });

  it('derives staged objectives, meters, and tools exclusively from persisted run state', () => {
    const stages = deriveObjectiveStages({
      stages: [
        { id: 'test', label: 'Test the receiver', completeWhen: { operator: 'state-equals', path: '/relay/tested', value: true } },
        { id: 'repair', label: 'Repair the relay', completeWhen: { operator: 'state-equals', path: '/relay/repaired', value: true } },
        { id: 'report', label: 'Report the repair', completeWhen: { operator: 'state-equals', path: '/reported', value: true } },
      ],
    }, run);
    expect(stages.map((stage) => stage.status)).toEqual(['complete', 'current', 'locked']);

    const [meter] = deriveWorldMeters([{ id: 'power', label: 'Grid power', path: '/power', minimum: 0, maximum: 100, unit: '%' }], run);
    expect(meter).toMatchObject({ value: 65, percentage: 65, text: '65% of 100%' });

    expect(deriveCapabilities([{ id: 'field-meter', label: 'Field meter' }, { id: 'repair-kit', label: 'Repair kit' }], run))
      .toMatchObject([{ unlocked: true }, { unlocked: false }]);
  });

  it('renders success, recoverable failure, branch status, and terminal payoff fixtures without timers or drag-only controls', async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    const objectives = deriveObjectiveStages({
      stages: [{ id: 'repair', label: 'Repair the relay', completeWhen: { operator: 'state-equals', path: '/relay/repaired', value: true } }],
    }, run);
    const meters = deriveWorldMeters([{ id: 'power', label: 'Grid power', path: '/power', minimum: 0, maximum: 100, unit: '%' }], run);

    const { rerender, container } = render(
      <>
        <MissionObjectivePanel stages={objectives} />
        <WorldMeterPanel meters={meters} />
        <MissionCapabilities capabilities={deriveCapabilities([{ id: 'field-meter', label: 'Field meter' }], run)} />
        <MissionCheckpointPanel checkpoint={run.checkpoint} onResetToCheckpoint={reset} />
        <MissionOutcomeBanner outcomeKey="event-1" title="Recoverable problem">The reading is noisy. Try another setting.</MissionOutcomeBanner>
      </>,
    );

    expect(screen.getByRole('progressbar', { name: 'Grid power' })).toHaveAttribute('value', '65');
    expect(screen.getByText('Recoverable problem')).toBeInTheDocument();
    expect(container.querySelector('[draggable="true"]')).not.toBeInTheDocument();
    expect(container.querySelector('[role="timer"]')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Return to checkpoint' }));
    expect(reset).toHaveBeenCalledWith(run.checkpoint);

    rerender(
      <>
        <MissionObjectivePanel stages={objectives} />
        <WorldMeterPanel meters={meters} />
        <MissionCapabilities capabilities={deriveCapabilities([{ id: 'field-meter', label: 'Field meter' }], run)} />
        <MissionCheckpointPanel checkpoint={run.checkpoint} onResetToCheckpoint={reset} />
        <MissionOutcomeBanner outcomeKey="event-2" title="Mission complete">The relay is transmitting again.</MissionOutcomeBanner>
      </>,
    );
    expect(screen.getByRole('heading', { name: 'Mission complete' })).toHaveFocus();
    expect(screen.getByText('Mission complete.')).toHaveAttribute('aria-live', 'polite');
  });

  it('does not announce a saved outcome again after resume', () => {
    render(<MissionOutcomeBanner outcomeKey="saved-event" title="Branch selected">You chose to collect another reading.</MissionOutcomeBanner>);
    expect(screen.queryByText('Branch selected.')).not.toBeInTheDocument();
  });
});
