// @vitest-environment node
// build-python-bundle.mjs tests — SRS §3.3, §6.2.2, C-2.
// Runs the script as a child process, then unzips the artifact with fflate and
// asserts: packages are rooted correctly (learnsdk/…, courselib/…, no python/
// prefix), no __pycache__/.pyc, and the output is byte-identical across runs
// (deterministic/reproducible — sorted entries + pinned mtime).

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { unzipSync } from 'fflate';
import { beforeAll, describe, expect, it } from 'vitest';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const script = path.join(repoRoot, 'scripts', 'build-python-bundle.mjs');
const outFile = path.join(repoRoot, 'public', 'python-bundle.zip');

const TIMEOUT = 30_000;

function runBuild() {
  return spawnSync(process.execPath, [script], { encoding: 'utf8', timeout: 60_000 });
}

let firstBytes: Buffer;

beforeAll(() => {
  const result = runBuild();
  expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  expect(fs.existsSync(outFile)).toBe(true);
  firstBytes = fs.readFileSync(outFile);
}, TIMEOUT);

describe('build-python-bundle.mjs', () => {
  it('writes a non-empty public/python-bundle.zip', () => {
    expect(firstBytes.length).toBeGreaterThan(0);
  });

  it('roots packages at learnsdk/ and courselib/ (no python/ prefix)', () => {
    const unzipped = unzipSync(new Uint8Array(firstBytes));
    const names = Object.keys(unzipped);

    expect(names).toContain('learnsdk/__init__.py');
    expect(names).toContain('courselib/__init__.py');

    for (const name of names) {
      expect(name.startsWith('python/'), `unexpected python/ prefix: ${name}`).toBe(false);
      expect(name).toMatch(/^(learnsdk|courselib)\//);
    }
  });

  it('excludes __pycache__, *.pyc, and cache/test dirs', () => {
    const names = Object.keys(unzipSync(new Uint8Array(firstBytes)));
    for (const name of names) {
      expect(name).not.toContain('__pycache__');
      expect(name).not.toMatch(/\.pyc$/);
      expect(name).not.toContain('.pytest_cache');
      expect(name).not.toContain('.ruff_cache');
    }
  });

  it('preserves file contents (learnsdk/__init__.py round-trips)', () => {
    const unzipped = unzipSync(new Uint8Array(firstBytes));
    const fromZip = Buffer.from(unzipped['learnsdk/__init__.py']).toString('utf8');
    const fromDisk = fs.readFileSync(
      path.join(repoRoot, 'python', 'learnsdk', '__init__.py'),
      'utf8',
    );
    expect(fromZip).toBe(fromDisk);
  });

  it(
    'is deterministic — re-running produces byte-identical output',
    () => {
      const result = runBuild();
      expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
      const secondBytes = fs.readFileSync(outFile);
      expect(Buffer.compare(firstBytes, secondBytes)).toBe(0);
    },
    TIMEOUT,
  );
});
