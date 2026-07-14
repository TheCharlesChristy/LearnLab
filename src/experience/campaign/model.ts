import type { MasteryAggregation, MasteryBand } from '../mastery';
import type { ExperienceRun } from '../run-state';
import type { Campaign, CoursePack, ExperienceGraph } from '../types';

export type CampaignEpisodeState =
  | 'locked'
  | 'available'
  | 'recommended'
  | 'resumable'
  | 'completed';
export type CapabilityState = 'locked' | 'unlocked';

export interface CampaignEpisodeMap {
  id: string;
  title: string;
  estimatedMinutes: number;
  state: CampaignEpisodeState;
  prerequisiteSkillIds: string[];
  masteryBySkill: Record<string, MasteryBand | undefined>;
  decisionPointCount: number;
  choicesMade: number;
  unlockedCapabilityIds: string[];
  resumeRunId?: string;
  resumeNodeId?: string;
  currentObjective?: string;
}

export interface CampaignMapCampaign {
  id: string;
  title: string;
  description?: string;
  recommended: boolean;
  episodes: CampaignEpisodeMap[];
}

export interface CapabilityMapItem {
  id: string;
  state: CapabilityState;
  sourceExperienceIds: string[];
}

export interface CampaignMapModel {
  campaigns: CampaignMapCampaign[];
  capabilities: CapabilityMapItem[];
}

export interface CampaignMapInput {
  pack: CoursePack;
  graphs: readonly ExperienceGraph[];
  runs: readonly ExperienceRun[];
  mastery: MasteryAggregation;
}

interface ExperienceFacts {
  skillIds: string[];
  prerequisiteSkillIds: string[];
  capabilityIds: string[];
  decisionNodeIds: string[];
}

function ordered(values: Iterable<string>): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

/** Pack arrays express learner sequence; dedupe defensively without reordering them. */
function uniqueInAuthoredOrder(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function factsForGraph(graph: ExperienceGraph | undefined, pack: CoursePack): ExperienceFacts {
  if (!graph) {
    return { skillIds: [], prerequisiteSkillIds: [], capabilityIds: [], decisionNodeIds: [] };
  }
  const skillIds = ordered(
    graph.nodes.flatMap(
      (node) =>
        node.effects?.flatMap((effect) =>
          effect.operator === 'emit-evidence' ? [effect.skillId] : [],
        ) ?? [],
    ),
  );
  const skillById = new Map(pack.skills.map((skill) => [skill.id, skill]));
  const prerequisiteSkillIds = ordered(
    skillIds
      .flatMap((skillId) => skillById.get(skillId)?.prerequisiteIds ?? [])
      .filter((id) => !skillIds.includes(id)),
  );
  return {
    skillIds,
    prerequisiteSkillIds,
    capabilityIds: ordered(
      graph.nodes.flatMap(
        (node) =>
          node.effects?.flatMap((effect) =>
            effect.operator === 'unlock-capability' ? [effect.capabilityId] : [],
          ) ?? [],
      ),
    ),
    decisionNodeIds: ordered(
      graph.nodes.flatMap((node) =>
        node.kind === 'scene' && node.transitions.branches.length > 0 ? [node.id] : [],
      ),
    ),
  };
}

function currentRun(
  runs: readonly ExperienceRun[],
  packId: string,
  experienceId: string,
): ExperienceRun | undefined {
  return runs
    .filter((run) => run.packId === packId && run.experienceId === experienceId)
    .sort(
      (left, right) => right.updatedAt - left.updatedAt || left.runId.localeCompare(right.runId),
    )[0];
}

function currentObjective(
  graph: ExperienceGraph | undefined,
  run: ExperienceRun | undefined,
): string | undefined {
  if (!graph || !run || run.ending) return undefined;
  const presentation = graph.nodes.find((node) => node.id === run.currentNodeId)?.presentation;
  if (!presentation) return undefined;
  if (presentation.kind === 'briefing') return presentation.title ?? presentation.body;
  if (presentation.kind === 'diagram') return presentation.caption ?? presentation.alt;
  return presentation.kind === 'dialogue'
    ? `${presentation.speaker}: ${presentation.body}`
    : presentation.body;
}

function stateForEpisode(
  run: ExperienceRun | undefined,
  prerequisites: readonly string[],
  masteryBySkill: Readonly<Record<string, MasteryBand | undefined>>,
  recommended: boolean,
): CampaignEpisodeState {
  // A saved, unfinished run is always resumable, even if a later evidence
  // import changes a prerequisite's current band. Never strand a learner.
  if (run && !run.ending) return 'resumable';
  if (run?.ending === 'complete') return 'completed';
  if (prerequisites.some((skillId) => masteryBySkill[skillId] !== 'secure')) return 'locked';
  return recommended ? 'recommended' : 'available';
}

function recommendedCampaignIds(
  campaigns: readonly Campaign[],
  episodeStates: ReadonlyMap<string, CampaignEpisodeState>,
): Set<string> {
  const ids = new Set<string>();
  for (const campaign of campaigns) {
    const allCompleted =
      campaign.experienceIds.length > 0 &&
      campaign.experienceIds.every(
        (experienceId) => episodeStates.get(experienceId) === 'completed',
      );
    if (allCompleted) for (const id of campaign.recommendedNextCampaignIds ?? []) ids.add(id);
  }
  if (ids.size === 0 && campaigns.length > 0) ids.add(campaigns[0]!.id);
  return ids;
}

/**
 * Produces a stable learner-facing map exclusively from authored pack/graph
 * data and local run/mastery projections. Completion never promotes a skill:
 * prerequisite locks require a `secure` mastery band.
 */
export function buildCampaignMap(input: CampaignMapInput): CampaignMapModel {
  const graphById = new Map(input.graphs.map((graph) => [graph.id, graph]));
  const factsByExperienceId = new Map(
    input.pack.experiences.map((experience) => [
      experience.id,
      factsForGraph(graphById.get(experience.id), input.pack),
    ]),
  );
  const masteryBySkill = Object.fromEntries(
    input.mastery.summaries.map((summary) => [summary.skillId, summary.band]),
  ) as Record<string, MasteryBand | undefined>;
  const firstPassStates = new Map<string, CampaignEpisodeState>();
  for (const experience of input.pack.experiences) {
    const facts = factsByExperienceId.get(experience.id)!;
    firstPassStates.set(
      experience.id,
      stateForEpisode(
        currentRun(input.runs, input.pack.id, experience.id),
        facts.prerequisiteSkillIds,
        masteryBySkill,
        false,
      ),
    );
  }
  const recommendedIds = recommendedCampaignIds(input.pack.campaigns, firstPassStates);
  const experienceById = new Map(
    input.pack.experiences.map((experience) => [experience.id, experience]),
  );

  const campaigns = input.pack.campaigns.map((campaign) => ({
    id: campaign.id,
    title: campaign.title,
    ...(campaign.description ? { description: campaign.description } : {}),
    recommended: recommendedIds.has(campaign.id),
    episodes: uniqueInAuthoredOrder(campaign.experienceIds).flatMap((experienceId) => {
      const experience = experienceById.get(experienceId);
      if (!experience) return [];
      const facts = factsByExperienceId.get(experienceId)!;
      const run = currentRun(input.runs, input.pack.id, experienceId);
      const recommended =
        recommendedIds.has(campaign.id) && experienceId === campaign.entryExperienceId;
      const state = stateForEpisode(run, facts.prerequisiteSkillIds, masteryBySkill, recommended);
      const objective = currentObjective(graphById.get(experienceId), run);
      const choicesMade = facts.decisionNodeIds.filter((nodeId) => {
        const index = run?.branchHistory.indexOf(nodeId) ?? -1;
        return index >= 0 && index < (run?.branchHistory.length ?? 0) - 1;
      }).length;
      return [
        {
          id: experience.id,
          title: experience.title,
          estimatedMinutes: experience.estimatedMinutes,
          state,
          prerequisiteSkillIds: facts.prerequisiteSkillIds,
          masteryBySkill: Object.fromEntries(
            facts.skillIds.map((skillId) => [skillId, masteryBySkill[skillId]]),
          ),
          decisionPointCount: facts.decisionNodeIds.length,
          choicesMade,
          unlockedCapabilityIds: facts.capabilityIds,
          ...(run && !run.ending
            ? { resumeRunId: run.runId, resumeNodeId: run.currentNodeId }
            : {}),
          ...(objective ? { currentObjective: objective } : {}),
        },
      ];
    }),
  }));

  const capabilitySources = new Map<string, string[]>();
  for (const [experienceId, facts] of factsByExperienceId) {
    for (const capabilityId of facts.capabilityIds) {
      capabilitySources.set(capabilityId, [
        ...(capabilitySources.get(capabilityId) ?? []),
        experienceId,
      ]);
    }
  }
  const unlocked = new Set(
    input.runs
      .filter((run) => run.packId === input.pack.id)
      .flatMap((run) => run.unlockedCapabilityIds),
  );
  const capabilities = [...capabilitySources]
    .map(([id, sourceExperienceIds]) => ({
      id,
      state: unlocked.has(id) ? ('unlocked' as const) : ('locked' as const),
      sourceExperienceIds: ordered(sourceExperienceIds),
    }))
    .sort((left, right) => left.id.localeCompare(right.id));

  return { campaigns, capabilities };
}
