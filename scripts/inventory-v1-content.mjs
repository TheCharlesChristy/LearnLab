#!/usr/bin/env node
/* global console, process */
// H2 / #63: read-only, deterministic v1 migration inventory. It reconciles
// manifests with the filesystem and ranks human-review candidates; it never
// converts, moves, or rewrites course content.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_EXTENSIONS = new Set(['.md', '.screens.json', '.py']);

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return undefined;
  }
}
function rel(root, file) {
  return path.relative(root, file).split(path.sep).join('/');
}
function dirs(dir) {
  return fs.existsSync(dir)
    ? fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .sort()
    : [];
}
function files(dir) {
  return fs.existsSync(dir)
    ? fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isFile())
        .map((e) => e.name)
        .sort()
    : [];
}
function formatFor(lesson) {
  if (lesson.kind === 'screens' || String(lesson.file).endsWith('.screens.json'))
    return 'v1-screens';
  if (lesson.kind === 'python' || String(lesson.file).endsWith('.py')) return 'python';
  return 'markdown';
}
function markdownFacts(file) {
  const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  return {
    activities: [...text.matchAll(/^::(?:widget|py)\{([^}]*)\}/gm)].map((m) =>
      m[0].startsWith('::py') ? 'python-item' : 'widget',
    ),
    feedback: /(?:quiz|flashcards|matching-pairs)/.test(text)
      ? 'embedded-or-widget'
      : 'not-declared',
    assets: [...text.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((m) => m[1]),
    python: /^::py\{/m.test(text),
  };
}
function screenFacts(file) {
  const data = readJson(file);
  const screens = data?.screens ?? [];
  const types = screens.map((screen) => screen.type).filter(Boolean);
  const feedback = screens.filter(
    (screen) => screen.successFeedback || screen.feedback?.success,
  ).length;
  return {
    activities: types,
    feedback: `${feedback}/${screens.length} explicit success feedback`,
    assets: [],
    python: false,
  };
}
function pythonFacts() {
  return { activities: ['python-item'], feedback: 'item-owned', assets: [], python: true };
}
function rank(module) {
  const effort = module.lessons.reduce(
    (n, lesson) =>
      n +
      (lesson.format === 'v1-screens' ? 1 : lesson.format === 'markdown' ? 3 : 4) +
      lesson.activities.length,
    0,
  );
  const risk =
    (module.orphans.length ? 3 : 0) +
    (module.dualFormat ? 2 : 0) +
    module.lessons.filter((l) => l.python).length * 2 +
    module.lessons.filter((l) => l.feedback === 'not-declared').length;
  const value =
    Math.max(1, module.estMinutes ?? 0) +
    module.objectives.length * 2 +
    module.lessons.reduce((n, l) => n + l.activities.length, 0);
  return { effort, risk, value, priority: value * 2 - effort - risk };
}

export function createV1Inventory(root) {
  const modules = [];
  const orphans = [];
  for (const subject of dirs(root).filter((name) => name !== 'v2')) {
    for (const courseDirName of dirs(path.join(root, subject))) {
      const courseDir = path.join(root, subject, courseDirName);
      const course = readJson(path.join(courseDir, 'course.json'));
      if (!course?.modules) continue;
      const declaredDirs = new Set(course.modules.map((m) => m.dir));
      for (const diskDir of dirs(courseDir)) {
        if (!declaredDirs.has(diskDir))
          orphans.push({
            kind: 'module-directory',
            path: rel(root, path.join(courseDir, diskDir)),
            resolution:
              'Keep out of migration scope until course.json declares it or it is removed.',
          });
      }
      for (const ref of [...course.modules].sort((a, b) => a.id.localeCompare(b.id))) {
        const moduleDir = path.join(courseDir, ref.dir);
        const manifest = readJson(path.join(moduleDir, 'module.json'));
        if (!manifest) {
          orphans.push({
            kind: 'missing-module-manifest',
            path: rel(root, moduleDir),
            resolution: 'Repair the legacy manifest before considering migration.',
          });
          continue;
        }
        const declaredFiles = new Set((manifest.lessons ?? []).map((l) => l.file));
        const moduleOrphans = files(moduleDir)
          .filter(
            (name) => CONTENT_EXTENSIONS.has(path.extname(name)) || name.endsWith('.screens.json'),
          )
          .filter((name) => !declaredFiles.has(name))
          .map((name) => rel(root, path.join(moduleDir, name)));
        const lessons = (manifest.lessons ?? [])
          .map((lesson) => {
            const file = path.join(moduleDir, lesson.file);
            const format = formatFor(lesson);
            const facts =
              format === 'markdown'
                ? markdownFacts(file)
                : format === 'v1-screens'
                  ? screenFacts(file)
                  : pythonFacts();
            return {
              id: lesson.id,
              title: lesson.title,
              file: rel(root, file),
              format,
              exists: fs.existsSync(file),
              ...facts,
            };
          })
          .sort((a, b) => a.id.localeCompare(b.id));
        const formats = [...new Set(lessons.map((lesson) => lesson.format))].sort();
        const record = {
          subject,
          courseId: course.id,
          courseTitle: course.title,
          moduleId: manifest.id,
          moduleTitle: manifest.title,
          path: rel(root, moduleDir),
          estMinutes: manifest.estMinutes ?? 0,
          prerequisites: manifest.prerequisites ?? [],
          objectives: manifest.objectives ?? [],
          lessons,
          formats,
          dualFormat: formats.length > 1,
          orphans: moduleOrphans,
        };
        modules.push({ ...record, rank: rank({ ...record, orphans: moduleOrphans }) });
        for (const orphan of moduleOrphans)
          orphans.push({
            kind: 'lesson-file',
            path: orphan,
            resolution:
              'Do not migrate automatically; either add it to module.json or archive it after review.',
          });
      }
    }
  }
  modules.sort((a, b) => b.rank.priority - a.rank.priority || a.path.localeCompare(b.path));
  const dualFormats = modules
    .filter((module) => module.dualFormat)
    .map((module) => ({
      path: module.path,
      formats: module.formats,
      resolution:
        'Preserve each format during discovery; do not merge or overwrite lessons automatically.',
    }));
  const first =
    modules.find((module) => module.lessons.some((lesson) => lesson.format !== 'v1-screens')) ??
    modules[0];
  return {
    schemaVersion: 1,
    kind: 'learnlab-v1-migration-inventory',
    modules,
    orphans,
    dualFormats,
    proposedFirstLegacyOnlyPath: first
      ? {
          modulePath: first.path,
          rationale:
            'Highest deterministic value/effort/risk priority among legacy modules; this is a proposed discovery path, not a migration instruction.',
          firstStep:
            'Run the review-only migration plan, then author a separate v2 proposal after human pedagogy review.',
        }
      : null,
  };
}
export function renderInventoryMarkdown(inventory) {
  const lines = [
    '# V1 content migration inventory',
    '',
    '> Generated by `npm run inventory:migration -- --out docs/V1_CONTENT_MIGRATION_INVENTORY.md --write`. Read-only: it does not migrate content.',
    '',
    '## Prioritised modules',
    '',
    '| Module | Formats | Value | Effort | Risk | Priority |',
    '| --- | --- | ---: | ---: | ---: | ---: |',
  ];
  for (const module of inventory.modules)
    lines.push(
      `| ${module.path} | ${module.formats.join(', ')} | ${module.rank.value} | ${module.rank.effort} | ${module.rank.risk} | ${module.rank.priority} |`,
    );
  lines.push('', '## Explicit resolutions', '');
  for (const item of [...inventory.orphans, ...inventory.dualFormats]) {
    lines.push(`- ${item.path} (${item.kind ?? 'dual format'}): ${item.resolution}`);
  }
  const first = inventory.proposedFirstLegacyOnlyPath;
  lines.push(
    '',
    '## Proposed first legacy-only path',
    '',
    first
      ? `${first.modulePath} - ${first.rationale} ${first.firstStep}`
      : 'No legacy modules were found.',
    '',
  );
  return lines.join('\n');
}
function main() {
  const { values } = parseArgs({
    options: {
      root: { type: 'string' },
      out: { type: 'string' },
      write: { type: 'boolean', default: false },
      check: { type: 'boolean', default: false },
      json: { type: 'boolean', default: false },
    },
  });
  if (values.write && values.check) throw new Error('--write and --check cannot be combined.');
  const root = path.resolve(values.root ?? path.join(repoRoot, 'public', 'content'));
  const inventory = createV1Inventory(root);
  const rendered = values.json
    ? `${JSON.stringify(inventory, null, 2)}\n`
    : renderInventoryMarkdown(inventory);
  if (values.check) {
    if (
      !values.out ||
      !fs.existsSync(values.out) ||
      fs.readFileSync(values.out, 'utf8') !== rendered
    )
      process.exitCode = 1;
    else console.log(`inventory-v1-content: report is current: ${values.out}`);
    return;
  }
  if (values.write) {
    if (!values.out) throw new Error('--out is required with --write.');
    fs.mkdirSync(path.dirname(values.out), { recursive: true });
    fs.writeFileSync(values.out, rendered);
    console.log(`inventory-v1-content: wrote ${values.out}`);
    return;
  }
  process.stdout.write(rendered);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(`inventory-v1-content: ${error.message}`);
    process.exit(2);
  }
}
