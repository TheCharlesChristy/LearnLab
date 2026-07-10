#!/usr/bin/env node
/* global process, console */
// E2E build step (SRS §11 E2E row; AC-01 app half; AC-02/04/10 @py suite).
//
// The Playwright suite needs TWO content trees in dist/content/:
//
//   * The REAL pilot modules (public/content): differentiation-1 @
//     maths/alevel-pure with items/power-rule-quiz.py, and kinematics-suvat @
//     maths/alevel-mechanics with items/projectile.py. The @py specs
//     (py-ac02/04/10) drive these against real Pyodide. `vite build` copies
//     public/ → dist/, so dist/content already holds the real modules.
//
//   * The fixture course tree (tests/fixtures/content/valid). The existing
//     AC-01/03/05/07 specs target it (decision D-001): content that exists
//     only as files (zero src/ changes) is validated, indexed and rendered —
//     proving the C-5 invariant from the app side.
//
// Staging (idempotent — dist/content is rebuilt from public/ by vite each run):
//   1. npx vite build with local base '/' (BASE=/ wins over CI in
//      vite.config.ts) → dist/content holds the real pilot modules.
//   2. merge-copy tests/fixtures/content/valid/* INTO dist/content/ WITHOUT
//      deleting the real content (skip the fixture's own index.json; we
//      regenerate it next). The fixture lives under maths/test-course, so the
//      copy merges into the existing maths/ folder beside the real courses.
//   3. run build-content against dist/content so index.json lists BOTH the
//      fixture course AND the four real pilot courses (§4.2 catalogue).
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
//    so the REAL pilot modules ship into the served content root, and
//    public/python-bundle.zip → dist/python-bundle.zip). BASE='/' keeps the
//    local base even when CI=1 (vite.config.ts: explicit BASE wins).
run(
  'building app (vite build, real public/content included)',
  process.execPath,
  [path.join(repoRoot, 'node_modules', 'vite', 'bin', 'vite.js'), 'build'],
  {
  BASE: '/',
  },
);

if (!fs.existsSync(path.join(distDir, 'python-bundle.zip'))) {
  console.error('e2e-prepare: dist/python-bundle.zip missing after vite build');
  process.exit(1);
}

if (!fs.existsSync(distContent)) {
  console.error('e2e-prepare: dist/content missing after vite build');
  process.exit(1);
}

// 2. Merge-copy the fixture tree INTO dist/content (do NOT delete real
//    content). Skip the fixture's own index.json (regenerated in step 3) and
//    any __pycache__ artefacts (not valid content; build-content would py_compile
//    real .py only). cpSync merges into existing directories (force overwrite),
//    so maths/test-course lands beside the real maths/alevel-* courses.
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
//    tree, so the catalogue lists the fixture course AND the four real pilots
//    (§4.7 step 6). build-content emits <root>/index.json scanning <root>/**.
run('regenerating dist/content/index.json (build-content over merged tree)', process.execPath, [
  path.join(repoRoot, 'scripts', 'build-content.mjs'),
  '--root',
  distContent,
]);

// 4. Sanity-check: index.json exists and lists both the fixture course and the
//    real pilot courses, so a misconfigured merge fails loudly here.
const indexPath = path.join(distContent, 'index.json');
if (!fs.existsSync(indexPath)) {
  console.error('e2e-prepare: dist/content/index.json missing after regeneration');
  process.exit(1);
}
const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
const courseIds = new Set(
  (index.subjects ?? []).flatMap((s) => (s.courses ?? []).map((c) => c.id)),
);
const required = ['test-course', 'alevel-pure', 'alevel-mechanics', 'alevel-cs', 'ai-foundations'];
const missing = required.filter((id) => !courseIds.has(id));
if (missing.length > 0) {
  console.error(
    `e2e-prepare: dist/content/index.json is missing expected course(s): ${missing.join(', ')}\n` +
      `  found: ${[...courseIds].sort().join(', ')}`,
  );
  process.exit(1);
}
console.log(
  `e2e-prepare: OK — dist/content has ${courseIds.size} courses ` +
    `(fixture + real pilots): ${[...courseIds].sort().join(', ')}`,
);
