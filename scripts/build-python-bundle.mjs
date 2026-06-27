#!/usr/bin/env node
/* global process, console, setTimeout, clearTimeout */
// Builds public/python-bundle.zip from python/{learnsdk,courselib} (SRS §3.3,
// §6.2.2). The archive's top-level entries are the packages themselves
// (`learnsdk/__init__.py`, `courselib/__init__.py`, …) — NOT nested under
// python/ — because the worker unpacks it with
//   pyodide.unpackArchive(buf, 'zip', { extractDir: '/lib/learnlab' })
// and appends /lib/learnlab to sys.path, so `import learnsdk` / `import
// courselib` must resolve from the archive root (§6.2.2, §6.6 boot path).
//
// C-2: source-only bundle (no wheels) — the Pyodide runtime is CDN-loaded.
// Output is deterministic/reproducible: entries are sorted and every entry's
// mtime is pinned to a fixed timestamp, so identical inputs yield
// byte-identical archives. (zip stores DOS time, which only spans 1980-2099,
// so the epoch can't be 0 — we use the start of 1980, the format's minimum.)
//
// Usage: node scripts/build-python-bundle.mjs [--watch]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { zipSync } from 'fflate';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pythonDir = path.join(repoRoot, 'python');
const outFile = path.join(repoRoot, 'public', 'python-bundle.zip');

// Packages to bundle (each becomes a top-level dir in the archive).
const PACKAGES = ['learnsdk', 'courselib'];

// Path segments that must never reach the archive (build/test detritus).
const EXCLUDED_DIRS = new Set(['__pycache__', '.pytest_cache', '.ruff_cache', 'tests']);

// Fixed mtime for reproducibility. The zip DOS-time format only encodes
// 1980-2099, so we pin every entry to 1980-01-01T00:00:00Z (the minimum).
const FIXED_MTIME = Date.UTC(1980, 0, 1);

const watchMode = process.argv.includes('--watch');

// Collect every shippable file under python/<pkg>/**, keyed by its archive
// path (rooted at the package name). Returns a sorted array of [archivePath,
// absPath] for deterministic ordering.
function collectFiles() {
  const entries = [];
  for (const pkg of PACKAGES) {
    const pkgDir = path.join(pythonDir, pkg);
    if (!fs.existsSync(pkgDir)) continue;
    walk(pkgDir, pkg, entries);
  }
  entries.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  return entries;
}

function walk(absDir, archiveDir, entries) {
  for (const dirent of fs.readdirSync(absDir, { withFileTypes: true })) {
    const name = dirent.name;
    const abs = path.join(absDir, name);
    // Archive paths always use forward slashes (zip convention).
    const archivePath = `${archiveDir}/${name}`;
    if (dirent.isDirectory()) {
      if (EXCLUDED_DIRS.has(name)) continue;
      walk(abs, archivePath, entries);
    } else if (dirent.isFile()) {
      if (name.endsWith('.pyc')) continue;
      entries.push([archivePath, abs]);
    }
  }
}

function buildOnce() {
  const sdkDir = path.join(pythonDir, 'learnsdk');
  if (!fs.existsSync(sdkDir)) {
    console.log(
      'build-python-bundle: python/learnsdk not present yet — nothing to bundle.',
    );
    return true;
  }

  const files = collectFiles();
  if (files.length === 0) {
    console.log('build-python-bundle: no source files found under python/ — nothing to bundle.');
    return true;
  }

  // Build the in-memory file map for fflate. mtime pinned for reproducibility;
  // level 9 keeps the artifact small (it is tiny anyway).
  const zipInput = {};
  for (const [archivePath, abs] of files) {
    zipInput[archivePath] = [fs.readFileSync(abs), { level: 9, mtime: FIXED_MTIME }];
  }

  const buf = zipSync(zipInput, { mtime: FIXED_MTIME });

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, buf);

  console.log(
    `build-python-bundle: wrote ${path.relative(repoRoot, outFile)} ` +
      `(${files.length} files, ${buf.length} bytes)`,
  );
  return true;
}

// ---------------------------------------------------------------------------

let ok = true;
try {
  ok = buildOnce();
} catch (err) {
  console.error(`build-python-bundle: ${err.message}`);
  ok = false;
  // In watch mode the first build failing must not kill the process.
  if (!watchMode) process.exit(1);
}

if (watchMode) {
  // Dependency-free fs.watch + debounce, mirroring build-content's watch.
  let timer;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      console.log('\nbuild-python-bundle: change detected, rebundling…');
      try {
        buildOnce();
      } catch (err) {
        console.error(`build-python-bundle: ${err.message}`);
      }
    }, 250);
  };
  for (const pkg of PACKAGES) {
    const pkgDir = path.join(pythonDir, pkg);
    if (fs.existsSync(pkgDir)) {
      fs.watch(pkgDir, { recursive: true }, schedule);
    }
  }
  console.log('build-python-bundle: watching python/{learnsdk,courselib} (Ctrl-C to stop)');
} else {
  process.exit(ok ? 0 : 1);
}
