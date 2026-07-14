import { useState } from 'react';
import type { ActivityOutcome } from '../plugins';
import type { DiagnoseRepairTemplate } from './diagnose-repair';
import { evaluateDiagnoseRepair } from './diagnose-repair';

function displayEvidence(id: string): string {
  return id.replaceAll('-', ' ');
}

export function DiagnoseRepairActivity({ template, onOutcome, disabled = false }: { template: DiagnoseRepairTemplate; onOutcome: (outcome: ActivityOutcome) => void; disabled?: boolean }) {
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [evidence, setEvidence] = useState<string[]>([]);
  const [diagnosisId, setDiagnosisId] = useState<string>();
  const [repairId, setRepairId] = useState<string>();
  const [feedback, setFeedback] = useState<string[]>([]);
  function submit() {
    const result = evaluateDiagnoseRepair(template, { observedSymptomIds: symptoms, collectedEvidenceIds: evidence, diagnosisId, repairId });
    setFeedback(result.feedback);
    onOutcome(result.outcome);
  }
  return <section aria-labelledby="diagnose-repair-heading" aria-label="Diagnose and repair activity" className="space-y-4"><h2 id="diagnose-repair-heading">Diagnose and repair</h2>
    <fieldset disabled={disabled}><legend>Observed symptoms</legend>{template.symptoms.map((item) => <label key={item.id}><input type="checkbox" checked={symptoms.includes(item.id)} onChange={(event) => setSymptoms(event.target.checked ? [...symptoms, item.id] : symptoms.filter((id) => id !== item.id))} /> {item.label}</label>)}</fieldset>
    <fieldset disabled={disabled}><legend>Collected evidence</legend>{[...new Set(template.diagnoses.flatMap((item) => item.evidenceIds).concat(template.requiredEvidenceIds))].map((id) => <label key={id}><input type="checkbox" checked={evidence.includes(id)} onChange={(event) => setEvidence(event.target.checked ? [...evidence, id] : evidence.filter((value) => value !== id))} /> {displayEvidence(id)}</label>)}</fieldset>
    <fieldset disabled={disabled}><legend>Diagnosis</legend>{template.diagnoses.map((item) => <label key={item.id}><input type="radio" name="diagnosis" checked={diagnosisId === item.id} onChange={() => setDiagnosisId(item.id)} /> {item.label}</label>)}</fieldset>
    <fieldset disabled={disabled}><legend>Repair</legend>{template.repairs.map((item) => <label key={item.id}><input type="radio" name="repair" checked={repairId === item.id} onChange={() => setRepairId(item.id)} /> {item.label}</label>)}</fieldset>
    <button type="button" disabled={disabled} onClick={submit}>Test repair plan</button>{feedback.length ? <ul aria-live="polite">{feedback.map((item) => <li key={item}>{item}</li>)}</ul> : null}
  </section>;
}
