import { describe, expect, it } from 'vitest';
import { evaluateDesign, evaluateInvestigation } from './constraints';

describe('F4 reusable templates', () => {
  it('accepts multiple budget-valid strategies and exposes partial constraints', () => {
    const template = { budget: 5, options: [{ id: 'a', label: 'A', cost: 2, tags: ['safe'] }, { id: 'b', label: 'B', cost: 3, tags: ['safe'] }, { id: 'c', label: 'C', cost: 5, tags: ['safe'] }], constraints: [{ id: 'safety', label: 'Safe', requiredTags: ['safe'] }] };
    expect(evaluateDesign(template, ['a']).accepted).toBe(true);
    expect(evaluateDesign(template, ['c']).accepted).toBe(true);
    expect(evaluateDesign({ ...template, constraints: [template.constraints[0]!, { id: 'two', label: 'Two', minimumCount: 2 }] }, ['a']).partial).toBe(true);
  });
  it('prevents an unsupported conclusion from bypassing required evidence', () => {
    const template = { evidence: [{ id: 'reading', label: 'Reading', supports: ['fault'] }], requiredEvidenceIds: ['reading'], hypotheses: ['fault'] };
    expect(evaluateInvestigation(template, [], 'fault').accepted).toBe(false);
    expect(evaluateInvestigation(template, ['reading'], 'fault').accepted).toBe(true);
  });
});
