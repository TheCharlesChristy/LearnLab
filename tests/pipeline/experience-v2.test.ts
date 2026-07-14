// @vitest-environment node
// B2 / #37: v2 graph discovery must fail before runtime for cross-file faults.

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, describe, expect, it } from 'vitest';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const script = path.join(repoRoot, 'scripts', 'build-content.mjs');
const source = path.join(repoRoot, 'fixtures', 'experience-v2');
const tempDirs: string[] = [];

afterAll(() => tempDirs.forEach((dir) => fs.rmSync(dir, { recursive: true, force: true })));

function tempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'learnlab-experience-v2-'));
  tempDirs.push(dir);
  return dir;
}

function setupPack(): { root: string; packFile: string; graphFile: string } {
  const root = tempDir();
  const packDir = path.join(root, 'v2', 'bridge-missions');
  fs.mkdirSync(path.join(packDir, 'experiences'), { recursive: true });
  fs.mkdirSync(path.join(packDir, 'assets'), { recursive: true });
  fs.copyFileSync(
    path.join(source, 'course-pack.valid.json'),
    path.join(packDir, 'course-pack.json'),
  );
  const files: Record<string, string> = {
    'linear-mission.json': 'linear.valid.json',
    'branch-mission.json': 'branching.valid.json',
    'loop-mission.json': 'looping.valid.json',
    'multi-ending-mission.json': 'multi-ending.valid.json',
  };
  Object.entries(files).forEach(([target, fixture]) =>
    fs.copyFileSync(path.join(source, fixture), path.join(packDir, 'experiences', target)),
  );
  fs.writeFileSync(path.join(packDir, 'assets', 'bridge.webp'), 'fixture');
  return {
    root,
    packFile: path.join(packDir, 'course-pack.json'),
    graphFile: path.join(packDir, 'experiences', 'linear-mission.json'),
  };
}

function run(root: string, ...args: string[]) {
  const result = spawnSync(process.execPath, [script, '--root', root, ...args], {
    encoding: 'utf8',
    timeout: 60_000,
  });
  return { status: result.status, output: `${result.stdout}\n${result.stderr}` };
}

function json(file: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>;
}

function write(file: string, value: unknown) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

describe('Experience Runtime v2 semantic build validation (#37)', () => {
  it('discovers a strict-valid pack and emits deterministic navigation and learner-text indexes', () => {
    const { root } = setupPack();
    const first = run(root, '--strict');
    expect(first.status, first.output).toBe(0);
    const indexFile = path.join(root, 'experience-index.json');
    const searchFile = path.join(root, 'experience-search-index.json');
    const firstIndex = fs.readFileSync(indexFile, 'utf8');
    const firstSearch = fs.readFileSync(searchFile, 'utf8');
    expect(JSON.parse(firstIndex)).toMatchObject({
      schemaVersion: 1,
      packs: [{ id: 'bridge-missions' }],
    });
    expect(firstSearch).toContain('Check the forces on the deck.');
    expect(firstSearch).toContain('Are the forces balanced?');
    expect(firstSearch).not.toContain('Equal opposing forces give zero resultant force.');
    expect(fs.existsSync(path.join(root, 'review-catalogue.json'))).toBe(true);
    const second = run(root, '--strict');
    expect(second.status, second.output).toBe(0);
    expect(fs.readFileSync(indexFile, 'utf8')).toBe(firstIndex);
    expect(fs.readFileSync(searchFile, 'utf8')).toBe(firstSearch);
  }, 15_000);

  it('reports missing destinations, duplicate node IDs, and undeclared state paths with files and pointers', () => {
    const missing = setupPack();
    const graph = json(missing.graphFile);
    (
      (graph.nodes as Array<Record<string, unknown>>)[0].transitions as Record<string, unknown>
    ).fallback = { to: 'not-a-node' };
    write(missing.graphFile, graph);
    const missingResult = run(missing.root);
    expect(missingResult.status).not.toBe(0);
    expect(missingResult.output).toContain('linear-mission.json#/nodes/0/transitions/fallback/to');
    expect(missingResult.output).toContain('destination node "not-a-node" does not exist');

    const duplicate = setupPack();
    const duplicateGraph = json(duplicate.graphFile);
    const duplicateNodes = duplicateGraph.nodes as Array<Record<string, unknown>>;
    duplicateNodes[1].id = duplicateNodes[0].id;
    write(duplicate.graphFile, duplicateGraph);
    const duplicateResult = run(duplicate.root);
    expect(duplicateResult.status).not.toBe(0);
    expect(duplicateResult.output).toContain('linear-mission.json#/nodes/1/id');
    expect(duplicateResult.output).toContain('duplicate id');

    const state = setupPack();
    const stateGraph = json(state.graphFile);
    (
      (stateGraph.nodes as Array<Record<string, unknown>>)[0].effects as Array<
        Record<string, unknown>
      >
    )[0] = { operator: 'increment', path: '/missing', by: 1 };
    write(state.graphFile, stateGraph);
    const stateResult = run(state.root);
    expect(stateResult.status).not.toBe(0);
    expect(stateResult.output).toContain('linear-mission.json#/nodes/0/effects/0/path');
    expect(stateResult.output).toContain('undeclared state path "/missing"');
  }, 15_000);

  it('rejects unavailable capability versions and unreachable/non-terminating graph paths', () => {
    const capability = setupPack();
    const pack = json(capability.packFile);
    (pack.engineCapabilities as Array<Record<string, unknown>>)[0].version = '2.0.0';
    write(capability.packFile, pack);
    const capabilityResult = run(capability.root);
    expect(capabilityResult.status).not.toBe(0);
    expect(capabilityResult.output).toContain('course-pack.json#/engineCapabilities/0/version');
    expect(capabilityResult.output).toContain('unavailable capability choice@2.0.0');

    const unreachable = setupPack();
    const unreachableGraph = json(unreachable.graphFile);
    const nodes = unreachableGraph.nodes as Array<Record<string, unknown>>;
    nodes.push({ ...nodes[1], id: 'orphan' });
    write(unreachable.graphFile, unreachableGraph);
    const unreachableResult = run(unreachable.root);
    expect(unreachableResult.status).not.toBe(0);
    expect(unreachableResult.output).toContain('linear-mission.json#/nodes/2/id');
    expect(unreachableResult.output).toContain('unreachable node "orphan"');

    const looping = setupPack();
    const loopFile = path.join(
      looping.root,
      'v2',
      'bridge-missions',
      'experiences',
      'loop-mission.json',
    );
    const loop = json(loopFile);
    (
      (loop.nodes as Array<Record<string, unknown>>)[0].transitions as Record<string, unknown>
    ).branches = [];
    write(loopFile, loop);
    const loopResult = run(looping.root);
    expect(loopResult.status).not.toBe(0);
    expect(loopResult.output).toContain('loop-mission.json#/nodes/0/transitions');
    expect(loopResult.output).toContain('mandatory non-terminating cycle');
  }, 20_000);

  it('rejects cyclic authored skill prerequisites with a deterministic pack pointer in strict mode', () => {
    const cycle = setupPack();
    fs.copyFileSync(path.join(source, 'cyclic-prerequisites.invalid.json'), cycle.packFile);
    const result = run(cycle.root, '--strict');
    expect(result.status).not.toBe(0);
    expect(result.output).toContain('course-pack.json#/skills/1/prerequisiteIds/0');
    expect(result.output).toContain(
      'cyclic skill prerequisites: force-balance -> vector-resolution -> force-balance',
    );
  }, 15_000);

  it('revalidates v2 graph changes in watch mode', async () => {
    const { root, graphFile } = setupPack();
    const child = spawn(process.execPath, [script, '--root', root, '--watch'], { cwd: repoRoot });
    let output = '';
    child.stdout.on('data', (chunk: Buffer) => {
      output += chunk.toString();
    });
    child.stderr.on('data', (chunk: Buffer) => {
      output += chunk.toString();
    });
    try {
      await waitFor(() => output.includes('watching'));
      const graph = json(graphFile);
      (
        (graph.nodes as Array<Record<string, unknown>>)[0].transitions as Record<string, unknown>
      ).fallback = { to: 'missing-after-watch' };
      write(graphFile, graph);
      await waitFor(() => output.includes('missing-after-watch'));
      expect(output).toContain('linear-mission.json#/nodes/0/transitions/fallback/to');
    } finally {
      child.kill();
    }
  }, 15_000);
});

async function waitFor(predicate: () => boolean): Promise<void> {
  const deadline = Date.now() + 10_000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error('timed out waiting for watch output');
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}
