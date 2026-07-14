import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { appendRunBoundary } from '../run-state';
import type { ExperienceRun, RunBoundaryInput } from '../run-state';
import type { EndingNode, ExperienceGraph, SceneNode } from '../types';
import { Button, Spinner } from '../../ui';

import type { ActivityOutcome, MasteryBand } from './evaluation';
import { planSceneAdvance } from './traversal';

export interface SceneActivityRenderProps {
  scene: SceneNode;
  run: ExperienceRun;
  /** Activity components call this only after a real learner interaction. */
  reportOutcome: (outcome: ActivityOutcome) => void;
  disabled: boolean;
}

export interface SceneRunnerPersistence {
  appendBoundary: (runId: string, input: RunBoundaryInput) => Promise<ExperienceRun>;
}

export interface SceneRunnerProps {
  graph: ExperienceGraph;
  /** The caller starts/resumes the run through the run-state facade. */
  run: ExperienceRun;
  renderActivity: (props: SceneActivityRenderProps) => ReactNode;
  onRunChange: (run: ExperienceRun) => void;
  persistence?: SceneRunnerPersistence;
  masteryBySkill?: Readonly<Record<string, MasteryBand | undefined>>;
  /** Injectable for deterministic tests and caller-owned id policies. */
  createEventId?: (nodeId: string, sequence: number) => string;
  /** Enables bounded diagnostic detail without exposing it to learners in production. */
  development?: boolean;
}

interface RunnerError {
  learnerMessage: string;
  diagnostic: string;
  retry?: () => void;
}

const DEFAULT_PERSISTENCE: SceneRunnerPersistence = { appendBoundary: appendRunBoundary };

function defaultEventId(nodeId: string, sequence: number): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `scene-${nodeId}-${sequence}-${Math.random().toString(36).slice(2)}`;
}

function diagnostic(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  return raw.slice(0, 280);
}

function Presentation({ node }: { node: SceneNode | EndingNode }) {
  const presentation = node.presentation;
  const heading = presentation.kind === 'briefing' ? presentation.title : undefined;
  const body =
    presentation.kind === 'diagram'
      ? (presentation.caption ?? presentation.alt)
      : presentation.body;
  return (
    <header>
      {heading ? <h1 className="text-2xl font-bold">{heading}</h1> : null}
      {presentation.kind === 'dialogue' ? (
        <p className="font-semibold">{presentation.speaker}</p>
      ) : null}
      <p className="mt-2 whitespace-pre-wrap text-slate-700 dark:text-slate-200">{body}</p>
      {presentation.kind === 'diagram' ? (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {presentation.caption ?? presentation.alt}
        </p>
      ) : null}
    </header>
  );
}

function LearnerSafeError({ error, development }: { error: RunnerError; development: boolean }) {
  return (
    <section
      role="alert"
      className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-950 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
    >
      <p>{error.learnerMessage}</p>
      {error.retry ? (
        <Button className="mt-3" variant="secondary" onClick={error.retry}>
          Try again
        </Button>
      ) : null}
      {development ? (
        <p data-testid="scene-runner-diagnostic" className="mt-3 break-words text-xs">
          Diagnostic: {error.diagnostic}
        </p>
      ) : null}
    </section>
  );
}

function Ending({ node }: { node: EndingNode }) {
  return (
    <section
      aria-label="Experience complete"
      className="rounded-xl border border-slate-200 p-6 dark:border-slate-700"
    >
      <Presentation node={node} />
      <h2 className="mt-5 text-xl font-bold">
        {node.termination.status === 'complete' ? 'Complete' : 'Experience ended'}
      </h2>
      <p className="mt-2">{node.termination.summary}</p>
    </section>
  );
}

/**
 * Renders exactly one v2 scene. It has no implicit Continue control: only an
 * activity outcome satisfying the registered goal may cross a run boundary.
 */
export function SceneRunner({
  graph,
  run,
  renderActivity,
  onRunChange,
  persistence = DEFAULT_PERSISTENCE,
  masteryBySkill,
  createEventId = defaultEventId,
  development = import.meta.env.DEV,
}: SceneRunnerProps) {
  const [pending, setPending] = useState(false);
  const [activityRevision, setActivityRevision] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<RunnerError | null>(null);
  const committedTerminal = useRef<string | null>(null);

  const node = graph.nodes.find((candidate) => candidate.id === run.currentNodeId);
  const terminal = node?.kind === 'ending' ? node : undefined;

  // Arrival at an ending is itself a terminal graph boundary. It has no
  // learner-facing action, but is persisted once so ending effects and status
  // survive a reload. The ref prevents StrictMode/re-render duplicate writes.
  useEffect(() => {
    if (!terminal || run.ending || pending) return;
    const key = `${run.runId}:${run.eventCount}:${terminal.id}`;
    if (committedTerminal.current === key) return;
    committedTerminal.current = key;
    setPending(true);
    setError(null);
    const input: RunBoundaryInput = {
      eventId: createEventId(terminal.id, run.eventCount),
      nodeId: terminal.id,
      effects: terminal.effects ?? [],
      ending: terminal.termination.status,
    };
    void persistence
      .appendBoundary(run.runId, input)
      .then(
        (next) => onRunChange(next),
        (cause: unknown) => {
          setError({
            learnerMessage:
              'We could not save the end of this experience. Your progress has not changed.',
            diagnostic: diagnostic(cause),
            retry: () => {
              committedTerminal.current = null;
              setError(null);
              setActivityRevision((revision) => revision + 1);
            },
          });
        },
      )
      .finally(() => setPending(false));
  }, [activityRevision, createEventId, onRunChange, pending, persistence, run, terminal]);

  if (!node) {
    return (
      <LearnerSafeError
        development={development}
        error={{
          learnerMessage: 'This activity cannot be opened safely.',
          diagnostic: `Missing current node ${run.currentNodeId}.`,
        }}
      />
    );
  }
  if (terminal) {
    return (
      <div className="space-y-4">
        <Ending node={terminal} />
        {pending ? <Spinner label="Saving outcome…" /> : null}
        {error ? <LearnerSafeError error={error} development={development} /> : null}
      </div>
    );
  }
  // The two returns above eliminate missing and terminal nodes. TypeScript
  // cannot retain that correlation through the `terminal` alias, so retain
  // the narrowed scene contract explicitly for the activity-only path.
  const scene = node as SceneNode;

  function reportOutcome(outcome: ActivityOutcome) {
    if (pending) return;
    setError(null);
    setNotice(null);
    const eventId = createEventId(scene.id, run.eventCount);
    let plan;
    try {
      plan = planSceneAdvance(graph, run, eventId, { outcome, masteryBySkill });
    } catch (cause) {
      setError({
        learnerMessage: 'We could not continue this activity. Your progress has not changed.',
        diagnostic: diagnostic(cause),
      });
      return;
    }
    if (!plan) {
      setNotice(scene.feedback.failure ?? 'That attempt does not meet the goal yet. Try again.');
      setActivityRevision((revision) => revision + 1);
      return;
    }

    setPending(true);
    const input: RunBoundaryInput = {
      eventId,
      nodeId: scene.id,
      effects: scene.effects,
      nextNodeId: plan.target.id,
      ...(outcome.completed === undefined ? {} : { telemetry: undefined }),
    };
    void persistence
      .appendBoundary(run.runId, input)
      .then(
        (next) => onRunChange(next),
        (cause: unknown) => {
          setError({
            learnerMessage: 'We could not save this progress. Your progress has not changed.',
            diagnostic: diagnostic(cause),
          });
        },
      )
      .finally(() => setPending(false));
  }

  return (
    <section
      aria-label={
        scene.accessibility?.ariaLabel ??
        (scene.presentation.kind === 'briefing'
          ? (scene.presentation.title ?? 'Experience scene')
          : 'Experience scene')
      }
      className="space-y-5"
    >
      <Presentation node={scene} />
      {notice ? (
        <p
          aria-live="polite"
          className="rounded-md bg-amber-50 p-3 text-amber-950 dark:bg-amber-950 dark:text-amber-100"
        >
          {notice}
        </p>
      ) : null}
      {scene.feedback.hints?.length ? (
        <details>
          <summary>Need a hint?</summary>
          <ol className="mt-2 list-decimal pl-5">
            {scene.feedback.hints.map((hint) => (
              <li key={hint}>{hint}</li>
            ))}
          </ol>
        </details>
      ) : null}
      {error ? <LearnerSafeError error={error} development={development} /> : null}
      <div key={`${run.runId}:${scene.id}:${activityRevision}`}>
        {renderActivity({ scene, run, reportOutcome, disabled: pending })}
      </div>
      {pending ? <Spinner label="Saving progress…" /> : null}
    </section>
  );
}
