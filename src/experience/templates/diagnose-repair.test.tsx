import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { DiagnoseRepairActivity } from './DiagnoseRepairActivity';
import { evaluateDiagnoseRepair } from './diagnose-repair';

const template = { symptoms: [{ id: 'no-signal', label: 'No signal', diagnosisIds: ['loose-wire'] }], diagnoses: [{ id: 'loose-wire', label: 'Loose wire', repairIds: ['secure-wire'], evidenceIds: ['continuity-test'] }], repairs: [{ id: 'secure-wire', label: 'Secure wire', effect: { operator: 'set' as const, path: '/relay/repaired' as const, value: true } }], requiredEvidenceIds: ['continuity-test'] };
describe('diagnose-and-repair template (#54)', () => {
  it('requires observation, evidence, diagnosis, and causal repair before effects', () => {
    const partial = evaluateDiagnoseRepair(template, { observedSymptomIds: ['no-signal'], collectedEvidenceIds: [], diagnosisId: 'loose-wire', repairId: 'secure-wire' });
    expect(partial).toMatchObject({ complete: false, partial: true, effects: [] });
    const complete = evaluateDiagnoseRepair(template, { observedSymptomIds: ['no-signal'], collectedEvidenceIds: ['continuity-test'], diagnosisId: 'loose-wire', repairId: 'secure-wire' });
    expect(complete).toMatchObject({ complete: true, effects: [{ operator: 'set', path: '/relay/repaired', value: true }] });
    expect(complete.outcome.completed).toBe(true);
  });
  it('keeps a plausible wrong diagnosis in the same accessible flow and reconverges after evidence', async () => {
    const user = userEvent.setup(); const outcome = vi.fn();
    const branching = { ...template, diagnoses: [...template.diagnoses, { id: 'power-loss', label: 'Power loss', repairIds: ['secure-wire'], evidenceIds: ['power-test'] }] };
    render(<DiagnoseRepairActivity template={branching} onOutcome={outcome} />);
    await user.click(screen.getByRole('checkbox', { name: 'No signal' }));
    await user.click(screen.getByRole('radio', { name: 'Power loss' }));
    await user.click(screen.getByRole('radio', { name: 'Secure wire' }));
    await user.click(screen.getByRole('button', { name: 'Test repair plan' }));
    expect(screen.getByText('Choose a diagnosis that accounts for the observed symptom.')).toBeInTheDocument();
    expect(outcome).toHaveBeenLastCalledWith(expect.objectContaining({ completed: false }));
    await user.click(screen.getByRole('checkbox', { name: 'continuity test' }));
    await user.click(screen.getByRole('radio', { name: 'Loose wire' }));
    await user.click(screen.getByRole('button', { name: 'Test repair plan' }));
    expect(screen.getByText('The repair follows the evidence and diagnosis.')).toBeInTheDocument();
    expect(outcome).toHaveBeenLastCalledWith(expect.objectContaining({ completed: true }));
  });
});
