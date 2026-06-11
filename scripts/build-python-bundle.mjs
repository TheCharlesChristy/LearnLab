#!/usr/bin/env node
/* global process, console, setTimeout, clearTimeout, setInterval, clearInterval */
// Builds public/python-bundle.zip from python/{learnsdk,courselib} (SRS §3.3,
// §6.2.2). P0 placeholder: python/learnsdk does not exist yet, so this prints
// a note and exits 0. The CLI (incl. --watch, used by `npm run dev`) is
// stable; P1 replaces the internals.
//
// Usage: node scripts/build-python-bundle.mjs [--watch]

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pythonDir = path.join(repoRoot, 'python');
const sdkDir = path.join(pythonDir, 'learnsdk');
const outFile = path.join(repoRoot, 'public', 'python-bundle.zip');

const watchMode = process.argv.includes('--watch');

function buildOnce() {
  if (!fs.existsSync(sdkDir)) {
    console.log('build-python-bundle: python/learnsdk not present yet (P0) — nothing to bundle.');
    return true;
  }
  // Zip python/learnsdk (+ python/courselib when present) so that unpacking
  // the archive yields top-level `learnsdk/` and `courselib/` packages
  // (§6.2.2 extracts to /lib/learnlab and appends it to sys.path).
  const packages = ['learnsdk', 'courselib'].filter((p) =>
    fs.existsSync(path.join(pythonDir, p)),
  );
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const py = [
    'import sys, zipfile, pathlib',
    'out, root, *pkgs = sys.argv[1:]',
    "zf = zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED)",
    'for pkg in pkgs:',
    "    for f in sorted(pathlib.Path(root, pkg).rglob('*')):",
    "        if f.is_file() and '__pycache__' not in f.parts:",
    '            zf.write(f, f.relative_to(root))',
    'zf.close()',
  ].join('\n');
  const result = spawnSync('python3', ['-c', py, outFile, pythonDir, ...packages], {
    encoding: 'utf8',
  });
  if (result.error || result.status !== 0) {
    console.error(
      `build-python-bundle: failed to write ${path.relative(repoRoot, outFile)}:\n${result.stderr ?? result.error?.message ?? ''}`,
    );
    return false;
  }
  console.log(
    `build-python-bundle: wrote ${path.relative(repoRoot, outFile)} (${packages.join(', ')})`,
  );
  return true;
}

const ok = buildOnce();

if (watchMode) {
  if (fs.existsSync(pythonDir)) {
    let timer;
    fs.watch(pythonDir, { recursive: true }, () => {
      clearTimeout(timer);
      timer = setTimeout(buildOnce, 250);
    });
    console.log('build-python-bundle: watching python/ (Ctrl-C to stop)');
  } else {
    // Keep the process alive so `concurrently` in `npm run dev` is happy;
    // start bundling automatically once python/ appears (P1).
    console.log('build-python-bundle: watch mode idle — waiting for python/ to appear.');
    const poll = setInterval(() => {
      if (fs.existsSync(sdkDir)) {
        clearInterval(poll);
        buildOnce();
        fs.watch(pythonDir, { recursive: true }, () => buildOnce());
      }
    }, 5000);
  }
} else {
  process.exit(ok ? 0 : 1);
}
