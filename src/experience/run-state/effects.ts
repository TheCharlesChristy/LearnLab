import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

import experienceGraphSchema from '../../../schemas/experience-graph.schema.json';
import type { Effect } from '../types';
import type { ExperienceRun, RunBoundaryEvent, RunEvidence, RunStateValue } from './types';

const ajv = new Ajv2020({ allErrors: true, allowUnionTypes: true, discriminator: true });
addFormats(ajv);
ajv.addSchema(experienceGraphSchema);
const validateEffect = ajv.getSchema(`${experienceGraphSchema.$id}#/$defs/effect`)!;

type EffectHandler<T extends Effect = Effect> = (
  run: ExperienceRun,
  effect: T,
  event: Pick<RunBoundaryEvent, 'eventId' | 'nodeId'>,
) => ExperienceRun;

function copy(run: ExperienceRun): ExperienceRun {
  return {
    ...run,
    variables: { ...run.variables },
    unlockedCapabilityIds: [...run.unlockedCapabilityIds],
    branchHistory: [...run.branchHistory],
    evidence: [...run.evidence],
    celebrations: [...run.celebrations],
  };
}

function setValue(run: ExperienceRun, path: string, value: RunStateValue): ExperienceRun {
  const next = copy(run);
  next.variables[path as keyof typeof next.variables] = value;
  return next;
}

const EFFECT_HANDLERS: {
  [T in Effect['operator']]: EffectHandler<Extract<Effect, { operator: T }>>;
} = {
  set: (run, effect) => setValue(run, effect.path, effect.value),
  increment: (run, effect) => {
    const current = run.variables[effect.path] ?? 0;
    if (typeof current !== 'number') {
      throw new Error(`Cannot increment ${effect.path}: its current value is not a number.`);
    }
    return setValue(run, effect.path, current + effect.by);
  },
  append: (run, effect) => {
    const current = run.variables[effect.path] ?? [];
    if (!Array.isArray(current) || !current.every((value) => typeof value === 'string')) {
      throw new Error(`Cannot append ${effect.path}: its current value is not a string-set.`);
    }
    return setValue(
      run,
      effect.path,
      current.includes(effect.value) ? current : [...current, effect.value],
    );
  },
  'unlock-capability': (run, effect) =>
    run.unlockedCapabilityIds.includes(effect.capabilityId)
      ? run
      : { ...run, unlockedCapabilityIds: [...run.unlockedCapabilityIds, effect.capabilityId] },
  'emit-evidence': (run, effect, event) => {
    const evidence: RunEvidence = { ...effect, eventId: event.eventId };
    return { ...run, evidence: [...run.evidence, evidence] };
  },
  checkpoint: (run, effect, event) => ({
    ...run,
    checkpoint: {
      nodeId: event.nodeId,
      eventId: event.eventId,
      ...(effect.label ? { label: effect.label } : {}),
    },
  }),
  celebrate: (run, effect) =>
    run.celebrations.includes(effect.milestoneId)
      ? run
      : { ...run, celebrations: [...run.celebrations, effect.milestoneId] },
};

/** Ajv validates the closed schema vocabulary before a registered handler can execute. */
export function assertRegisteredEffect(value: unknown): asserts value is Effect {
  if (!validateEffect(value)) {
    const detail = validateEffect.errors?.[0]?.message ?? 'invalid effect';
    throw new Error(`Effect rejected by the v2 schema: ${detail}.`);
  }
}

/** Deterministic pure reducer. Content cannot inject executable behaviour. */
export function applyEffect(
  run: ExperienceRun,
  effect: Effect,
  event: Pick<RunBoundaryEvent, 'eventId' | 'nodeId'>,
): ExperienceRun {
  assertRegisteredEffect(effect);
  const handler = EFFECT_HANDLERS[effect.operator] as EffectHandler;
  return handler(run, effect, event);
}

export function applyEffects(
  run: ExperienceRun,
  effects: readonly Effect[],
  event: Pick<RunBoundaryEvent, 'eventId' | 'nodeId'>,
): ExperienceRun {
  return effects.reduce((projection, effect) => applyEffect(projection, effect, event), run);
}
