// Local LearnLab Studio graph-editing operations.
//
// These functions intentionally operate on a caller-owned in-memory graph. They
// never use fetch, IndexedDB, or a filesystem API: persisting an edit is an
// explicit export action in StudioPage.

import type { EndingNode, ExperienceGraph, ExperienceNode, SceneNode } from '../experience';

export interface StudioConflict {
  message: string;
  nodeId?: string;
  field?: string;
}

export interface InboundReference {
  nodeId: string;
  field: string;
}

export function cloneGraph<T>(graph: T): T {
  return structuredClone(graph);
}

export function nextNodeId(graph: ExperienceGraph, prefix: 'scene' | 'ending'): string {
  const ids = new Set(graph.nodes.map((node) => node.id));
  for (let number = 1; ; number += 1) {
    const candidate = `${prefix}-${number}`;
    if (!ids.has(candidate)) return candidate;
  }
}

export function createNode(graph: ExperienceGraph, kind: 'scene' | 'ending'): ExperienceNode {
  if (kind === 'ending') {
    return {
      id: nextNodeId(graph, 'ending'),
      kind: 'ending',
      presentation: { kind: 'briefing', title: 'New ending', body: 'Describe the outcome.' },
      termination: { status: 'complete', summary: 'Describe what the learner completed.' },
    } satisfies EndingNode;
  }
  return {
    id: nextNodeId(graph, 'scene'),
    kind: 'scene',
    presentation: { kind: 'briefing', title: 'New scene', body: 'Describe the situation.' },
    activity: { key: 'replace-me', version: '0.0.0', props: {} },
    goal: { operator: 'activity-complete' },
    feedback: { success: 'Describe successful feedback.' },
    effects: [],
    transitions: { branches: [], fallback: { to: '' } },
  } satisfies SceneNode;
}

/** Every edge pointing at `targetId`, including an entry-node reference. */
export function inboundReferences(graph: ExperienceGraph, targetId: string): InboundReference[] {
  const refs: InboundReference[] = [];
  if (graph.entryNodeId === targetId) refs.push({ nodeId: '$graph', field: 'entryNodeId' });
  for (const node of graph.nodes) {
    if (node.kind !== 'scene') continue;
    if (node.transitions.fallback.to === targetId) {
      refs.push({ nodeId: node.id, field: 'transitions.fallback.to' });
    }
    node.transitions.branches.forEach((branch, index) => {
      if (branch.to === targetId) {
        refs.push({ nodeId: node.id, field: `transitions.branches.${index}.to` });
      }
    });
  }
  return refs;
}

/**
 * Delete is deliberately conservative: it refuses to orphan any stable graph
 * reference. The author must repoint or remove each edge first.
 */
export function deleteNode(
  graph: ExperienceGraph,
  nodeId: string,
): { graph?: ExperienceGraph; conflict?: StudioConflict } {
  const node = graph.nodes.find((candidate) => candidate.id === nodeId);
  if (node === undefined) return { conflict: { message: `Node “${nodeId}” does not exist.` } };
  const refs = inboundReferences(graph, nodeId);
  if (refs.length > 0) {
    return {
      conflict: {
        message: `Cannot delete “${nodeId}”: ${refs.length} stable reference${refs.length === 1 ? '' : 's'} still point${refs.length === 1 ? 's' : ''} to it. Repoint them first.`,
        nodeId: refs[0]?.nodeId,
        field: refs[0]?.field,
      },
    };
  }
  return { graph: { ...graph, nodes: graph.nodes.filter((candidate) => candidate.id !== nodeId) } };
}

/** Copy a node but never copy its identifier; references remain untouched. */
export function duplicateNode(graph: ExperienceGraph, nodeId: string): ExperienceGraph | StudioConflict {
  const original = graph.nodes.find((node) => node.id === nodeId);
  if (original === undefined) return { message: `Node “${nodeId}” does not exist.` };
  const clone = cloneGraph(original);
  clone.id = nextNodeId(graph, original.kind);
  return { ...graph, nodes: [...graph.nodes, clone] };
}

export function setTransitionTarget(
  graph: ExperienceGraph,
  nodeId: string,
  field: 'fallback' | number,
  targetId: string,
): ExperienceGraph | StudioConflict {
  if (!graph.nodes.some((node) => node.id === targetId)) {
    return { message: `Transition target “${targetId}” does not exist.`, nodeId, field: 'transitions' };
  }
  const nodes = graph.nodes.map((node) => {
    if (node.id !== nodeId || node.kind !== 'scene') return node;
    const transitions = cloneGraph(node.transitions);
    if (field === 'fallback') transitions.fallback.to = targetId;
    else {
      const branch = transitions.branches[field];
      if (branch !== undefined) branch.to = targetId;
    }
    return { ...node, transitions };
  });
  return { ...graph, nodes };
}
