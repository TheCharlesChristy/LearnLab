import type { MissionCapability, MissionObjective, MissionRunState, WorldMeter } from './types';

export interface MissionKitFixture {
  id: 'success' | 'recoverable-failure' | 'branch' | 'terminal-payoff';
  outcomeKey: string;
  outcomeTitle: string;
  outcome: string;
  objective: MissionObjective;
  meters: WorldMeter[];
  capabilities: MissionCapability[];
  run: MissionRunState;
}

const objective: MissionObjective = {
  stages: [
    { id: 'test', label: 'Test the receiver', completeWhen: { operator: 'state-equals', path: '/relay/tested', value: true } },
    { id: 'repair', label: 'Repair the relay', completeWhen: { operator: 'state-equals', path: '/relay/repaired', value: true } },
  ],
};

const meters: WorldMeter[] = [
  { id: 'signal', label: 'Signal strength', path: '/signal', minimum: 0, maximum: 100, unit: '%' },
];

const capabilities: MissionCapability[] = [
  { id: 'field-meter', label: 'Field meter', description: 'Measures relay signal strength.' },
  { id: 'repair-kit', label: 'Repair kit', description: 'Enables a connector repair.' },
];

function fixtureRun(overrides: Partial<MissionRunState>): MissionRunState {
  return {
    currentNodeId: 'repair',
    variables: { '/relay/tested': true, '/relay/repaired': false, '/signal': 42 },
    unlockedCapabilityIds: ['field-meter'],
    celebrations: [],
    evidence: [],
    checkpoint: { nodeId: 'repair', eventId: 'checkpoint-1', label: 'Receiver test complete' },
    ...overrides,
  };
}

/**
 * Stable, local fixtures for consumers to verify the four required narrative
 * states without coupling a mechanic to a particular course pack.
 */
export const MISSION_KIT_FIXTURES: readonly MissionKitFixture[] = [
  {
    id: 'success', outcomeKey: 'success-1', outcomeTitle: 'Receiver calibrated', outcome: 'The signal is now stable.',
    objective, meters, capabilities,
    run: fixtureRun({ variables: { '/relay/tested': true, '/relay/repaired': true, '/signal': 82 }, unlockedCapabilityIds: ['field-meter', 'repair-kit'] }),
  },
  {
    id: 'recoverable-failure', outcomeKey: 'failure-1', outcomeTitle: 'Reading needs another test', outcome: 'The signal remains noisy. Adjust the antenna and try again.',
    objective, meters, capabilities, run: fixtureRun({ variables: { '/relay/tested': true, '/relay/repaired': false, '/signal': 42 } }),
  },
  {
    id: 'branch', outcomeKey: 'branch-1', outcomeTitle: 'Alternate route selected', outcome: 'You chose to collect another measurement before repairing the relay.',
    objective, meters, capabilities, run: fixtureRun({ currentNodeId: 'collect-reading', variables: { '/relay/tested': true, '/relay/repaired': false, '/signal': 57 } }),
  },
  {
    id: 'terminal-payoff', outcomeKey: 'terminal-1', outcomeTitle: 'Mission complete', outcome: 'The relay is transmitting again, and the station can receive storm data.',
    objective, meters, capabilities,
    run: fixtureRun({ currentNodeId: 'complete', variables: { '/relay/tested': true, '/relay/repaired': true, '/signal': 100 }, unlockedCapabilityIds: ['field-meter', 'repair-kit'], celebrations: ['relay-restored'] }),
  },
];
