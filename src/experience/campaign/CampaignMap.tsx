import type { MouseEvent } from 'react';

import type { CampaignEpisodeMap, CampaignMapModel } from './model';

export interface CampaignMapProps {
  model: CampaignMapModel;
  onOpenExperience?: (episode: CampaignEpisodeMap) => void;
}

const STATE_TEXT: Record<CampaignEpisodeMap['state'], string> = {
  locked: 'Locked — prerequisite mastery is still needed',
  available: 'Available',
  recommended: 'Recommended next',
  resumable: 'Resume in progress',
  completed: 'Completed',
};

function EpisodeCard({
  episode,
  onOpenExperience,
}: {
  episode: CampaignEpisodeMap;
  onOpenExperience?: (episode: CampaignEpisodeMap) => void;
}) {
  const locked = episode.state === 'locked';
  const action = episode.state === 'resumable' ? 'Resume' : 'Open';
  function open(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    if (!locked) onOpenExperience?.(episode);
  }
  return (
    <li className="rounded-xl border border-slate-300 bg-white p-4 dark:border-slate-600 dark:bg-slate-900">
      <h3 className="text-lg font-bold text-slate-950 dark:text-white">{episode.title}</h3>
      <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
        {STATE_TEXT[episode.state]}
      </p>
      <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
        About {episode.estimatedMinutes} minutes.
      </p>
      {episode.prerequisiteSkillIds.length ? (
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
          Prerequisites: {episode.prerequisiteSkillIds.join(', ')}.
        </p>
      ) : null}
      {Object.keys(episode.masteryBySkill).length ? (
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
          Mastery:{' '}
          {Object.entries(episode.masteryBySkill)
            .map(([skillId, band]) => `${skillId} — ${band ?? 'evidence still gathering'}`)
            .join('; ')}
          .
        </p>
      ) : null}
      {episode.resumeNodeId ? (
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
          Saved position: {episode.resumeNodeId}.
        </p>
      ) : null}
      {episode.currentObjective ? (
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
          Current objective: {episode.currentObjective}
        </p>
      ) : null}
      {episode.decisionPointCount ? (
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
          {episode.choicesMade} of {episode.decisionPointCount} route choices recorded. Future route
          details stay hidden until you reach them.
        </p>
      ) : null}
      {episode.unlockedCapabilityIds.length ? (
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
          Can earn: {episode.unlockedCapabilityIds.join(', ')}.
        </p>
      ) : null}
      {onOpenExperience ? (
        <button
          type="button"
          disabled={locked}
          onClick={open}
          className="mt-4 min-h-11 rounded-md bg-indigo-700 px-4 py-2 font-semibold text-white enabled:hover:bg-indigo-800 disabled:cursor-not-allowed disabled:bg-slate-500"
        >
          {locked ? 'Locked' : action}
        </button>
      ) : null}
    </li>
  );
}

/**
 * A reflowing semantic campaign map. It intentionally represents routes as
 * ordered cards, not a canvas, so keyboard users, touch users and 200% zoom
 * retain the same complete information. Future branch labels are never shown.
 */
export function CampaignMap({ model, onOpenExperience }: CampaignMapProps) {
  return (
    <section aria-labelledby="campaign-map-heading" className="mx-auto max-w-6xl space-y-8">
      <header>
        <h1 id="campaign-map-heading" className="text-2xl font-bold text-slate-950 dark:text-white">
          Campaign map
        </h1>
        <p className="mt-2 max-w-3xl text-slate-700 dark:text-slate-200">
          Your route uses saved progress and demonstrated mastery. It does not compare you with
          other learners.
        </p>
      </header>
      <div className="space-y-6">
        {model.campaigns.map((campaign) => (
          <section
            key={campaign.id}
            aria-labelledby={`campaign-${campaign.id}`}
            className="rounded-2xl bg-slate-100 p-4 sm:p-6 dark:bg-slate-800"
          >
            <h2
              id={`campaign-${campaign.id}`}
              className="text-xl font-bold text-slate-950 dark:text-white"
            >
              {campaign.title}
              {campaign.recommended ? ' — recommended route' : ''}
            </h2>
            {campaign.description ? (
              <p className="mt-1 text-slate-700 dark:text-slate-200">{campaign.description}</p>
            ) : null}
            <ol className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {campaign.episodes.map((episode) => (
                <EpisodeCard
                  key={episode.id}
                  episode={episode}
                  onOpenExperience={onOpenExperience}
                />
              ))}
            </ol>
          </section>
        ))}
      </div>
      {model.capabilities.length ? (
        <section
          aria-labelledby="capability-progression-heading"
          className="rounded-2xl border border-slate-300 p-4 sm:p-6 dark:border-slate-600"
        >
          <h2
            id="capability-progression-heading"
            className="text-xl font-bold text-slate-950 dark:text-white"
          >
            Capability progression
          </h2>
          <ul className="mt-3 space-y-2">
            {model.capabilities.map((capability) => (
              <li key={capability.id}>
                <strong>{capability.id}</strong>:{' '}
                {capability.state === 'unlocked'
                  ? 'Unlocked'
                  : `Locked — earned in ${capability.sourceExperienceIds.join(', ')}.`}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}

export interface LegacyCourseListProps {
  title: string;
  episodes: readonly { id: string; title: string; href: string }[];
}

/** A deliberately simple list fallback for v1 course/module navigation. */
export function LegacyCourseList({ title, episodes }: LegacyCourseListProps) {
  return (
    <section aria-labelledby="legacy-course-list-heading" className="mx-auto max-w-3xl">
      <h1
        id="legacy-course-list-heading"
        className="text-2xl font-bold text-slate-950 dark:text-white"
      >
        {title}
      </h1>
      <ol className="mt-4 space-y-2">
        {episodes.map((episode) => (
          <li key={episode.id}>
            <a
              className="block rounded-md p-3 font-semibold text-indigo-800 underline hover:bg-indigo-50 dark:text-indigo-200 dark:hover:bg-slate-800"
              href={episode.href}
            >
              {episode.title}
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
