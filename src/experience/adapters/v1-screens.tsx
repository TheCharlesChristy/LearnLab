import { useRef } from 'react';

import { screenRegistry } from '../../screens';
import type { Screen, ScreenSequence } from '../../screens';
import type { ActivityOutcome } from '../runtime';
import type { ExperienceGraph, ExperienceNode, SceneNode } from '../types';
import type { V1ScreenActivityProps } from './v1-screen-plugin';
import { coreActivityKeyForScreen } from './core-screen-plugins';

export interface AdaptScreenSequenceOptions {
  packId: string;
  /** Stable legacy lesson id, retained for screen-local persistence namespaces. */
  lessonId: string;
  version?: string;
  stateVersion?: string;
}

function sceneFor(
  screen: Screen,
  index: number,
  sequence: ScreenSequence,
  options: Required<AdaptScreenSequenceOptions>,
): SceneNode {
  const next =
    index + 1 < sequence.screens.length ? sequence.screens[index + 1]!.id : '__complete__';
  const coreActivityKey = coreActivityKeyForScreen(screen);
  return {
    id: screen.id,
    kind: 'scene',
    presentation: { kind: 'explanation', body: '' },
    activity: {
      // C3 owns the core screened interactions. C4 leaves the explorable
      // `manipulable-target` on the compatibility adapter until its observable
      // widget/plugin contract exists.
      key: coreActivityKey ?? 'v1-screen',
      version: '1.0.0',
      props: {
        legacyLessonId: options.lessonId,
        screen,
        index,
        total: sequence.screens.length,
      } satisfies V1ScreenActivityProps,
    },
    goal: { operator: 'activity-complete' },
    feedback: { success: 'Continue when you have completed this step.' },
    // A legacy screen sequence was already resume-safe after each screen.
    // Mirroring that durable boundary is the adapter's only v2 effect.
    effects: [{ operator: 'checkpoint', label: `Legacy screen: ${screen.id}` }],
    transitions: { branches: [], fallback: { to: next } },
    accessibility: { ariaLabel: `${sequence.title}: step ${index + 1}` },
  };
}

/** Converts a v1 gated screen sequence to a linear v2 graph without changing its content. */
export function adaptScreenSequence(
  sequence: ScreenSequence,
  options: AdaptScreenSequenceOptions,
): ExperienceGraph {
  const completeOptions: Required<AdaptScreenSequenceOptions> = {
    version: '1.0.0',
    stateVersion: '1.0.0',
    ...options,
  };
  const scenes = sequence.screens.map((screen, index) =>
    sceneFor(screen, index, sequence, completeOptions),
  );
  const ending: ExperienceNode = {
    id: '__complete__',
    kind: 'ending',
    presentation: { kind: 'explanation', body: `${sequence.title} complete.` },
    termination: { status: 'complete', summary: 'You completed every legacy screen.' },
  };
  return {
    schemaVersion: 2,
    id: sequence.id,
    packId: completeOptions.packId,
    version: completeOptions.version,
    stateVersion: completeOptions.stateVersion,
    entryNodeId: sequence.screens[0]?.id ?? '__complete__',
    nodes: [...scenes, ending],
  };
}

export interface V1ScreenActivityAdapterProps {
  /** Props emitted by adaptScreenSequence for the current `v1-screen` activity. */
  props: V1ScreenActivityProps;
  reportOutcome: (outcome: ActivityOutcome) => void;
  disabled: boolean;
}

/**
 * Wraps the original v1 screen runner instead of duplicating its interaction
 * and gating behaviour. The one-shot guard prevents duplicate outcomes from a
 * repeated legacy callback; SceneRunner then atomically owns the v2 boundary.
 */
export function V1ScreenActivityAdapter({
  props,
  reportOutcome,
  disabled,
}: V1ScreenActivityAdapterProps) {
  const advanced = useRef(false);
  const Runner = screenRegistry[props.screen.type].component;
  return (
    <Runner
      screen={props.screen}
      screenKey={`${props.legacyLessonId}:${props.screen.id}`}
      index={props.index}
      total={props.total}
      onAdvance={() => {
        if (disabled || advanced.current) return;
        advanced.current = true;
        reportOutcome({ completed: true });
      }}
    />
  );
}
