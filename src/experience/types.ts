// LearnLab Experience Runtime v2 data contracts.
//
// These are hand-written TypeScript twins of schemas/course-pack.schema.json
// and schemas/experience-graph.schema.json. They deliberately model content
// only: graph validation (references/reachability) and execution belong to B2+
// and must not be smuggled into this contract layer.

export type JsonPrimitive = string | number | boolean | null;

export type StatePath = `/${string}`;
export type SemVer = string;

export interface CoursePack {
  schemaVersion: 2;
  id: string;
  version: SemVer;
  title: string;
  description: string;
  audience: { level: AudienceLevel; summary: string; prerequisites?: string[] };
  taxonomy: { subjects: string[]; tags: string[] };
  theme?: { name: string; accent?: string; description?: string };
  estimatedMinutes: number;
  engineCapabilities: CapabilityRequirement[];
  state: StateSchema;
  skills: Skill[];
  experiences: ExperienceReference[];
  campaigns: Campaign[];
  assets: Asset[];
  reviewItems: ReviewItem[];
}

export type AudienceLevel = 'gcse' | 'as' | 'a2' | 'alevel' | 'foundation' | 'adult' | 'postgrad';

export interface CapabilityRequirement {
  key: string;
  version: SemVer;
}

export interface StateSchema {
  version: SemVer;
  declarations: StateDeclaration[];
  migrations: StateMigration[];
}

export type StateDeclaration =
  | { path: StatePath; type: 'boolean'; default: boolean }
  | { path: StatePath; type: 'number'; default: number; minimum?: number; maximum?: number }
  | { path: StatePath; type: 'string'; default: string; enum?: string[] }
  | { path: StatePath; type: 'string-set'; default: string[] };

export interface StateMigration {
  fromVersion: SemVer;
  toVersion: SemVer;
  strategy: 'preserve-declared-state' | 'reset';
  note?: string;
}

export interface Skill {
  id: string;
  title: string;
  description: string;
  prerequisiteIds: string[];
}

export interface ExperienceReference {
  id: string;
  file: string;
  title: string;
  estimatedMinutes: number;
}

export interface Campaign {
  id: string;
  title: string;
  description?: string;
  entryExperienceId: string;
  experienceIds: string[];
  recommendedNextCampaignIds?: string[];
}

export interface Asset {
  id: string;
  path: string;
  mediaType: string;
  alt?: string;
  attribution?: { creator: string; license: string; sourceUrl?: string };
}

/** A fully renderable retrieval item; it never depends on its source scene. */
export interface ReviewItem {
  id: string;
  title: string;
  standaloneContext: string;
  prompt: string;
  skillIds: string[];
  activity: ActivityReference;
  goal: Goal;
  feedback: Feedback;
  source?: { experienceId: string; nodeId: string };
}

export interface ExperienceGraph {
  schemaVersion: 2;
  id: string;
  packId: string;
  version: SemVer;
  stateVersion: SemVer;
  entryNodeId: string;
  nodes: ExperienceNode[];
}

export type ExperienceNode = SceneNode | EndingNode;

export interface SceneNode {
  id: string;
  kind: 'scene';
  presentation: Presentation;
  activity: ActivityReference;
  goal: Goal;
  feedback: Feedback;
  effects: Effect[];
  transitions: Transitions;
  review?: { itemId: string };
  accessibility?: Accessibility;
}

export interface EndingNode {
  id: string;
  kind: 'ending';
  presentation: Presentation;
  effects?: Effect[];
  termination: Termination;
  accessibility?: Accessibility;
}

export type Presentation =
  | { kind: 'briefing'; title?: string; body: string }
  | { kind: 'dialogue'; speaker: string; body: string }
  | { kind: 'world-event'; body: string; assetId?: string }
  | { kind: 'diagram'; assetId: string; alt: string; caption?: string }
  | { kind: 'explanation'; body: string };

/** `props` is intentionally plugin-owned; C2 validates it against the registered plugin schema. */
export interface ActivityReference {
  key: string;
  version: SemVer;
  props: Record<string, unknown>;
}

export type Goal =
  | { operator: 'equals'; path: StatePath; value: JsonPrimitive }
  | { operator: 'in-range'; path: StatePath; minimum: number; maximum: number }
  | { operator: 'set-equals'; path: StatePath; values: string[] }
  | { operator: 'regex-match'; path: StatePath; pattern: string }
  | { operator: 'activity-complete' };

export interface Feedback {
  success: string;
  failure?: string;
  misconceptions?: string[];
  hints?: string[];
}

export type Effect =
  | { operator: 'set'; path: StatePath; value: JsonPrimitive }
  | { operator: 'increment'; path: StatePath; by: number }
  | { operator: 'append'; path: StatePath; value: string }
  | { operator: 'unlock-capability'; capabilityId: string }
  | { operator: 'emit-evidence'; skillId: string; outcome: 'success' | 'partial' | 'failure'; independence: 'independent' | 'hinted' | 'assisted'; confidence?: 'guessing' | 'think-so' | 'sure' }
  | { operator: 'checkpoint'; label?: string }
  | { operator: 'celebrate'; milestoneId: string };

export type Condition =
  | { operator: 'state-equals'; path: StatePath; value: JsonPrimitive }
  | { operator: 'state-in'; path: StatePath; values: JsonPrimitive[] }
  | { operator: 'outcome-equals'; path: StatePath; value: JsonPrimitive }
  | { operator: 'mastery-band'; skillId: string; band: 'low' | 'developing' | 'secure' }
  | { operator: 'all'; conditions: Condition[] }
  | { operator: 'any'; conditions: Condition[] }
  | { operator: 'not'; condition: Condition };

export interface Transitions {
  branches: { when: Condition; to: string; label?: string }[];
  fallback: { to: string; label?: string };
}

export interface Termination {
  status: 'complete' | 'failed' | 'abandoned';
  summary: string;
  nextExperienceId?: string;
}

export interface Accessibility {
  ariaLabel?: string;
  textAlternative?: string;
  reducedMotionAlternative?: string;
}
