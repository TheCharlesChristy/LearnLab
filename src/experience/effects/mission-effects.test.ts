import { describe, expect, it } from 'vitest';

import { describeMissionEffects, planCheckpointReplayEffects } from './mission-effects';
import type { MissionRunState } from '../mission';

const run: MissionRunState = {
  currentNodeId: 'repair',
  variables: {},
  unlockedCapabilityIds: ['field-meter'],
  celebrations: ['repair-complete'],
  evidence: [{ skillId: 'signal', outcome: 'success', independence: 'independent', eventId: 'prior-event' }],
  checkpoint: { nodeId: 'repair', eventId: 'prior-event' },
};

describe('mission effect kit (#53)', () => {
  it('permits only checkpoint bookkeeping during a checkpoint replay, never duplicate rewards or mastery evidence', () => {
    const plan = planCheckpointReplayEffects(run, [
      { operator: 'set', path: '/power', value: 80 },
      { operator: 'unlock-capability', capabilityId: 'field-meter' },
      { operator: 'celebrate', milestoneId: 'repair-complete' },
      { operator: 'emit-evidence', skillId: 'signal', outcome: 'success', independence: 'independent' },
      { operator: 'checkpoint', label: 'Safe point' },
    ]);

    expect(plan.effects).toEqual([{ operator: 'checkpoint', label: 'Safe point' }]);
    expect(plan.suppressed).toHaveLength(4);
  });

  it('does not emit effects when a reset was requested without a persisted checkpoint', () => {
    const plan = planCheckpointReplayEffects({ ...run, checkpoint: undefined }, [
      { operator: 'checkpoint', label: 'Unsafe new checkpoint' },
      { operator: 'emit-evidence', skillId: 'signal', outcome: 'success', independence: 'independent' },
    ]);
    expect(plan).toEqual({
      effects: [],
      suppressed: [
        { operator: 'checkpoint', label: 'Unsafe new checkpoint' },
        { operator: 'emit-evidence', skillId: 'signal', outcome: 'success', independence: 'independent' },
      ],
    });
  });

  it('provides concise registered-effect announcements keyed to the persisted boundary event', () => {
    expect(describeMissionEffects('event-7', [
      { operator: 'unlock-capability', capabilityId: 'field-meter' },
      { operator: 'checkpoint', label: 'Receiver calibrated' },
      { operator: 'celebrate', milestoneId: 'repair-complete' },
      { operator: 'set', path: '/power', value: 100 },
    ])).toEqual([
      { key: 'event-7:0', message: 'New capability unlocked: field-meter.' },
      { key: 'event-7:1', message: 'Checkpoint saved: Receiver calibrated.' },
      { key: 'event-7:2', message: 'Mission milestone reached.' },
    ]);
  });
});
