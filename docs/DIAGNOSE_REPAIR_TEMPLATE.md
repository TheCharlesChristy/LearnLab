# Diagnose-and-repair template

`src/experience/templates/diagnose-repair.ts` is a reusable, deterministic mechanic adapter for
ActivityPlugin/scene authors. Supply symptoms, compatible diagnoses, required evidence and causal
repairs. `evaluateDiagnoseRepair()` returns a normalised activity outcome, feedback, and the repair
effect only after the learner has observed a symptom, gathered all required evidence, selected a
compatible diagnosis, and selected its compatible repair.

Partial attempts return feedback but **no effects** and must never be paired with `emit-evidence`.
Use labelled native controls in the authored UI, retain the symptom → evidence → diagnosis → repair
order for keyboard/screen-reader users, and make each evidence item intelligible without colour or
dragging. The template has no persistence or progress-store access; SceneRunner owns the returned
outcome and typed effects.

`DiagnoseRepairActivity` is the native-control reference surface: checkbox symptom/evidence
collection, radio diagnosis/repair choices, a keyboard/touch-operable submit button, and a polite
feedback list. `fixtures/diagnose-repair-vertical-slice.json` is the thin representative usage for
the future vertical slice; a wrong but plausible diagnosis receives targeted feedback and reconverges
on the same evidence-gated repair consequence.
