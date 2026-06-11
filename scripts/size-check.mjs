#!/usr/bin/env node
/* global process, console */
// Bundle-size budget gate — NFR-PERF-001.
//   • Initial (non-lazy) entry JS chunks: ≤ 350 KB gzipped.
//   • Lazy chunks:                        ≤ 150 KB gzipped.
// Entry chunks are the .js files referenced by <script> tags in
// dist/index.html; every other dist/assets/*.js file is a lazy chunk.
//
// Usage: node scripts/size-check.mjs   (after `vite build`)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(repoRoot, 'dist');
const assetsDir = path.join(distDir, 'assets');
const indexHtml = path.join(distDir, 'index.html');

const ENTRY_LIMIT = 350 * 1024; // gzipped bytes
const LAZY_LIMIT = 150 * 1024; // gzipped bytes

if (!fs.existsSync(indexHtml)) {
  console.error('size-check: dist/index.html not found — run `vite build` first.');
  process.exit(1);
}

const html = fs.readFileSync(indexHtml, 'utf8');
const entryNames = new Set(
  [...html.matchAll(/<script[^>]*\bsrc="([^"]+\.js)"/g)].map((m) => path.basename(m[1])),
);

const jsFiles = fs.existsSync(assetsDir)
  ? fs.readdirSync(assetsDir).filter((f) => f.endsWith('.js')).sort()
  : [];

if (jsFiles.length === 0) {
  console.error('size-check: no JS chunks found under dist/assets — run `vite build` first.');
  process.exit(1);
}

const kb = (bytes) => (bytes / 1024).toFixed(1);

const rows = jsFiles.map((file) => {
  const raw = fs.readFileSync(path.join(assetsDir, file));
  const gz = zlib.gzipSync(raw, { level: zlib.constants.Z_BEST_COMPRESSION }).length;
  const isEntry = entryNames.has(file);
  const limit = isEntry ? ENTRY_LIMIT : LAZY_LIMIT;
  return {
    file,
    kind: isEntry ? 'entry' : 'lazy',
    raw: raw.length,
    gz,
    limit,
    ok: gz <= limit,
  };
});

const w = Math.max(...rows.map((r) => r.file.length), 'chunk'.length);
console.log(
  `${'chunk'.padEnd(w)}  kind   raw KB    gz KB   limit KB  status`,
);
for (const r of rows) {
  console.log(
    `${r.file.padEnd(w)}  ${r.kind.padEnd(5)} ${kb(r.raw).padStart(8)} ${kb(r.gz).padStart(8)} ${kb(r.limit).padStart(10)}  ${r.ok ? 'OK' : 'OVER BUDGET'}`,
  );
}

const failures = rows.filter((r) => !r.ok);
if (failures.length > 0) {
  console.error(
    `size-check: FAILED — ${failures.length} chunk(s) exceed the NFR-PERF-001 budget (entry ≤ 350 KB gz, lazy ≤ 150 KB gz).`,
  );
  process.exit(1);
}
console.log('size-check: all chunks within NFR-PERF-001 budgets.');
