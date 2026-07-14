import { describe, expect, it } from 'vitest';

import { evaluateExperimentInfer } from './experiment-infer';

const template = {
  trials: [
    { id: 'low', controlLabel: 'Low input', observationLabel: 'Small response' },
    { id: 'high', controlLabel: 'High input', observationLabel: 'Large response' },
  ],
  requiredTrialIds: ['low', 'high'],
  ruleIds: ['direct', 'inverse'],
  correctRuleId: 'direct',
  transferOptionIds: ['increase', 'decrease'],
  correctTransferId: 'increase',
} as const;

describe('experiment-and-infer template (#55)', () => {
  it('requires observations, a supported inference, and transfer rather than bare interaction', () => {
    expect(
      evaluateExperimentInfer(template, { observedTrialIds: ['unknown', 'high'] }),
    ).toMatchObject({
      observedTrialIds: ['high'],
      missingTrialIds: ['low'],
      completed: false,
    });
    expect(
      evaluateExperimentInfer(template, {
        observedTrialIds: ['high', 'low'],
        ruleId: 'inverse',
        transferOptionId: 'decrease',
      }),
    ).toMatchObject({ canInfer: true, ruleCorrect: false, canTransfer: false, completed: false });
    expect(
      evaluateExperimentInfer(template, {
        predictionId: 'larger',
        observedTrialIds: ['low', 'high'],
        ruleId: 'direct',
        transferOptionId: 'increase',
      }),
    ).toMatchObject({ ruleCorrect: true, transferCorrect: true, completed: true });
  });
});
