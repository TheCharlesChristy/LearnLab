// @vitest-environment node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, describe, expect, it } from 'vitest';

import { createV1Inventory } from '../../scripts/inventory-v1-content.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const script = path.join(repoRoot, 'scripts', 'inventory-v1-content.mjs');
const tempDirs: string[] = [];
const root = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'learnlab-inventory-'));
  tempDirs.push(dir);
  return dir;
};
afterAll(() => tempDirs.forEach((dir) => fs.rmSync(dir, { recursive: true, force: true })));

function write(file: string, value: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof value === 'string' ? value : `${JSON.stringify(value)}\n`);
}

describe('v1 migration inventory (#63)', () => {
  it('reconciles manifests/files, classifies dual formats and activities, and gives an explicit read-only resolution', () => {
    const dir = root();
    write(path.join(dir, 'maths', 'course', 'course.json'), {
      id: 'course',
      modules: [{ id: 'module', dir: 'module' }],
    });
    write(path.join(dir, 'maths', 'course', 'module', 'module.json'), {
      id: 'module',
      title: 'Module',
      estMinutes: 20,
      prerequisites: ['prior'],
      objectives: ['Apply evidence'],
      lessons: [
        { id: 'notes', title: 'Notes', file: '01.md' },
        { id: 'sequence', title: 'Sequence', file: '02.screens.json', kind: 'screens' },
      ],
    });
    write(
      path.join(dir, 'maths', 'course', 'module', '01.md'),
      '::widget{type="figure"}\n::py{src="items/demo.py"}',
    );
    write(path.join(dir, 'maths', 'course', 'module', '02.screens.json'), {
      screens: [{ type: 'tap-choice', prompt: 'Predict.' }],
    });
    write(path.join(dir, 'maths', 'course', 'module', 'orphan.md'), '# orphan');
    const inventory = createV1Inventory(dir);
    const module = inventory.modules[0]!;
    expect(module.formats).toEqual(['markdown', 'v1-screens']);
    expect(module.lessons[0]!.activities).toContain('widget');
    expect(module.lessons[0]!.python).toBe(true);
    expect(module.orphans).toContain('maths/course/module/orphan.md');
    expect(inventory.dualFormats[0]?.resolution).toMatch(/do not merge/i);
    expect(inventory.proposedFirstLegacyOnlyPath?.firstStep).toMatch(
      /not a migration|review-only/i,
    );
  });

  it('writes deterministically and supports CI --check', () => {
    const dir = root();
    write(path.join(dir, 'physics', 'course', 'course.json'), {
      id: 'course',
      modules: [{ id: 'module', dir: 'module' }],
    });
    write(path.join(dir, 'physics', 'course', 'module', 'module.json'), {
      id: 'module',
      title: 'Module',
      lessons: [{ id: 'one', title: 'One', file: '01.md' }],
    });
    write(path.join(dir, 'physics', 'course', 'module', '01.md'), '# One');
    const out = path.join(dir, 'inventory.md');
    const run = (args: string[]) =>
      spawnSync(process.execPath, [script, '--root', dir, '--out', out, ...args], {
        encoding: 'utf8',
      });
    expect(run(['--write']).status).toBe(0);
    expect(run(['--check']).status).toBe(0);
    fs.appendFileSync(out, 'stale');
    expect(run(['--check']).status).toBe(1);
  });
});
