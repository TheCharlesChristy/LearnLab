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
      expect(fs.existsSync(path.join(moduleDir, '01-introduction.md'))).toBe(true);
      expect(fs.existsSync(path.join(moduleDir, 'assessment.json'))).toBe(true);

      // The starter lesson documents all four §4.5 directive forms.
      const lesson = fs.readFileSync(path.join(moduleDir, '01-introduction.md'), 'utf8');
      for (const form of ['::widget{', '::py{', ':::callout{', ':::reveal{']) {
        expect(lesson).toContain(form);
      }

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
    'errors helpfully for kinds whose template ships in P1',
    () => {
      const { status, output } = run('new-item.mjs', [
        '--kind', 'simulation',
        '--name', 'sim',
        '--dir', tempDir(),
      ]);
      expect(status, output).not.toBe(0);
      expect(output).toContain('P1');
      expect(output).toContain('blank');
    },
    TIMEOUT,
  );
});
