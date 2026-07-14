/**
 * Pure, versioned contracts for the v2 skill graph and learner evidence.
 *
 * These records are deliberately small, local-first data.  They contain no
 * learner identity and no executable authoring hooks.
 */

export const MASTERY_EVIDENCE_SCHEMA_VERSION = 1 as const;

export type MasteryOutcome = 'success' | 'partial' | 'failure';
export type SupportLevel = 'independent' | 'hinted' | 'assisted' | 'unknown';
export type HintUse = 'none' | 'used' | 'unknown';
export type Confidence = 'guessing' | 'think-so' | 'sure' | 'unknown';
export type LatencyBand = 'fast' | 'expected' | 'slow' | 'unknown';
export type OpportunityKind = 'retrieval' | 'application' | 'transfer' | 'unknown';
export type TransferContext = 'same-context' | 'near-transfer' | 'far-transfer' | 'unknown';
export type EvidenceSource = 'experience-run' | 'quiz' | 'review';

/** Content identity is mandatory so evidence can be inspected after a pack changes. */
export interface EvidenceContentVersion {
  packId: string;
  packVersion: string;
  experienceId?: string;
  experienceVersion?: string;
  itemId?: string;
}

/**
 * The canonical event used by aggregation.  Unknown is an intentional value,
 * not a missing field: older records cannot be upgraded into measurements
 * they never collected.
 */
export interface MasteryEvidence {
  schemaVersion: typeof MASTERY_EVIDENCE_SCHEMA_VERSION;
  id: string;
  occurredAt: number;
  skillId: string;
  source: EvidenceSource;
  content: EvidenceContentVersion;
  opportunity: OpportunityKind;
  outcome: MasteryOutcome;
  support: SupportLevel;
  hintUse: HintUse;
  hintCount: number | 'unknown';
  confidence: Confidence;
  latency: LatencyBand;
  transfer: TransferContext;
}

/** An old record that has not been mapped to a declared skill. */
export interface LegacyEvidenceRecord {
  kind: 'legacy';
  source: 'quiz-attempt' | 'review-state' | 'run-evidence';
  id: string;
  occurredAt?: number;
  reason: string;
}

export interface SkillGraphDiagnostic {
  code: 'duplicate-skill-id' | 'unknown-prerequisite' | 'self-prerequisite' | 'cyclic-prerequisites';
  skillId: string;
  prerequisiteId?: string;
  cycle?: string[];
}

export interface SkillGraph {
  /** Stable lexical order, never depending on source-file order. */
  skillIds: string[];
  prerequisiteIdsBySkill: Readonly<Record<string, string[]>>;
  dependentIdsBySkill: Readonly<Record<string, string[]>>;
}

export type MasteryBand = 'low' | 'developing' | 'secure';

export interface SkillEvidenceBreakdown {
  opportunities: number;
  opportunitiesByKind: Record<OpportunityKind, number>;
  opportunitiesBySupport: Record<SupportLevel, number>;
  successes: number;
  partials: number;
  failures: number;
  independentSuccesses: number;
  hintedSuccesses: number;
  assistedSuccesses: number;
  confidentWrong: number;
  unknownContext: number;
}

export interface SkillMasterySummary {
  skillId: string;
  /** A band is withheld until at least two distinct evidence opportunities exist. */
  band?: MasteryBand;
  status: 'insufficient-evidence' | 'classified';
  evidence: SkillEvidenceBreakdown;
  reasons: string[];
}

export interface MasteryAggregation {
  summaries: SkillMasterySummary[];
  /** Evidence ignored rather than silently attached to an unknown authored skill. */
  ignoredEvidence: { id: string; reason: string }[];
}

export interface LegacyQuizAttempt {
  moduleId: string;
  itemId: string;
  startedAt: number;
  finishedAt: number;
  score: number;
  maxScore: number;
}

export interface LegacyReviewState {
  moduleId: string;
  itemId: string;
  lastReviewedAt: number;
  lastQuality: number;
}
