import type { Skill } from '../types';
import type { SkillGraph, SkillGraphDiagnostic } from './types';

function sorted(values: readonly string[]): string[] {
  return [...values].sort((left, right) => left.localeCompare(right));
}

/**
 * Validate the authored prerequisite DAG beyond JSON Schema's local shape
 * checks. The content builder can call this pure function when its contract is
 * next extended; keeping it here avoids giving authored data runtime powers.
 */
export function validateSkillGraph(skills: readonly Skill[]): SkillGraphDiagnostic[] {
  const diagnostics: SkillGraphDiagnostic[] = [];
  const seen = new Set<string>();
  const ids = new Set(skills.map((skill) => skill.id));

  for (const skill of skills) {
    if (seen.has(skill.id)) diagnostics.push({ code: 'duplicate-skill-id', skillId: skill.id });
    seen.add(skill.id);
    for (const prerequisiteId of skill.prerequisiteIds) {
      if (prerequisiteId === skill.id) {
        diagnostics.push({ code: 'self-prerequisite', skillId: skill.id, prerequisiteId });
      } else if (!ids.has(prerequisiteId)) {
        diagnostics.push({ code: 'unknown-prerequisite', skillId: skill.id, prerequisiteId });
      }
    }
  }

  const prerequisites = new Map(
    skills.map((skill) => [skill.id, skill.prerequisiteIds.filter((id) => ids.has(id) && id !== skill.id)]),
  );
  const state = new Map<string, 'visiting' | 'visited'>();
  const stack: string[] = [];
  const cycleKeys = new Set<string>();
  const visit = (id: string): void => {
    const current = state.get(id);
    if (current === 'visited') return;
    if (current === 'visiting') {
      const start = stack.indexOf(id);
      const cycle = [...stack.slice(start), id];
      const key = sorted(cycle.slice(0, -1)).join('\u0000');
      if (!cycleKeys.has(key)) {
        cycleKeys.add(key);
        diagnostics.push({ code: 'cyclic-prerequisites', skillId: id, cycle });
      }
      return;
    }
    state.set(id, 'visiting');
    stack.push(id);
    for (const prerequisiteId of prerequisites.get(id) ?? []) visit(prerequisiteId);
    stack.pop();
    state.set(id, 'visited');
  };
  for (const id of sorted([...ids])) visit(id);

  return diagnostics.sort((left, right) =>
    [left.skillId, left.code, left.prerequisiteId ?? '', left.cycle?.join('\u0000') ?? '']
      .join('\u0000')
      .localeCompare([right.skillId, right.code, right.prerequisiteId ?? '', right.cycle?.join('\u0000') ?? ''].join('\u0000')),
  );
}

/** Build stable prerequisite/dependent indexes only for a valid authored graph. */
export function buildSkillGraph(skills: readonly Skill[]): SkillGraph {
  const diagnostics = validateSkillGraph(skills);
  if (diagnostics.length > 0) {
    throw new Error(`Invalid skill graph: ${diagnostics.map((item) => item.code).join(', ')}.`);
  }
  const skillIds = sorted(skills.map((skill) => skill.id));
  const prerequisiteIdsBySkill: Record<string, string[]> = {};
  const dependentIdsBySkill: Record<string, string[]> = {};
  for (const skillId of skillIds) dependentIdsBySkill[skillId] = [];
  for (const skill of skills) {
    prerequisiteIdsBySkill[skill.id] = sorted(skill.prerequisiteIds);
    for (const prerequisiteId of skill.prerequisiteIds) dependentIdsBySkill[prerequisiteId]!.push(skill.id);
  }
  for (const skillId of skillIds) dependentIdsBySkill[skillId] = sorted(dependentIdsBySkill[skillId]!);
  return { skillIds, prerequisiteIdsBySkill, dependentIdsBySkill };
}
