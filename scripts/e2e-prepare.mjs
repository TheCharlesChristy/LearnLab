#!/usr/bin/env node
/* global process, console */
// E2E build step (SRS §11 E2E row; AC-01 app half).
//
// public/content ships no real course content (decision: courses/widgets
// removed) — the Playwright suite runs entirely against the fixture course
// tree (tests/fixtures/content/valid), which the existing AC-01/03/05/07
// specs target (decision D-001): content that exists only as files (zero
// src/ changes) is validated, indexed and rendered — proving the C-5
// invariant from the app side.
//
// Staging (idempotent — dist/content is rebuilt from public/ by vite each run):
//   1. npx vite build with local base '/' (BASE=/ wins over CI in
//      vite.config.ts) → dist/content holds whatever's in public/content.
//   2. merge-copy tests/fixtures/content/valid/* INTO dist/content/ (skip the
//      fixture's own index.json; we regenerate it next).
//   3. run build-content against dist/content so index.json lists the
//      fixture course (§4.2 catalogue).
//
// Usage: node scripts/e2e-prepare.mjs   (also run by playwright.config.ts webServer)

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtureRoot = path.join(repoRoot, 'tests', 'fixtures', 'content', 'valid');
const distDir = path.join(repoRoot, 'dist');
const distContent = path.join(distDir, 'content');

function run(label, command, args, extraEnv = {}) {
  console.log(`e2e-prepare: ${label}`);
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    env: { ...process.env, ...extraEnv },
  });
  if (result.error) {
    console.error(`e2e-prepare: "${label}" failed to start: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`e2e-prepare: "${label}" failed with exit code ${result.status}`);
    process.exit(result.status ?? 1);
  }
}

// 1a. Build the Python SDK bundle. public/python-bundle.zip is gitignored
//     (generated artifact, §3.3), so a fresh checkout — which is what every CI
//     job gets, including the e2e job, which does NOT share a filesystem with
//     the web job that calls `npm run build` — has none on disk until this
//     runs. Skipping it means `vite build` copies no bundle into dist/, the
//     worker's bundle fetch 404s, and every @py item hangs forever at
//     "loading LearnLab SDK…" (§6.2.2 step 2) with no visible error.
run('building python-bundle.zip (§6.2.2)', process.execPath, [
  path.join(repoRoot, 'scripts', 'build-python-bundle.mjs'),
]);

// 1b. Build the app shell (vite build copies public/content → dist/content,
//    and public/python-bundle.zip → dist/python-bundle.zip). BASE='/' keeps
//    the local base even when CI=1 (vite.config.ts: explicit BASE wins).
run('building app (vite build)', 'npx', ['vite', 'build'], {
  BASE: '/',
});

if (!fs.existsSync(path.join(distDir, 'python-bundle.zip'))) {
  console.error('e2e-prepare: dist/python-bundle.zip missing after vite build');
  process.exit(1);
}

// public/content ships no real courses, so vite build may not have created
// dist/content at all — the merge step below creates it.

// 2. Merge-copy the fixture tree INTO dist/content. Skip the fixture's own
//    index.json (regenerated in step 3) and any __pycache__ artefacts (not
//    valid content; build-content would py_compile real .py only). cpSync
//    creates dist/content if it doesn't already exist.
console.log('e2e-prepare: merging fixture course tree into dist/content');
fs.cpSync(fixtureRoot, distContent, {
  recursive: true,
  force: true,
  filter: (src) => {
    const parts = src.split(path.sep);
    if (parts.includes('__pycache__')) return false;
    // The fixture's own index.json is stale here; build-content regenerates it.
    if (path.basename(src) === 'index.json' && path.dirname(src) === fixtureRoot) return false;
    return true;
  },
});

// 3. Regenerate dist/content/index.json by validating + indexing the MERGED
//    tree, so the catalogue lists the fixture course (§4.7 step 6).
//    build-content emits <root>/index.json scanning <root>/**.
run('regenerating dist/content/index.json (build-content over merged tree)', process.execPath, [
  path.join(repoRoot, 'scripts', 'build-content.mjs'),
  '--root',
  distContent,
]);

// 4. Sanity-check: index.json exists and lists the fixture course, so a
//    misconfigured merge fails loudly here.
const indexPath = path.join(distContent, 'index.json');
if (!fs.existsSync(indexPath)) {
  console.error('e2e-prepare: dist/content/index.json missing after regeneration');
  process.exit(1);
}
const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
const courseIds = new Set(
  (index.subjects ?? []).flatMap((s) => (s.courses ?? []).map((c) => c.id)),
);
const required = ['test-course'];
const missing = required.filter((id) => !courseIds.has(id));
if (missing.length > 0) {
  console.error(
    `e2e-prepare: dist/content/index.json is missing expected course(s): ${missing.join(', ')}\n` +
      `  found: ${[...courseIds].sort().join(', ')}`,
  );
  process.exit(1);
}
console.log(
  `e2e-prepare: OK — dist/content has ${courseIds.size} course(s): ${[...courseIds].sort().join(', ')}`,
);
