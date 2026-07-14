/* global console, process */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const LEVELS = ['gcse', 'as', 'a2', 'alevel', 'foundation', 'adult', 'postgrad'];

export function die(command, message) {
  console.error(`${command}: ${message}`);
  process.exit(1);
}

export function assertId(command, value, what) {
  if (!ID_RE.test(value ?? '') || value.length > 64) {
    die(command, `${what} "${value}" is invalid — ids are lowercase kebab-case, ≤ 64 chars.`);
  }
  return value;
}

export function titleCase(id) {
  return id.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

/** Make a derived schema id without losing the distinguishing suffix. */
export function withSuffix(id, suffix) {
  return `${id.slice(0, 64 - suffix.length)}${suffix}`;
}

export function resolveRoot(root) {
  return path.resolve(root ?? path.join(repoRoot, 'public', 'content'));
}

export function readJson(file, command) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    die(command, `could not read valid JSON from ${file}: ${error.message}`);
  }
}

export function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

export function renderTemplate(name, values) {
  const file = path.join(repoRoot, 'scripts', 'templates', 'experience-v2', name);
  const template = JSON.parse(fs.readFileSync(file, 'utf8'));
  return replace(template, values);
}

function replace(value, values) {
  if (Array.isArray(value)) return value.map((entry) => replace(entry, values));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, replace(entry, values)]));
  }
  if (typeof value !== 'string') return value;
  const wholeValue = value.match(/^\{\{([A-Za-z][A-Za-z0-9]*)\}\}$/);
  if (wholeValue) {
    const [, key] = wholeValue;
    if (!(key in values)) throw new Error(`template value "${key}" is missing`);
    return values[key];
  }
  return value.replace(/\{\{([A-Za-z][A-Za-z0-9]*)\}\}/g, (_match, key) => {
    if (!(key in values)) throw new Error(`template value "${key}" is missing`);
    return String(values[key]);
  });
}

export function rel(file) {
  return path.relative(process.cwd(), file) || '.';
}
