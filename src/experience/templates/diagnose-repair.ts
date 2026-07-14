import { normaliseActivityOutcome, type ActivityOutcome } from '../plugins';
import type { Effect } from '../types';

export interface RepairSymptom { id: string; label: string; diagnosisIds: readonly string[] }
export interface RepairDiagnosis { id: string; label: string; repairIds: readonly string[]; evidenceIds: readonly string[]; feedback?: string }
export interface RepairAction { id: string; label: string; effect: Effect }
export interface DiagnoseRepairTemplate { symptoms: readonly RepairSymptom[]; diagnoses: readonly RepairDiagnosis[]; repairs: readonly RepairAction[]; requiredEvidenceIds: readonly string[] }
export interface DiagnoseRepairState { observedSymptomIds: string[]; collectedEvidenceIds: string[]; diagnosisId?: string; repairId?: string }
export interface DiagnoseRepairResult { complete: boolean; partial: boolean; feedback: string[]; effects: Effect[]; outcome: ActivityOutcome }

function unique(ids: readonly string[]): string[] { return [...new Set(ids)].sort(); }
/**
 * A pure, deterministic template: a repair can complete only when a real
 * symptom, its compatible diagnosis, all required evidence, and a compatible
 * repair action are present. Partial attempts deliberately emit no effects.
 */
export function evaluateDiagnoseRepair(template: DiagnoseRepairTemplate, state: DiagnoseRepairState): DiagnoseRepairResult {
  const symptoms = template.symptoms.filter((item) => state.observedSymptomIds.includes(item.id));
  const diagnosis = template.diagnoses.find((item) => item.id === state.diagnosisId);
  const repair = template.repairs.find((item) => item.id === state.repairId);
  const missingEvidence = unique([...template.requiredEvidenceIds, ...(diagnosis?.evidenceIds ?? [])]).filter((id) => !state.collectedEvidenceIds.includes(id));
  const diagnosisFits = !!diagnosis && symptoms.some((symptom) => symptom.diagnosisIds.includes(diagnosis.id));
  const repairFits = !!diagnosis && !!repair && diagnosis.repairIds.includes(repair.id);
  const complete = symptoms.length > 0 && diagnosisFits && repairFits && missingEvidence.length === 0;
  const feedback = [
    ...(symptoms.length ? [] : ['Observe at least one symptom before diagnosing.']),
    ...(diagnosisFits
      ? []
      : [diagnosis?.feedback ?? 'Choose a diagnosis that accounts for the observed symptom.']),
    ...missingEvidence.map((id) => `Collect evidence: ${id}.`),
    ...(repairFits ? [] : ['Choose a repair that follows from the diagnosis.']),
    ...(complete ? ['The repair follows the evidence and diagnosis.'] : []),
  ];
  return {
    complete,
    partial: !complete && (symptoms.length > 0 || state.collectedEvidenceIds.length > 0 || !!diagnosis),
    feedback,
    effects: complete && repair ? [repair.effect] : [],
    outcome: normaliseActivityOutcome({ completed: complete, values: {}, events: [{ sequence: 0, type: 'attempted' }, ...(state.collectedEvidenceIds.length ? [{ sequence: 1, type: 'interaction' as const }] : [])] }),
  };
}

export const DIAGNOSE_REPAIR_AUTHORING_METADATA = Object.freeze({ title: 'Diagnose and repair', learningUse: 'Observe a symptom, gather discriminating evidence, diagnose the cause, then choose a causal repair.', accessibility: 'Use labelled native controls in symptom → evidence → diagnosis → repair order; do not rely on colour.', masteryRule: 'Only complete=true may be paired with emit-evidence; partial attempts have no state effects.' });
