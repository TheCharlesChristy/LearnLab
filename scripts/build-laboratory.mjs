#!/usr/bin/env node
/* global console */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parseLaboratoryPack } from '../src/v2/pack.ts';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/laboratory');
fs.mkdirSync(root, { recursive: true });
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const packs = [];
for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (entry.name === 'index.json') continue;
  if (!entry.isDirectory()) throw new Error(`Unregistered laboratory file ${entry.name}`);
  const folder = fs.realpathSync(path.join(root, entry.name));
  if (folder !== path.join(root, entry.name))
    throw new Error(`Pack symlink not supported: ${entry.name}`);
  const bytes = fs.readFileSync(path.join(folder, 'pack.json'));
  const pack = parseLaboratoryPack(JSON.parse(bytes));
  if (pack.id !== entry.name)
    throw new Error(`Pack identity disagrees with directory ${entry.name}`);
  const files = [{ path: `${pack.id}/pack.json`, sha256: digest(bytes), bytes: bytes.length }];
  for (const asset of pack.assets) {
    const file = fs.realpathSync(path.join(folder, asset.path));
    if (!file.startsWith(`${folder}${path.sep}`) || !fs.statSync(file).isFile())
      throw new Error(`Escaped asset ${asset.path}`);
    const data = fs.readFileSync(file);
    files.push({ path: `${pack.id}/${asset.path}`, sha256: digest(data), bytes: data.length });
  }
  const expected = new Set(['pack.json', ...pack.assets.map((a) => a.path)]);
  const walk = (dir) => {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, item.name);
      if (item.isDirectory()) walk(file);
      else if (!expected.has(path.relative(folder, file).split(path.sep).join('/')))
        throw new Error(`Orphan pack file ${file}`);
    }
  };
  walk(folder);
  packs.push({
    id: pack.id,
    title: pack.title,
    description: pack.description,
    version: pack.version,
    subject: pack.subject,
    audience: pack.audience,
    level: pack.level,
    episodes: pack.episodes.length,
    files,
  });
}
fs.writeFileSync(
  path.join(root, 'index.json'),
  JSON.stringify({ formatVersion: 1, packs }, null, 2) + '\n',
);
console.log(`Validated ${packs.length} laboratory pack(s), generated acquisition index.`);
