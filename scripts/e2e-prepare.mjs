#!/usr/bin/env node
/* global process, console */
// E2E build step (SRS §11 E2E row, AC-01 app half, decision D-001).
//
// P0 ships no public content, so the Playwright suite runs against the
// fixture course tree in tests/fixtures/content/valid. This script proves
// the AC-01 / C-5 invariant from the app side: content that exists only as
// files (zero src/ changes) is validated, indexed and rendered by the app.
//
//   1. node scripts/build-content.mjs --root tests/fixtures/content/valid
//      (validates the tree and emits index.json into the fixture root)
//   2. npx vite build with local base '/' (BASE=/ wins over CI in vite.config.ts)
//   3. copy tests/fixtures/content/valid/** (incl. the generated index.json)
//      into dist/content/
//
// Idempotent: dist/content is replaced wholesale on every run.
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

// 1. Validate the fixture content tree and emit its index.json (§4.7).
run('validating fixture content tree', process.execPath, [
  path.join(repoRoot, 'scripts', 'build-content.mjs'),
  '--root',
  fixtureRoot,
]);

// 2. Build the app shell. BASE='/' keeps the local base even when CI=1
//    (vite.config.ts: explicit BASE takes precedence over the CI default).
run('building app (vite build)', 'npx', ['vite', 'build'], { BASE: '/' });

// 3. Serve the fixture tree as the app's content root (replaces the empty
//    public/content/index.json that vite copied into dist/).
fs.rmSync(distContent, { recursive: true, force: true });
fs.cpSync(fixtureRoot, distContent, {
  recursive: true,
  filter: (src) => !src.split(path.sep).includes('__pycache__'),
});

if (!fs.existsSync(path.join(distContent, 'index.json'))) {
  console.error('e2e-prepare: dist/content/index.json missing after copy');
  process.exit(1);
}
console.log('e2e-prepare: OK — fixture content copied into dist/content/');
