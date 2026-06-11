#!/usr/bin/env node
/* global process, console */
// Python item scaffolder — FR-AUTH-002 (SRS §7.1).
//
// Usage: node scripts/new-item.mjs --kind quiz|simulation|plot|blank \
//          --name <item-name> [--dir <module-folder>]
//
// Generates <module-folder>/items/<item-name>.py from
// scripts/templates/<kind>.py. P0 ships only the `blank` template; the
// quiz/simulation/plot templates are added in P1 from the §6.13 reference
// examples.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const templatesDir = path.join(repoRoot, 'scripts', 'templates');

const KINDS = ['quiz', 'simulation', 'plot', 'blank'];
const NAME_RE = /^[a-z0-9]+([-_][a-z0-9]+)*$/;

function die(message) {
  console.error(`new-item: ${message}`);
  console.error('usage: new-item.mjs --kind quiz|simulation|plot|blank --name <item-name> [--dir <module-folder>]');
  process.exit(1);
}

const { values: flags } = parseArgs({
  options: {
    kind: { type: 'string' },
    name: { type: 'string' },
    dir: { type: 'string' },
  },
});

const kind = flags.kind;
if (!kind) die('--kind is required');
if (!KINDS.includes(kind)) die(`unknown kind "${kind}" — must be one of ${KINDS.join(', ')}`);

const name = flags.name;
if (!name) die('--name is required');
if (!NAME_RE.test(name)) die(`item name "${name}" is invalid — use lowercase letters, digits, - or _`);

const template = path.join(templatesDir, `${kind}.py`);
if (!fs.existsSync(template)) {
  die(
    `the "${kind}" template is not available yet — it ships in P1, byte-identical to the §6.13 reference examples. ` +
      `Available now: ${KINDS.filter((k) => fs.existsSync(path.join(templatesDir, `${k}.py`))).join(', ') || '(none)'}`,
  );
}

const moduleDir = path.resolve(flags.dir ?? '.');
if (!fs.existsSync(moduleDir)) die(`module folder does not exist: ${moduleDir}`);

const itemsDir = path.join(moduleDir, 'items');
const target = path.join(itemsDir, `${name}.py`);
if (fs.existsSync(target)) die(`refusing to overwrite existing item: ${target}`);

fs.mkdirSync(itemsDir, { recursive: true });
fs.copyFileSync(template, target);

console.log(`new-item: created ${path.relative(process.cwd(), target)} (kind: ${kind})`);
console.log(`Embed it in a lesson with: ::py{src="items/${name}.py"}`);
