// Studio validation adds navigation metadata around the v2 structural schema.
// Semantic cross-file validation remains the responsibility of B2's build
// pipeline; Studio makes the local graph problems actionable while editing.

import type { ErrorObject, ValidateFunction } from 'ajv';

import type { ExperienceGraph } from '../experience';
import { inboundReferences } from './model';

export interface StudioProblem {
  message: string;
  nodeId?: string;
  nodeIndex?: number;
  field?: string;
  pointer?: string;
}

function errorToProblem(error: ErrorObject, graph: ExperienceGraph): StudioProblem {
  const pointer = error.instancePath || '/';
  const nodeMatch = /^\/nodes\/(\d+)/.exec(pointer);
  const nodeIndex = nodeMatch === null ? undefined : Number(nodeMatch[1]);
  const nodeId = nodeIndex === undefined ? '$graph' : graph.nodes[nodeIndex]?.id;
  return {
    pointer,
    nodeId,
    nodeIndex,
    field: error.keyword === 'required' ? String(error.params.missingProperty ?? '') : pointer,
    message: `${pointer} ${error.message ?? 'is invalid'}`,
  };
}

/** Structural schema errors plus graph-local target and stable-ID checks. */
export function validateGraph(
  graph: ExperienceGraph,
  schemaValidator?: ValidateFunction,
): StudioProblem[] {
  const problems: StudioProblem[] = [];
  if (schemaValidator !== undefined && !schemaValidator(graph)) {
    problems.push(...(schemaValidator.errors ?? []).map((error) => errorToProblem(error, graph)));
  }

  const ids = new Map<string, number>();
  graph.nodes.forEach((node) => ids.set(node.id, (ids.get(node.id) ?? 0) + 1));
  for (const [id, count] of ids) {
    if (count > 1) {
      problems.push({ message: `Node id “${id}” is duplicated. IDs must stay stable and unique.`, nodeId: id, field: 'id' });
    }
  }
  if (!ids.has(graph.entryNodeId)) {
    problems.push({ message: `Entry node “${graph.entryNodeId}” does not exist.`, nodeId: '$graph', field: 'entryNodeId' });
  }
  for (const node of graph.nodes) {
    if (node.kind !== 'scene') continue;
    const edges = [{ target: node.transitions.fallback.to, field: 'transitions.fallback.to' }].concat(
      node.transitions.branches.map((branch, index) => ({ target: branch.to, field: `transitions.branches.${index}.to` })),
    );
    for (const edge of edges) {
      if (!ids.has(edge.target)) {
        problems.push({ message: `Transition target “${edge.target}” does not exist.`, nodeId: node.id, field: edge.field });
      }
    }
  }
  return problems;
}

export function describeDeleteConflict(graph: ExperienceGraph, nodeId: string): StudioProblem | null {
  const refs = inboundReferences(graph, nodeId);
  if (refs.length === 0) return null;
  const first = refs[0];
  return {
    message: `“${nodeId}” is still referenced by ${refs.length} edge${refs.length === 1 ? '' : 's'}.`,
    nodeId: first?.nodeId,
    field: first?.field,
  };
}
