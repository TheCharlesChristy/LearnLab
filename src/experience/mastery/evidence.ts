import type { Effect } from '../types';
import type { ExperienceEvent, RunBoundaryEvent } from '../run-state/types';
import {
  MASTERY_EVIDENCE_SCHEMA_VERSION,
  type Confidence,
  type HintUse,
  type LatencyBand,
  type MasteryEvidence,
  type OpportunityKind,
  type SupportLevel,
  type TransferContext,
} from './types';

export interface EvidenceContext {
  opportunity?: OpportunityKind;
  transfer?: TransferContext;
  latency?: LatencyBand;
}

function evidenceEffect(effect: Effect): Extract<Effect, { operator: 'emit-evidence' }> | undefined {
  return effect.operator === 'emit-evidence' ? effect : undefined;
}

function hintUseFor(support: SupportLevel, hintsUsed: number | undefined): HintUse {
  if (hintsUsed !== undefined) return hintsUsed > 0 ? 'used' : 'none';
  if (support === 'independent') return 'none';
  if (support === 'hinted') return 'used';
  return 'unknown';
}

function confidenceFor(effect: Extract<Effect, { operator: 'emit-evidence' }>, event: RunBoundaryEvent): Confidence {
  return effect.confidence ?? event.telemetry?.confidence ?? 'unknown';
}

/**
 * Convert durable B4 boundary events into canonical evidence.  Fields the B4
 * effect did not collect stay explicit `unknown`; this mapper never guesses
 * opportunity, transfer, latency, or a hint count.
 */
export function normaliseExperienceEvidence(
  events: readonly ExperienceEvent[],
  contextByEventId: Readonly<Record<string, EvidenceContext | undefined>> = {},
): MasteryEvidence[] {
  const starts = new Map<string, Extract<ExperienceEvent, { kind: 'run-created' }>>();
  for (const event of events) if (event.kind === 'run-created') starts.set(event.runId, event);
  const normalised: MasteryEvidence[] = [];
  for (const event of events) {
    if (event.kind !== 'boundary-applied') continue;
    const start = starts.get(event.runId);
    if (!start) continue; // No content version means this corrupt/incomplete input cannot be evidence.
    const context = contextByEventId[event.eventId];
    event.effects.forEach((effect, index) => {
      const emitted = evidenceEffect(effect);
      if (!emitted) return;
      const support: SupportLevel = emitted.independence;
      const hintsUsed = event.telemetry?.hintsUsed;
      normalised.push({
        schemaVersion: MASTERY_EVIDENCE_SCHEMA_VERSION,
        id: `${event.runId}:${event.eventId}:${index}`,
        occurredAt: event.occurredAt,
        skillId: emitted.skillId,
        source: 'experience-run',
        content: {
          packId: start.initial.packId,
          packVersion: start.initial.packVersion,
          experienceId: start.initial.experienceId,
          experienceVersion: start.initial.experienceVersion,
        },
        opportunity: context?.opportunity ?? 'unknown',
        outcome: emitted.outcome,
        support,
        hintUse: hintUseFor(support, hintsUsed),
        hintCount: hintsUsed ?? 'unknown',
        confidence: confidenceFor(emitted, event),
        latency: context?.latency ?? 'unknown',
        transfer: context?.transfer ?? 'unknown',
      });
    });
  }
  return normalised.sort((left, right) => left.id.localeCompare(right.id));
}
