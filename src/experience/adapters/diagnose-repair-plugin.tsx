import { lazy } from 'react';

import { defineActivityPlugin, normaliseActivityOutcome } from '../plugins/contracts';
import type { ActivityPlugin } from '../plugins/contracts';
import type { DiagnoseRepairTemplate } from '../templates/diagnose-repair';

export type DiagnoseRepairActivityProps = DiagnoseRepairTemplate;

const optionSchema = {
  type: 'object' as const,
  additionalProperties: false,
  required: ['id', 'label'],
  properties: { id: { type: 'string' as const, minLength: 1 }, label: { type: 'string' as const, minLength: 1 } },
};

export const diagnoseRepairActivityPlugin: ActivityPlugin<DiagnoseRepairActivityProps> =
  defineActivityPlugin<DiagnoseRepairActivityProps>({
    key: 'diagnose-repair',
    version: '1.0.0',
    component: lazy(() => import('./DiagnoseRepairPluginActivity')),
    propsSchema: {
      type: 'object',
      additionalProperties: false,
      required: ['symptoms', 'diagnoses', 'repairs', 'requiredEvidenceIds'],
      properties: {
        symptoms: {
          type: 'array', minItems: 1, items: {
            ...optionSchema, required: ['id', 'label', 'diagnosisIds'],
            properties: { ...optionSchema.properties, diagnosisIds: { type: 'array', minItems: 1, items: { type: 'string', minLength: 1 }, uniqueItems: true } },
          },
        },
        diagnoses: {
          type: 'array', minItems: 2, items: {
            ...optionSchema, required: ['id', 'label', 'repairIds', 'evidenceIds'],
            properties: {
              ...optionSchema.properties,
              repairIds: { type: 'array', minItems: 1, items: { type: 'string', minLength: 1 }, uniqueItems: true },
              evidenceIds: { type: 'array', items: { type: 'string', minLength: 1 }, uniqueItems: true },
              feedback: { type: 'string', minLength: 1 },
            },
          },
        },
        repairs: {
          type: 'array', minItems: 1, items: {
            ...optionSchema, required: ['id', 'label', 'effect'],
            properties: {
              ...optionSchema.properties,
              effect: {
                type: 'object', additionalProperties: false, required: ['operator', 'path', 'value'],
                properties: { operator: { const: 'set' }, path: { type: 'string', minLength: 1 }, value: { type: 'boolean' } },
              },
            },
          },
        },
        requiredEvidenceIds: { type: 'array', minItems: 1, items: { type: 'string', minLength: 1 }, uniqueItems: true },
      },
    },
    authoring: {
      title: 'Diagnose and repair',
      summary: 'Observe a symptom, commit evidence, diagnose the cause, then choose a causal repair.',
      category: 'construction',
      supportedGoalOperators: ['activity-complete'],
      learningUse: 'Use when learners must distinguish evidence-supported causes from plausible but unsupported repairs.',
    },
    previewFixtures: [{
      id: 'signal-repair', title: 'Signal repair', seed: 'diagnose-repair:signal',
      props: {
        symptoms: [{ id: 'no-signal', label: 'No signal', diagnosisIds: ['loose-wire'] }],
        diagnoses: [
          { id: 'loose-wire', label: 'Loose wire', repairIds: ['secure-wire'], evidenceIds: ['continuity-test'] },
          { id: 'flat-battery', label: 'Flat battery', repairIds: ['replace-battery'], evidenceIds: ['voltage-test'], feedback: 'The observed symptom and continuity evidence point to the wire, not the battery.' },
        ],
        repairs: [
          { id: 'secure-wire', label: 'Secure wire', effect: { operator: 'set', path: '/relay/repaired', value: true } },
          { id: 'replace-battery', label: 'Replace battery', effect: { operator: 'set', path: '/relay/repaired', value: true } },
        ],
        requiredEvidenceIds: ['continuity-test'],
      },
      expectedOutcome: normaliseActivityOutcome({
        completed: true,
        events: [{ sequence: 0, type: 'attempted' }, { sequence: 1, type: 'interaction' }],
      }),
    }],
    persistence: { mode: 'none', explanation: 'The template reports a completed repair only; SceneRunner owns checkpoints and durable mission effects.' },
    accessibility: {
      keyboard: { instructions: 'Use Tab to reach labelled symptom, evidence, diagnosis, repair, and submit controls.', shortcuts: ['Tab', 'Space', 'Enter'] },
      focus: { initial: 'first-control', afterOutcome: 'feedback', visibleIndicator: true },
      announcements: { politeness: 'polite', attempt: 'Repair plan checked.', completion: 'Evidence-supported repair complete.' },
      reducedMotion: { policy: 'none', alternative: 'The mechanic uses no timed motion.' },
      touch: { minimumTargetSizePx: 44, gestureAlternative: 'Every choice is a labelled native checkbox, radio button, or button.' },
      labels: { activity: 'Diagnose and repair activity', controls: ['Symptoms', 'Evidence', 'Diagnosis', 'Repair', 'Test repair plan'] },
      contrast: { minimumRatio: 4.5 },
    },
    performance: { loading: 'lazy', lazyChunkBudgetKbGzip: 150 },
  });

export const diagnoseRepairActivityPluginRegistry = Object.freeze({
  [diagnoseRepairActivityPlugin.key]: diagnoseRepairActivityPlugin as unknown as import('../plugins/contracts').AnyActivityPlugin,
});
