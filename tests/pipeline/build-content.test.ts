// @vitest-environment node
// Content pipeline tests — SRS §4.7, §8.6 (--strict), AC-01, AC-05.
// Each test runs scripts/build-content.mjs as a child process against a
// fixture content root and asserts on exit code + human-readable output
// (file path + JSON pointer for JSON issues, file:line for Markdown issues).

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, describe, expect, it } from 'vitest';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const script = path.join(repoRoot, 'scripts', 'build-content.mjs');
const fixtures = path.join(repoRoot, 'tests', 'fixtures', 'content');

const tempDirs: string[] = [];
afterAll(() => {
  for (const dir of tempDirs) fs.rmSync(dir, { recursive: true, force: true });
});

function tempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'learnlab-pipeline-'));
  tempDirs.push(dir);
  return dir;
}

function runBuild(root: string, ...extraArgs: string[]) {
  const result = spawnSync(process.execPath, [script, '--root', root, ...extraArgs], {
    encoding: 'utf8',
    timeout: 60_000,
  });
  return { status: result.status, output: `${result.stdout}\n${result.stderr}` };
}

const TIMEOUT = 30_000;

describe('build-content.mjs — §4.7 pipeline', () => {
  it(
    'exits 0 on an empty/missing root and emits a schema-valid empty index.json',
    () => {
      const root = path.join(tempDir(), 'does-not-exist-yet');
      const { status, output } = runBuild(root);
      expect(status, output).toBe(0);
      const index = JSON.parse(fs.readFileSync(path.join(root, 'index.json'), 'utf8'));
      expect(index.schemaVersion).toBe(1);
      expect(typeof index.generatedAt).toBe('string');
      expect(Number.isNaN(Date.parse(index.generatedAt))).toBe(false);
      expect(index.subjects).toEqual([]);
    },
    TIMEOUT,
  );

  it(
    'passes the valid fixture course under --strict (§8.6 MVC)',
    () => {
      const { status, output } = runBuild(path.join(fixtures, 'valid'), '--strict');
      expect(status, output).toBe(0);
    },
    TIMEOUT,
  );

  it(
    'AC-01: a fixture module under a temp content root appears in the generated index.json',
    () => {
      const root = tempDir();
      fs.cpSync(path.join(fixtures, 'valid'), root, { recursive: true });
      const { status, output } = runBuild(root);
      expect(status, output).toBe(0);

      const index = JSON.parse(fs.readFileSync(path.join(root, 'index.json'), 'utf8'));
      expect(index.subjects).toHaveLength(1);
      const subject = index.subjects[0];
      expect(subject.id).toBe('maths');
      expect(subject.title).toBe('Mathematics');
      const course = subject.courses[0];
      expect(course).toMatchObject({
        id: 'test-course',
        path: 'maths/test-course',
        title: 'Pipeline Test Course',
        level: 'alevel',
        moduleCount: 1,
        totalEstMinutes: 60,
      });
    },
    TIMEOUT,
  );

  it(
    'regenerates schemas/widget-keys.json from src/widgets/keys.json on every run',
    () => {
      const srcKeys = JSON.parse(
        fs.readFileSync(path.join(repoRoot, 'src', 'widgets', 'keys.json'), 'utf8'),
      );
      const dumped = JSON.parse(
        fs.readFileSync(path.join(repoRoot, 'schemas', 'widget-keys.json'), 'utf8'),
      );
      expect(dumped).toEqual(srcKeys);
    },
    TIMEOUT,
  );
});

describe('build-content.mjs — AC-05 failure modes (file + pointer/line in message)', () => {
  it(
    'fails on a dangling prerequisites id, naming module.json + JSON pointer',
    () => {
      const { status, output } = runBuild(path.join(fixtures, 'dangling-prereq'));
      expect(status, output).not.toBe(0);
      expect(output).toContain('module.json#/prerequisites/0');
      expect(output).toContain('no-such-module');
    },
    TIMEOUT,
  );

  it(
    'fails on a missing lesson file, naming module.json + JSON pointer',
    () => {
      const { status, output } = runBuild(path.join(fixtures, 'missing-lesson'));
      expect(status, output).not.toBe(0);
      expect(output).toContain('module.json#/lessons/0/file');
      expect(output).toContain('01-only.md');
      expect(output).toContain('does not exist');
    },
    TIMEOUT,
  );

  it(
    'fails on an unknown widget type, naming the .md file + line',
    () => {
      const { status, output } = runBuild(path.join(fixtures, 'unknown-widget'));
      expect(status, output).not.toBe(0);
      expect(output).toContain('01-only.md:5');
      expect(output).toContain('unknown widget type "does-not-exist"');
    },
    TIMEOUT,
  );

  it(
    'fails on nested directive containers, naming the .md file + line',
    () => {
      const { status, output } = runBuild(path.join(fixtures, 'nested-containers'));
      expect(status, output).not.toBe(0);
      expect(output).toContain('01-only.md:6');
      expect(output).toContain('containers must not nest containers');
    },
    TIMEOUT,
  );
});

describe('build-content.mjs — schema rejections (§4.1, §4.6)', () => {
  it(
    'rejects a module id that violates the kebab-case id regex',
    () => {
      const { status, output } = runBuild(path.join(fixtures, 'bad-id'));
      expect(status, output).not.toBe(0);
      expect(output).toContain('module.json#/id');
      expect(output).toContain('pattern');
    },
    TIMEOUT,
  );

  it(
    'rejects an invented question type (closed mcq/multi/numeric/text union)',
    () => {
      const { status, output } = runBuild(path.join(fixtures, 'bad-question-type'));
      expect(status, output).not.toBe(0);
      expect(output).toContain('assessment.json#/questions/0');
      expect(output).toMatch(/tag "type"|oneOf/);
    },
    TIMEOUT,
  );
});

describe('build-content.mjs — --strict MVC gate (§8.6)', () => {
  it(
    'accepts the strict-fail fixture without --strict',
    () => {
      const { status, output } = runBuild(path.join(fixtures, 'strict-fail'));
      expect(status, output).toBe(0);
    },
    TIMEOUT,
  );

  it(
    'fails the strict-fail fixture with --strict, citing each violated ◆ rule',
    () => {
      const { status, output } = runBuild(path.join(fixtures, 'strict-fail'), '--strict');
      expect(status, output).not.toBe(0);
      expect(output).toContain('≥ 3 required'); // < 3 lessons
      expect(output).toContain('no interactive item'); // no widget/py
      expect(output).toContain('≥ 8 required'); // < 8 questions
      expect(output).toContain('≥ 2 required'); // 1 question type
    },
    TIMEOUT,
  );
});
