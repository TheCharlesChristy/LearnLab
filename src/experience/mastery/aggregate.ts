import type { MasteryAggregation, MasteryEvidence, SkillEvidenceBreakdown, SkillMasterySummary } from './types';
import type { SkillGraph } from './types';

function emptyBreakdown(): SkillEvidenceBreakdown {
  return {
    opportunities: 0,
    opportunitiesByKind: { retrieval: 0, application: 0, transfer: 0, unknown: 0 },
    opportunitiesBySupport: { independent: 0, hinted: 0, assisted: 0, unknown: 0 },
    successes: 0, partials: 0, failures: 0, independentSuccesses: 0,
    hintedSuccesses: 0, assistedSuccesses: 0, confidentWrong: 0, unknownContext: 0,
  };
}

function orderedEvidence(evidence: readonly MasteryEvidence[]): MasteryEvidence[] {
  return [...evidence].sort((left, right) =>
    left.occurredAt - right.occurredAt || left.id.localeCompare(right.id),
  );
}

function classify(skillId: string, breakdown: SkillEvidenceBreakdown): SkillMasterySummary {
  const reasons: string[] = [];
  if (breakdown.opportunities < 2) {
    reasons.push('Fewer than two evidence opportunities: no mastery band is claimed.');
    return { skillId, status: 'insufficient-evidence', evidence: breakdown, reasons };
  }
  if (breakdown.opportunities >= 4 && breakdown.successes >= 3 && breakdown.independentSuccesses >= 3) {
    reasons.push('At least three independent successes across four or more opportunities.');
    return { skillId, status: 'classified', band: 'secure', evidence: breakdown, reasons };
  }
  if (breakdown.successes >= 2 && breakdown.independentSuccesses >= 2) {
    reasons.push('At least two independent successes, but not enough evidence for secure.');
    return { skillId, status: 'classified', band: 'developing', evidence: breakdown, reasons };
  }
  reasons.push('Evidence is mixed, supported, partial, or unsuccessful; classify conservatively as low.');
  return { skillId, status: 'classified', band: 'low', evidence: breakdown, reasons };
}

/**
 * Pure deterministic aggregation.  It reports the evidence counts and rule
 * that produced every band, so callers can explain a recommendation without
 * implying a calibrated probability or a diagnosis.
 */
export function aggregateMastery(graph: SkillGraph, evidence: readonly MasteryEvidence[]): MasteryAggregation {
  const breakdowns = new Map(graph.skillIds.map((skillId) => [skillId, emptyBreakdown()]));
  const ignoredEvidence: { id: string; reason: string }[] = [];
  const seenIds = new Set<string>();
  for (const item of orderedEvidence(evidence)) {
    if (seenIds.has(item.id)) {
      ignoredEvidence.push({ id: item.id, reason: 'Duplicate evidence id.' });
      continue;
    }
    seenIds.add(item.id);
    const breakdown = breakdowns.get(item.skillId);
    if (!breakdown) {
      ignoredEvidence.push({ id: item.id, reason: `Unknown authored skill "${item.skillId}".` });
      continue;
    }
    breakdown.opportunities++;
    breakdown.opportunitiesByKind[item.opportunity]++;
    breakdown.opportunitiesBySupport[item.support]++;
    if (item.outcome === 'success') {
      breakdown.successes++;
      if (item.support === 'independent') breakdown.independentSuccesses++;
      else if (item.support === 'hinted') breakdown.hintedSuccesses++;
      else if (item.support === 'assisted') breakdown.assistedSuccesses++;
    } else if (item.outcome === 'partial') {
      breakdown.partials++;
    } else {
      breakdown.failures++;
      if (item.confidence === 'sure') breakdown.confidentWrong++;
    }
    if (item.opportunity === 'unknown' || item.transfer === 'unknown' || item.latency === 'unknown') {
      breakdown.unknownContext++;
    }
  }
  return {
    summaries: graph.skillIds.map((skillId) => classify(skillId, breakdowns.get(skillId)!)),
    ignoredEvidence: ignoredEvidence.sort((left, right) => left.id.localeCompare(right.id)),
  };
}
