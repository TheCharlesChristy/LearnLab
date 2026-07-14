// @vitest-environment node

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, describe, expect, it } from 'vitest';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const contentBuild = path.join(repoRoot, 'scripts', 'build-content.mjs');
const migrationTool = path.join(repoRoot, 'scripts', 'migrate-v2-content.mjs');
const experienceFixtures = path.join(repoRoot, 'fixtures', 'experience-v2');
const tempDirs: string[] = [];

afterAll(() => tempDirs.forEach((dir) => fs.rmSync(dir, { recursive: true, force: true })));

function temporaryRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'learnlab-d4-'));
  tempDirs.push(root);
  return root;
}

function json(file: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>;
}

function write(file: string, value: unknown) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function run(script: string, args: string[]) {
  const result = spawnSync(process.execPath, [script, ...args], {
    encoding: 'utf8',
    timeout: 60_000,
  });
  return { status: result.status, output: `${result.stdout}\n${result.stderr}` };
}

function setupV2Pack() {
  const root = temporaryRoot();
  const packDir = path.join(root, 'v2', 'bridge-missions');
  fs.mkdirSync(path.join(packDir, 'experiences'), { recursive: true });
  fs.mkdirSync(path.join(packDir, 'assets'), { recursive: true });
  fs.copyFileSync(
    path.join(experienceFixtures, 'course-pack.valid.json'),
    path.join(packDir, 'course-pack.json'),
  );
  const graphs: Record<string, string> = {
    'linear.valid.json': 'linear-mission.json',
    'branching.valid.json': 'branch-mission.json',
    'looping.valid.json': 'loop-mission.json',
    'multi-ending.valid.json': 'multi-ending-mission.json',
  };
  for (const [fixture, target] of Object.entries(graphs)) {
    fs.copyFileSync(
      path.join(experienceFixtures, fixture),
      path.join(packDir, 'experiences', target),
    );
  }
  fs.writeFileSync(path.join(packDir, 'assets', 'bridge.webp'), 'fixture');
  return {
    root,
    packDir,
    packFile: path.join(packDir, 'course-pack.json'),
    graphFile: path.join(packDir, 'experiences', 'linear-mission.json'),
  };
}

describe('v2 D4 pedagogy, asset, and migration tooling (#48)', () => {
  it('keeps a valid pack strict-clean and rejects generic feedback plus CSP-unsafe assets', () => {
    const valid = setupV2Pack();
    expect(run(contentBuild, ['--root', valid.root, '--strict']).status).toBe(0);

    const generic = setupV2Pack();
    const graph = json(generic.graphFile);
    (
      (graph.nodes as Array<Record<string, unknown>>)[0]!.feedback as Record<string, unknown>
    ).success = 'Correct!';
    write(generic.graphFile, graph);
    const genericResult = run(contentBuild, ['--root', generic.root, '--strict']);
    expect(genericResult.status).not.toBe(0);
    expect(genericResult.output).toContain('generic praise is not sufficient');

    const unsafe = setupV2Pack();
    const pack = json(unsafe.packFile);
    const asset = (pack.assets as Array<Record<string, unknown>>)[0]!;
    asset.path = 'assets/bridge.svg';
    asset.mediaType = 'image/svg+xml';
    fs.writeFileSync(
      path.join(unsafe.packDir, 'assets', 'bridge.svg'),
      '<svg><script>alert(1)</script></svg>',
    );
    write(unsafe.packFile, pack);
    const unsafeResult = run(contentBuild, ['--root', unsafe.root, '--strict']);
    expect(unsafeResult.status).not.toBe(0);
    expect(unsafeResult.output).toContain('SVG contains script');
  }, 30_000);

  it('enforces format mix only for substantive episodes', () => {
    const { root, graphFile } = setupV2Pack();
    const graph = json(graphFile);
    const [scene, ending] = graph.nodes as Array<Record<string, unknown>>;
    const scenes = [0, 1, 2, 3].map((index) => ({
      ...scene,
      id: `choice-${index}`,
      transitions: {
        branches: [],
        fallback: { to: index === 3 ? ending!.id : `choice-${index + 1}` },
      },
    }));
    graph.entryNodeId = 'choice-0';
    graph.nodes = [...scenes, ending];
    write(graphFile, graph);
    const result = run(contentBuild, ['--root', root, '--strict']);
    expect(result.status).not.toBe(0);
    expect(result.output).toContain('at least half generation');
  }, 20_000);

  it('creates a deterministic review-only migration plan and can CI-check it', () => {
    const root = temporaryRoot();
    const courseDir = path.join(root, 'maths', 'legacy-course');
    const moduleDir = path.join(courseDir, 'legacy-module');
    fs.mkdirSync(moduleDir, { recursive: true });
    write(path.join(courseDir, 'course.json'), {
      id: 'legacy-course',
      modules: [{ id: 'legacy-module', dir: 'legacy-module' }],
    });
    write(path.join(moduleDir, 'module.json'), {
      id: 'legacy-module',
      title: 'Legacy module',
      lessons: [
        { id: 'screens', file: '01.screens.json' },
        { id: 'notes', file: '02.md' },
      ],
    });
    fs.writeFileSync(path.join(moduleDir, '01.screens.json'), '{}');
    fs.writeFileSync(path.join(moduleDir, '02.md'), '# Notes');
    const planFile = path.join(root, 'migration-plan.json');

    const writeResult = run(migrationTool, [
      '--root',
      root,
      '--course',
      'maths/legacy-course',
      '--pack',
      'legacy-v2',
      '--out',
      planFile,
      '--write',
    ]);
    expect(writeResult.status, writeResult.output).toBe(0);
    const plan = json(planFile);
    expect(plan).toMatchObject({
      kind: 'learnlab-v2-migration-plan',
      target: { packId: 'legacy-v2' },
    });
    expect(JSON.stringify(plan)).toContain('adapt-screen-sequence');
    expect(JSON.stringify(plan)).toContain('preserve-markdown');
    expect((plan.manualReview as unknown[]).length).toBeGreaterThan(0);
    expect(
      run(migrationTool, [
        '--root',
        root,
        '--course',
        'maths/legacy-course',
        '--pack',
        'legacy-v2',
        '--out',
        planFile,
        '--check',
      ]).status,
    ).toBe(0);
  });
});
