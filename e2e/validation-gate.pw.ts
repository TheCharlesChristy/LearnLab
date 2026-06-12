// AC-05 — the content validation gate. Already proven at unit level in
// tests/pipeline/build-content.test.ts; this thin spec re-runs the four
// AC-05 failure modes through the real CLI so the acceptance criterion is
// also tagged as covered in the e2e report. Each bad fixture root must make
// `build-content` exit non-zero with a message naming file + JSON pointer
// (or file + line for Markdown errors).

import { spawnSync } from 'node:child_process';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { repoRoot } from './helpers';

const script = path.join(repoRoot, 'scripts', 'build-content.mjs');
const fixtures = path.join(repoRoot, 'tests', 'fixtures', 'content');

const CASES: { root: string; what: string; expects: string[] }[] = [
  {
    root: 'dangling-prereq',
    what: 'dangling prerequisites id → module.json + JSON pointer',
    expects: ['module.json#/prerequisites/0', 'dangling prerequisite'],
  },
  {
    root: 'missing-lesson',
    what: 'missing lesson file → module.json + JSON pointer',
    expects: ['module.json#/lessons/0/file', 'does not exist'],
  },
  {
    root: 'unknown-widget',
    what: 'unknown widget type → .md file + line',
    expects: ['01-only.md:5', 'unknown widget type'],
  },
  {
    root: 'nested-containers',
    what: 'nested container directives → .md file + line',
    expects: ['01-only.md:6', 'containers must not nest containers'],
  },
];

test.describe('AC-05 validation gate (build-content fails with file + pointer/line)', () => {
  for (const { root, what, expects } of CASES) {
    test(`AC-05: ${what}`, () => {
      const result = spawnSync(
        process.execPath,
        [script, '--root', path.join(fixtures, root)],
        { cwd: repoRoot, encoding: 'utf8', timeout: 60_000 },
      );
      const output = `${result.stdout}\n${result.stderr}`;
      expect(result.status, output).not.toBe(0);
      for (const fragment of expects) {
        expect(output).toContain(fragment);
      }
    });
  }
});
