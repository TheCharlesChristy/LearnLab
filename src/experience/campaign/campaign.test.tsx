import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { MasteryAggregation } from '../mastery';
import type { ExperienceRun } from '../run-state';
import type { CoursePack, Effect, ExperienceGraph, SceneNode } from '../types';

import { CampaignMap, LegacyCourseList } from './CampaignMap';
import { buildCampaignMap } from './model';

const pack: CoursePack = {
  schemaVersion: 2,
  id: 'weather',
  version: '1.0.0',
  title: 'Weather station',
  description: 'Learn to repair a station.',
  audience: { level: 'gcse', summary: 'GCSE learners' },
  taxonomy: { subjects: ['physics'], tags: ['weather'] },
  estimatedMinutes: 20,
  engineCapabilities: [],
  state: { version: '1.0.0', declarations: [], migrations: [] },
  skills: [
    { id: 'measure', title: 'Measure', description: 'Read a meter.', prerequisiteIds: [] },
    {
      id: 'repair',
      title: 'Repair',
      description: 'Repair a circuit.',
      prerequisiteIds: ['measure'],
    },
  ],
  experiences: [
    { id: 'observe', file: 'observe.json', title: 'Observe the relay', estimatedMinutes: 5 },
    { id: 'repair', file: 'repair.json', title: 'Repair the relay', estimatedMinutes: 10 },
  ],
  campaigns: [
    {
      id: 'arrival',
      title: 'Arrival',
      entryExperienceId: 'observe',
      experienceIds: ['observe'],
      recommendedNextCampaignIds: ['repair-campaign'],
    },
    {
      id: 'repair-campaign',
      title: 'Repair',
      entryExperienceId: 'repair',
      experienceIds: ['repair'],
    },
  ],
  assets: [],
  reviewItems: [],
};

function scene(id: string, effects: Effect[]): SceneNode {
  return {
    id,
    kind: 'scene',
    presentation: { kind: 'briefing', title: id, body: id },
    activity: { key: 'choice', version: '1.0.0', props: {} },
    goal: { operator: 'activity-complete' },
    feedback: { success: 'Done.' },
    effects,
    transitions: {
      branches: [{ when: { operator: 'state-equals', path: '/path', value: true }, to: 'end' }],
      fallback: { to: 'end' },
    },
  };
}

const graphs: ExperienceGraph[] = [
  {
    schemaVersion: 2,
    id: 'observe',
    packId: 'weather',
    version: '1.0.0',
    stateVersion: '1.0.0',
    entryNodeId: 'observe-start',
    nodes: [
      scene('observe-start', [
        {
          operator: 'emit-evidence',
          skillId: 'measure',
          outcome: 'success',
          independence: 'independent',
        },
        { operator: 'unlock-capability', capabilityId: 'meter' },
      ]),
      {
        id: 'end',
        kind: 'ending',
        presentation: { kind: 'explanation', body: 'Done' },
        termination: { status: 'complete', summary: 'Done' },
      },
    ],
  },
  {
    schemaVersion: 2,
    id: 'repair',
    packId: 'weather',
    version: '1.0.0',
    stateVersion: '1.0.0',
    entryNodeId: 'repair-start',
    nodes: [
      scene('repair-start', [
        {
          operator: 'emit-evidence',
          skillId: 'repair',
          outcome: 'success',
          independence: 'independent',
        },
      ]),
      {
        id: 'end',
        kind: 'ending',
        presentation: { kind: 'explanation', body: 'Done' },
        termination: { status: 'complete', summary: 'Done' },
      },
    ],
  },
];

const mastery: MasteryAggregation = {
  summaries: [
    {
      skillId: 'measure',
      status: 'classified',
      band: 'secure',
      evidence: {
        opportunities: 4,
        opportunitiesByKind: { retrieval: 0, application: 4, transfer: 0, unknown: 0 },
        opportunitiesBySupport: { independent: 4, hinted: 0, assisted: 0, unknown: 0 },
        successes: 4,
        partials: 0,
        failures: 0,
        independentSuccesses: 4,
        hintedSuccesses: 0,
        assistedSuccesses: 0,
        confidentWrong: 0,
        unknownContext: 0,
      },
      reasons: [],
    },
    {
      skillId: 'repair',
      status: 'insufficient-evidence',
      evidence: {
        opportunities: 0,
        opportunitiesByKind: { retrieval: 0, application: 0, transfer: 0, unknown: 0 },
        opportunitiesBySupport: { independent: 0, hinted: 0, assisted: 0, unknown: 0 },
        successes: 0,
        partials: 0,
        failures: 0,
        independentSuccesses: 0,
        hintedSuccesses: 0,
        assistedSuccesses: 0,
        confidentWrong: 0,
        unknownContext: 0,
      },
      reasons: [],
    },
  ],
  ignoredEvidence: [],
};

function run(overrides: Partial<ExperienceRun> = {}): ExperienceRun {
  return {
    runId: 'observe-run',
    schemaVersion: 1,
    packId: 'weather',
    experienceId: 'observe',
    packVersion: '1.0.0',
    experienceVersion: '1.0.0',
    stateVersion: '1.0.0',
    currentNodeId: 'end',
    variables: {},
    unlockedCapabilityIds: ['meter'],
    branchHistory: ['observe-start', 'end'],
    evidence: [],
    celebrations: [],
    ending: 'complete',
    eventCount: 2,
    createdAt: 1,
    updatedAt: 2,
    ...overrides,
  };
}

describe('campaign map (#50)', () => {
  it('derives recommendation, resume, capability, and locks from local run/mastery projections', () => {
    const model = buildCampaignMap({ pack, graphs: [...graphs].reverse(), runs: [run()], mastery });
    const observe = model.campaigns.find((campaign) => campaign.id === 'arrival')!.episodes[0]!;
    const repair = model.campaigns.find((campaign) => campaign.id === 'repair-campaign')!
      .episodes[0]!;
    expect(observe).toMatchObject({ state: 'completed', choicesMade: 1, decisionPointCount: 1 });
    expect(repair.state).toBe('recommended');
    expect(model.capabilities).toEqual([
      { id: 'meter', state: 'unlocked', sourceExperienceIds: ['observe'] },
    ]);

    const withoutMastery = buildCampaignMap({
      pack,
      graphs,
      runs: [run({ ending: undefined, currentNodeId: 'observe-start' })],
      mastery: {
        ...mastery,
        summaries: [{ ...mastery.summaries[0]!, band: 'developing' }, mastery.summaries[1]!],
      },
    });
    expect(
      withoutMastery.campaigns.find((campaign) => campaign.id === 'repair-campaign')!.episodes[0]!
        .state,
    ).toBe('locked');
    const resumable = withoutMastery.campaigns.find((campaign) => campaign.id === 'arrival')!
      .episodes[0]!;
    expect(resumable).toMatchObject({
      state: 'resumable',
      resumeNodeId: 'observe-start',
      currentObjective: 'observe-start',
    });
  });

  it('retains the authored episode sequence rather than alphabetising IDs', () => {
    const nonAlphabeticalPack: CoursePack = {
      ...pack,
      campaigns: [
        { ...pack.campaigns[0]!, experienceIds: ['repair', 'observe'] },
        pack.campaigns[1]!,
      ],
    };
    const model = buildCampaignMap({ pack: nonAlphabeticalPack, graphs, runs: [], mastery });
    expect(model.campaigns[0]!.episodes.map((episode) => episode.id)).toEqual([
      'repair',
      'observe',
    ]);
  });

  it('uses explicit text status, non-spoiling route summaries, and native controls', async () => {
    const open = vi.fn();
    const view = render(
      <CampaignMap
        model={buildCampaignMap({ pack, graphs, runs: [run()], mastery })}
        onOpenExperience={open}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Campaign map' })).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getAllByText(/Future route details stay hidden/)).toHaveLength(2);
    expect(screen.queryByText('state-equals')).not.toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getAllByRole('button', { name: 'Open' })[0]!);
    expect(open).toHaveBeenCalledWith(expect.objectContaining({ id: 'observe' }));

    view.rerender(
      <CampaignMap
        model={buildCampaignMap({
          pack,
          graphs,
          runs: [],
          mastery: {
            ...mastery,
            summaries: [{ ...mastery.summaries[0]!, band: 'developing' }, mastery.summaries[1]!],
          },
        })}
        onOpenExperience={open}
      />,
    );
    expect(screen.getByRole('button', { name: 'Locked' })).toBeDisabled();
  });

  it('retains a simple linked list fallback for v1 courses', () => {
    render(
      <LegacyCourseList
        title="Existing course"
        episodes={[{ id: 'one', title: 'First lesson', href: '#/lesson/one' }]}
      />,
    );
    expect(screen.getByRole('link', { name: 'First lesson' })).toHaveAttribute(
      'href',
      '#/lesson/one',
    );
  });
});
