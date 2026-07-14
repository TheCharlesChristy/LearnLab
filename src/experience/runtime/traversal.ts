// Deterministic scene traversal. This is intentionally framework-free so
// graph semantics can be exercised without React or IndexedDB.

import { applyEffects } from '../run-state';
import type { ExperienceGraph, ExperienceNode, SceneNode, Transitions } from '../types';
import type { ExperienceRun } from '../run-state';

import {
  evaluateCondition,
  evaluateGoal,
  type ActivityOutcome,
  type EvaluationContext,
  type MasteryBand,
} from './evaluation';

export interface TraversalContext {
  outcome?: ActivityOutcome;
  masteryBySkill?: Readonly<Record<string, MasteryBand | undefined>>;
}

export interface SceneAdvancePlan {
  scene: SceneNode;
  target: ExperienceNode;
  /** The first matching conditional branch, otherwise the explicit fallback. */
  transition: { to: string; label?: string; conditional: boolean };
}

function findNode(graph: ExperienceGraph, id: string): ExperienceNode {
  const node = graph.nodes.find((candidate) => candidate.id === id);
  if (!node) throw new Error(`Experience graph ${graph.id} has no node named ${id}.`);
  return node;
}

/** Selects the first true conditional destination; branch order is authored order. */
export function selectTransition(
  transitions: Transitions,
  context: EvaluationContext,
): { to: string; label?: string; conditional: boolean } {
  for (const branch of transitions.branches) {
    if (evaluateCondition(branch.when, context)) {
      return { to: branch.to, label: branch.label, conditional: true };
    }
  }
  return { to: transitions.fallback.to, label: transitions.fallback.label, conditional: false };
}

/**
 * Plans one accepted scene boundary without writing it. Effects are reduced
 * before conditions, so a scene may route on state it has just earned. The
 * caller persists this exact boundary through the run-state facade.
 */
export function planSceneAdvance(
  graph: ExperienceGraph,
  run: ExperienceRun,
  eventId: string,
  context: TraversalContext,
): SceneAdvancePlan | null {
  const current = findNode(graph, run.currentNodeId);
  if (current.kind !== 'scene') {
    throw new Error(`Run ${run.runId} is already at terminal node ${current.id}.`);
  }
  if (!evaluateGoal(current.goal, context.outcome)) return null;

  const projected = applyEffects(run, current.effects, { eventId, nodeId: current.id });
  const transition = selectTransition(current.transitions, {
    state: projected.variables,
    outcome: context.outcome,
    masteryBySkill: context.masteryBySkill,
  });
  return { scene: current, target: findNode(graph, transition.to), transition };
}
