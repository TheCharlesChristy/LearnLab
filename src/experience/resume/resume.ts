import { replayStoredRun } from '../run-state';
import type { ExperienceRun, RunStateValue, RunVariables } from '../run-state';
import type { CoursePack, ExperienceGraph, StateDeclaration, StateMigration } from '../types';

/** The authored content needed to decide whether a stored v2 run is safe to open. */
export interface ResumeTarget {
  pack: Pick<CoursePack, 'id' | 'version' | 'state'>;
  graph: Pick<ExperienceGraph, 'id' | 'version' | 'stateVersion' | 'entryNodeId' | 'nodes'>;
}

export interface ResumeFallback {
  /** A learner-safe reason. Do not surface raw persistence/migration errors. */
  message: string;
  /** Start a new run with these values; the existing diagnostic log is retained. */
  entryNodeId: string;
  initialVariables: RunVariables;
}

export type ResumePlan =
  | { kind: 'resume'; run: ExperienceRun }
  | { kind: 'migrate'; run: ExperienceRun; migrations: StateMigration[] }
  | { kind: 'reset'; fallback: ResumeFallback; migrations: StateMigration[] }
  | { kind: 'fallback'; fallback: ResumeFallback };

function defaults(declarations: readonly StateDeclaration[]): RunVariables {
  return Object.fromEntries(
    declarations.map((declaration) => [
      declaration.path,
      declaration.type === 'string-set' ? [...declaration.default] : declaration.default,
    ]),
  ) as RunVariables;
}

function isValueForDeclaration(value: unknown, declaration: StateDeclaration): value is RunStateValue {
  switch (declaration.type) {
    case 'boolean':
      return typeof value === 'boolean';
    case 'number':
      return (
        typeof value === 'number' &&
        Number.isFinite(value) &&
        (declaration.minimum === undefined || value >= declaration.minimum) &&
        (declaration.maximum === undefined || value <= declaration.maximum)
      );
    case 'string':
      return (
        typeof value === 'string' &&
        (declaration.enum === undefined || declaration.enum.includes(value))
      );
    case 'string-set':
      return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
  }
}

/**
 * Preserving a declared state schema is intentionally conservative: unknown,
 * mistyped, or newly constrained values reset to their authored defaults.
 * Content migrations remain declarative; no pack can execute a function here.
 */
function preserveDeclaredState(run: ExperienceRun, declarations: readonly StateDeclaration[]): RunVariables {
  const next = defaults(declarations);
  for (const declaration of declarations) {
    const value = run.variables[declaration.path];
    if (isValueForDeclaration(value, declaration)) {
      next[declaration.path] = Array.isArray(value) ? [...value] : value;
    }
  }
  return next;
}

function findMigrationPath(
  migrations: readonly StateMigration[],
  fromVersion: string,
  toVersion: string,
): StateMigration[] | null {
  if (fromVersion === toVersion) return [];
  const queue: { version: string; path: StateMigration[] }[] = [{ version: fromVersion, path: [] }];
  const visited = new Set<string>([fromVersion]);
  while (queue.length) {
    const current = queue.shift()!;
    for (const migration of migrations) {
      if (migration.fromVersion !== current.version || visited.has(migration.toVersion)) continue;
      const path = [...current.path, migration];
      if (migration.toVersion === toVersion) return path;
      visited.add(migration.toVersion);
      queue.push({ version: migration.toVersion, path });
    }
  }
  return null;
}

function fallback(target: ResumeTarget, message: string): ResumeFallback {
  return {
    message,
    entryNodeId: target.graph.entryNodeId,
    initialVariables: defaults(target.pack.state.declarations),
  };
}

function compatibleIdentity(run: ExperienceRun, target: ResumeTarget): boolean {
  return run.packId === target.pack.id && run.experienceId === target.graph.id;
}

function hasNode(target: ResumeTarget, id: string): boolean {
  return target.graph.nodes.some((node) => node.id === id);
}

function withTargetVersions(
  run: ExperienceRun,
  target: ResumeTarget,
  variables: RunVariables,
): ExperienceRun {
  return {
    ...run,
    packVersion: target.pack.version,
    experienceVersion: target.graph.version,
    stateVersion: target.graph.stateVersion,
    variables,
  };
}

/**
 * Decide how to open a saved run without writing to persistence. Callers save
 * only the returned `migrate` run at their next ordinary progress boundary;
 * reset/fallback always create a distinct run so diagnostic history is never
 * overwritten or silently mixed with another content version.
 */
export function planResume(run: ExperienceRun, target: ResumeTarget): ResumePlan {
  if (!compatibleIdentity(run, target)) {
    return { kind: 'fallback', fallback: fallback(target, 'This saved experience belongs to different content.') };
  }
  if (!hasNode(target, run.currentNodeId)) {
    return {
      kind: 'fallback',
      fallback: fallback(target, 'This experience has changed and cannot safely resume at its previous step.'),
    };
  }

  const migrations = findMigrationPath(
    target.pack.state.migrations,
    run.stateVersion,
    target.graph.stateVersion,
  );
  if (migrations === null) {
    return {
      kind: 'fallback',
      fallback: fallback(target, 'This saved version is no longer compatible. Start this experience again.'),
    };
  }
  if (migrations.some((migration) => migration.strategy === 'reset')) {
    return {
      kind: 'reset',
      migrations,
      fallback: fallback(target, 'This experience was updated and needs a fresh start.'),
    };
  }

  // A state-version match means this projection has already passed the
  // authored contract that created it. Do not reinterpret it merely because
  // a pack metadata/version string changed; declared-state coercion belongs
  // only to an explicit migration boundary.
  const variables =
    migrations.length > 0
      ? preserveDeclaredState(run, target.pack.state.declarations)
      : run.variables;
  const updated = withTargetVersions(run, target, variables);
  const changed =
    migrations.length > 0 ||
    run.packVersion !== target.pack.version ||
    run.experienceVersion !== target.graph.version ||
    JSON.stringify(run.variables) !== JSON.stringify(variables);
  return changed ? { kind: 'migrate', run: updated, migrations } : { kind: 'resume', run };
}

/**
 * Recovery boundary for reload. A corrupt/missing event stream is never
 * exposed to learners and never blocks the current content from opening.
 */
export async function loadResumePlan(
  runId: string,
  target: ResumeTarget,
  load: (id: string) => Promise<ExperienceRun> = replayStoredRun,
): Promise<ResumePlan> {
  try {
    return planResume(await load(runId), target);
  } catch {
    return {
      kind: 'fallback',
      fallback: fallback(target, 'Your previous progress could not be recovered safely. Start this experience again.'),
    };
  }
}
