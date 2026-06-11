#!/usr/bin/env node
/* global process, console */
// Dumps the widget-key manifest (SRS §4.7): copies src/widgets/keys.json —
// the plain-data twin of src/widgets/registry.ts — to schemas/widget-keys.json
// so the Node content pipeline can validate `::widget` types without
// importing TypeScript. Run automatically by build-content.mjs.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function dumpWidgetKeys() {
  const srcFile = path.join(repoRoot, 'src', 'widgets', 'keys.json');
  const outFile = path.join(repoRoot, 'schemas', 'widget-keys.json');
  const keys = JSON.parse(fs.readFileSync(srcFile, 'utf8'));
  if (!Array.isArray(keys) || keys.length === 0 || keys.some((k) => typeof k !== 'string')) {
    throw new Error(`${srcFile}: expected a non-empty JSON array of widget-key strings`);
  }
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, `${JSON.stringify(keys, null, 2)}\n`);
  return keys;
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  const keys = dumpWidgetKeys();
  console.log(`dump-widget-keys: wrote schemas/widget-keys.json (${keys.length} keys)`);
}
