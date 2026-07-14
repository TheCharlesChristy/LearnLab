// @vitest-environment node
// Scaffolder tests — SRS §7.1 (FR-AUTH-001, FR-AUTH-002).
// new-module.mjs output must pass build-content.mjs immediately.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, describe, expect, it } from 'vitest';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const scripts = path.join(repoRoot, 'scripts');

const tempDirs: string[] = [];
afterAll(() => {
  for (const dir of tempDirs) fs.rmSync(dir, { recursive: true, force: true });
});

function tempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'learnlab-scaffold-'));
  tempDirs.push(dir);
  return dir;
}

function run(script: string, args: string[]) {
  const result = spawnSync(process.execPath, [path.join(scripts, script), ...args], {
    encoding: 'utf8',
    timeout: 60_000,
  });
  return { status: result.status, output: `${result.stdout}\n${result.stderr}` };
}

const TIMEOUT = 30_000;

describe('new-module.mjs (FR-AUTH-001)', () => {
  it(
    'scaffolds a new course + module whose output passes build-content.mjs immediately',
    () => {
      const root = tempDir();
      const scaffold = run('new-module.mjs', [
        '--root', root,
        '--subject', 'cs',
        '--course', 'alevel-cs',
        '--course-title', 'A-level Computer Science',
        '--level', 'alevel',
        '--id', 'data-structures',
        '--title', 'Data Structures',
        '--description', 'Arrays, lists, stacks, queues, trees and hash tables.',
        '--minutes', '90',
      ]);
      expect(scaffold.status, scaffold.output).toBe(0);

      const moduleDir = path.join(root, 'cs', 'alevel-cs', 'data-structures');
      expect(fs.existsSync(path.join(moduleDir, 'module.json'))).toBe(true);
      expect(fs.existsSync(path.join(moduleDir, '01-introduction.screens.json'))).toBe(true);
      expect(fs.existsSync(path.join(moduleDir, 'assessment.json'))).toBe(true);

      // The starter lesson is a real, schema-valid screen sequence
      // (docs/BRILLIANT_REWRITE_PLAN.md): one placeholder predict screen,
      // one placeholder tap-choice screen.
      const lesson = JSON.parse(
        fs.readFileSync(path.join(moduleDir, '01-introduction.screens.json'), 'utf8'),
      );
      expect(lesson.screens.map((s: { type: string }) => s.type)).toEqual([
        'predict',
        'tap-choice',
      ]);

      const moduleJson = JSON.parse(fs.readFileSync(path.join(moduleDir, 'module.json'), 'utf8'));
      expect(moduleJson.lessons[0]).toMatchObject({
        file: '01-introduction.screens.json',
        kind: 'screens',
      });

      // Placeholder assessment: one mcq + one numeric, each with explanation.
      const assessment = JSON.parse(
        fs.readFileSync(path.join(moduleDir, 'assessment.json'), 'utf8'),
      );
      expect(assessment.questions.map((q: { type: string }) => q.type).sort()).toEqual([
        'mcq',
        'numeric',
      ]);
      for (const q of assessment.questions) expect(q.explanation).toBeTruthy();

      // FR-AUTH-001: output passes the validation pipeline immediately.
      const build = run('build-content.mjs', ['--root', root]);
      expect(build.status, build.output).toBe(0);

      const index = JSON.parse(fs.readFileSync(path.join(root, 'index.json'), 'utf8'));
      expect(index.subjects[0]).toMatchObject({ id: 'cs', title: 'Computer Science' });
      expect(index.subjects[0].courses[0]).toMatchObject({
        id: 'alevel-cs',
        path: 'cs/alevel-cs',
        moduleCount: 1,
        totalEstMinutes: 90,
      });
    },
    TIMEOUT,
  );

  it(
    'appends a ModuleRef to an existing course.json and validates prerequisites',
    () => {
      const root = tempDir();
      const first = run('new-module.mjs', [
        '--root', root,
        '--subject', 'maths',
        '--course', 'alevel-pure',
        '--id', 'proof',
        '--title', 'Proof',
        '--description', 'Mathematical proof.',
        '--minutes', '45',
      ]);
      expect(first.status, first.output).toBe(0);

      const second = run('new-module.mjs', [
        '--root', root,
        '--subject', 'maths',
        '--course', 'alevel-pure',
        '--id', 'algebraic-methods',
        '--title', 'Algebraic Methods',
        '--description', 'Algebraic manipulation and proof techniques.',
        '--minutes', '60',
        '--prereqs', 'proof',
      ]);
      expect(second.status, second.output).toBe(0);

      const course = JSON.parse(
        fs.readFileSync(path.join(root, 'maths', 'alevel-pure', 'course.json'), 'utf8'),
      );
      expect(course.modules).toEqual([
        { id: 'proof', dir: 'proof' },
        { id: 'algebraic-methods', dir: 'algebraic-methods' },
      ]);

      const build = run('build-content.mjs', ['--root', root]);
      expect(build.status, build.output).toBe(0);
    },
    TIMEOUT,
  );

  it(
    'rejects an invalid module id (§4.1 regex)',
    () => {
      const { status, output } = run('new-module.mjs', [
        '--root', tempDir(),
        '--subject', 'maths',
        '--course', 'alevel-pure',
        '--id', 'Bad_Id',
        '--title', 'x',
        '--description', 'x',
        '--minutes', '10',
      ]);
      expect(status, output).not.toBe(0);
      expect(output).toContain('kebab-case');
    },
    TIMEOUT,
  );
});

describe('new-course.mjs and new-experience.mjs (Experience Runtime v2 D1 / #45)', () => {
  it(
    'scaffolds a discoverable, strict-valid v2 course pack with its skill, review, assets, and fixture starter',
    () => {
      const root = tempDir();
      const scaffold = run('new-course.mjs', [
        '--root', root,
        '--id', 'bridge-missions',
        '--title', 'Bridge missions',
        '--description', 'Use force balance to diagnose and repair a bridge.',
        '--subject', 'physics',
        '--level', 'gcse',
        '--minutes', '20',
      ]);
      expect(scaffold.status, scaffold.output).toBe(0);

      const packDir = path.join(root, 'v2', 'bridge-missions');
      const packFile = path.join(packDir, 'course-pack.json');
      const graphFile = path.join(packDir, 'experiences', 'first-experience.json');
      expect(fs.existsSync(packFile)).toBe(true);
      expect(fs.existsSync(graphFile)).toBe(true);
      expect(fs.existsSync(path.join(packDir, 'assets', '.gitkeep'))).toBe(true);
      expect(fs.existsSync(path.join(packDir, 'fixtures', 'first-experience.fixture.json'))).toBe(true);

      const pack = JSON.parse(fs.readFileSync(packFile, 'utf8'));
      expect(pack).toMatchObject({
        schemaVersion: 2,
        id: 'bridge-missions',
        skills: [{ id: 'bridge-missions-starter-skill' }],
        reviewItems: [{ id: 'bridge-missions-starter-review' }],
      });
      const build = run('build-content.mjs', ['--root', root, '--strict']);
      expect(build.status, build.output).toBe(0);
      const index = JSON.parse(fs.readFileSync(path.join(root, 'experience-index.json'), 'utf8'));
      expect(index.packs).toMatchObject([{ id: 'bridge-missions', experiences: [{ id: 'first-experience' }] }]);
    },
    TIMEOUT,
  );

  it(
    'adds a strict-valid experience and synchronises its manifest, campaign, fixture, and estimate',
    () => {
      const root = tempDir();
      const first = run('new-course.mjs', [
        '--root', root,
        '--id', 'bridge-missions',
        '--title', 'Bridge missions',
        '--subject', 'physics',
        '--minutes', '20',
      ]);
      expect(first.status, first.output).toBe(0);
      const second = run('new-experience.mjs', [
        '--root', root,
        '--pack', 'bridge-missions',
        '--id', 'inspect-support',
        '--title', 'Inspect the support',
        '--minutes', '5',
      ]);
      expect(second.status, second.output).toBe(0);

      const packDir = path.join(root, 'v2', 'bridge-missions');
      const pack = JSON.parse(fs.readFileSync(path.join(packDir, 'course-pack.json'), 'utf8'));
      expect(pack.experiences).toContainEqual({
        id: 'inspect-support', file: 'experiences/inspect-support.json', title: 'Inspect the support', estimatedMinutes: 5,
      });
      expect(pack.campaigns[0].experienceIds).toContain('inspect-support');
      expect(pack.estimatedMinutes).toBe(25);
      expect(fs.existsSync(path.join(packDir, 'fixtures', 'inspect-support.fixture.json'))).toBe(true);

      const build = run('build-content.mjs', ['--root', root, '--strict']);
      expect(build.status, build.output).toBe(0);
    },
    TIMEOUT,
  );

  it('rejects duplicate experience ids before it changes a pack', () => {
    const root = tempDir();
    const first = run('new-course.mjs', ['--root', root, '--id', 'bridge-missions', '--subject', 'physics']);
    expect(first.status, first.output).toBe(0);
    const duplicate = run('new-experience.mjs', [
      '--root', root, '--pack', 'bridge-missions', '--id', 'first-experience',
    ]);
    expect(duplicate.status, duplicate.output).not.toBe(0);
    expect(duplicate.output).toContain('already declares experience id');
  }, TIMEOUT);

  it('keeps derived ids schema-valid when the course-pack id is at the 64-character limit', () => {
    const root = tempDir();
    const packId = 'a'.repeat(64);
    const scaffold = run('new-course.mjs', ['--root', root, '--id', packId, '--subject', 'physics']);
    expect(scaffold.status, scaffold.output).toBe(0);
    const pack = JSON.parse(fs.readFileSync(path.join(root, 'v2', packId, 'course-pack.json'), 'utf8'));
    expect(pack.campaigns[0].id).toHaveLength(64);
    expect(pack.skills[0].id).toHaveLength(64);
    expect(pack.reviewItems[0].id).toHaveLength(64);
    const build = run('build-content.mjs', ['--root', root, '--strict']);
    expect(build.status, build.output).toBe(0);
  }, TIMEOUT);
});

describe('new-item.mjs (FR-AUTH-002)', () => {
  it(
    'scaffolds items/<name>.py from the blank template with the saved_state guard',
    () => {
      const moduleDir = tempDir();
      const { status, output } = run('new-item.mjs', [
        '--kind', 'blank',
        '--name', 'my-item',
        '--dir', moduleDir,
      ]);
      expect(status, output).toBe(0);
      const source = fs.readFileSync(path.join(moduleDir, 'items', 'my-item.py'), 'utf8');
      expect(source).toContain('class Item(sdk.LearningItem)');
      expect(source).toContain('self.saved_state');
      expect(source).toContain('{"_v": 1');
    },
    TIMEOUT,
  );

  it(
    'scaffolds the quiz/simulation/plot templates (shipped in P1, §6.13)',
    () => {
      for (const kind of ['quiz', 'simulation', 'plot']) {
        const dir = tempDir();
        const { status, output } = run('new-item.mjs', [
          '--kind', kind,
          '--name', kind,
          '--dir', dir,
        ]);
        expect(status, output).toBe(0);
        const created = fs.readFileSync(path.join(dir, 'items', `${kind}.py`), 'utf8');
        expect(created).toContain('class Item');
      }
    },
    TIMEOUT,
  );

  it(
    'errors helpfully for an unknown --kind',
    () => {
      const { status, output } = run('new-item.mjs', [
        '--kind', 'frobnicate',
        '--name', 'x',
        '--dir', tempDir(),
      ]);
      expect(status, output).not.toBe(0);
    },
    TIMEOUT,
  );
});
