/** Domain-neutral, deterministic mechanics for F4; callers map results to plugin outcomes/effects. */
export interface ConstraintOption { id: string; cost: number; tags: string[]; label: string }
export interface DesignConstraint { id: string; label: string; requiredTags?: string[]; minimumCount?: number }
export interface DesignTemplate { budget: number; options: ConstraintOption[]; constraints: DesignConstraint[] }
export interface DesignEvaluation { accepted: boolean; partial: boolean; cost: number; selectedIds: string[]; satisfiedConstraintIds: string[]; unmetConstraintIds: string[]; feedback: string[] }

function unique(values: readonly string[]): string[] { return [...new Set(values)].sort(); }
export function evaluateDesign(template: DesignTemplate, selectedIds: readonly string[]): DesignEvaluation {
  const selected = template.options.filter((option) => selectedIds.includes(option.id));
  const cost = selected.reduce((sum, option) => sum + option.cost, 0);
  const satisfied = template.constraints.filter((constraint) => {
    const tags = new Set(selected.flatMap((option) => option.tags));
    return (!constraint.requiredTags?.length || constraint.requiredTags.every((tag) => tags.has(tag))) && (!constraint.minimumCount || selected.length >= constraint.minimumCount);
  }).map((constraint) => constraint.id);
  const unmet = template.constraints.map((constraint) => constraint.id).filter((id) => !satisfied.includes(id));
  const accepted = cost <= template.budget && unmet.length === 0;
  return { accepted, partial: !accepted && satisfied.length > 0, cost, selectedIds: unique(selected.map((item) => item.id)), satisfiedConstraintIds: satisfied, unmetConstraintIds: unmet, feedback: [cost > template.budget ? `Budget exceeded by ${cost - template.budget}.` : `Budget remaining: ${template.budget - cost}.`, ...unmet.map((id) => `Constraint still unmet: ${id}.`), ...(accepted ? ['All transparent constraints are satisfied.'] : [])] };
}

export interface EvidenceItem { id: string; label: string; supports: string[]; contradicts?: string[] }
export interface InvestigationTemplate { evidence: EvidenceItem[]; requiredEvidenceIds: string[]; hypotheses: string[] }
export interface InvestigationEvaluation { accepted: boolean; partial: boolean; collectedIds: string[]; conclusion?: string; feedback: string[] }
/** A conclusion is accepted only after required evidence has been collected and it is supported. */
export function evaluateInvestigation(template: InvestigationTemplate, collectedIds: readonly string[], conclusion?: string): InvestigationEvaluation {
  const collected = unique(collectedIds.filter((id) => template.evidence.some((item) => item.id === id)));
  const missing = template.requiredEvidenceIds.filter((id) => !collected.includes(id));
  const support = conclusion ? template.evidence.filter((item) => collected.includes(item.id) && item.supports.includes(conclusion)).length : 0;
  const accepted = !!conclusion && missing.length === 0 && support > 0;
  return { accepted, partial: !accepted && collected.length > 0, collectedIds: collected, ...(conclusion ? { conclusion } : {}), feedback: [...missing.map((id) => `Collect evidence: ${id}.`), ...(conclusion && support === 0 ? ['Explain the conclusion using collected evidence.'] : []), ...(accepted ? ['Conclusion is supported by the required evidence.'] : [])] };
}

export const F4_AUTHORING_METADATA = Object.freeze({ design: { title: 'Design under constraints', learningUse: 'Compare multiple valid strategies against visible budget and requirement trade-offs.', masteryRule: 'Emit mastery evidence only when accepted is true; partial is feedback only.' }, investigation: { title: 'Evidence investigation', learningUse: 'Collect required evidence before making a supported conclusion.', masteryRule: 'Emit mastery evidence only when accepted is true; partial is feedback only.' } });
