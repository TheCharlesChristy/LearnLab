#!/usr/bin/env node
/* global console, process */
// D4 / #48: deterministic migration planning. This command never rewrites
// lessons; it produces a reviewable plan that makes the required human
// pedagogy/content decisions explicit before a v2 pack is authored.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fail(message) {
  console.error(`migrate-v2-content: ${message}`);
  process.exit(2);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    fail(`${file}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function outputJson(plan) {
  return `${JSON.stringify(plan, null, 2)}\n`;
}

function relative(root, target) {
  return path.relative(root, target).split(path.sep).join('/');
}

function targetId(prefix, suffix) {
  return `${prefix}-${suffix}`.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
}

export function createMigrationPlan({ root, coursePath, packId }) {
  const courseDir = path.resolve(root, coursePath);
  if (!courseDir.startsWith(`${path.resolve(root)}${path.sep}`)) {
    throw new Error('course path must remain below --root.');
  }
  const courseFile = path.join(courseDir, 'course.json');
  if (!fs.existsSync(courseFile)) throw new Error(`missing legacy course manifest: ${courseFile}`);
  const course = readJson(courseFile);
  const operations = [];
  const manualReview = [];

  operations.push({
    op: 'create-pack',
    target: `v2/${packId}/course-pack.json`,
    reason:
      'Create a v2 pack with explicit audience, skill, state, capability, campaign, asset, and review declarations.',
  });

  for (const moduleRef of [...(course.modules ?? [])].sort((left, right) =>
    left.id.localeCompare(right.id),
  )) {
    const moduleDir = path.join(courseDir, moduleRef.dir);
    const moduleFile = path.join(moduleDir, 'module.json');
    if (!fs.existsSync(moduleFile)) {
      manualReview.push({
        source: relative(root, moduleDir),
        reason: 'Declared module directory has no module.json.',
      });
      continue;
    }
    const module = readJson(moduleFile);
    const modulePrefix = targetId(packId, module.id ?? moduleRef.id);
    operations.push({
      op: 'declare-skill-mapping',
      source: relative(root, moduleFile),
      target: `v2/${packId}/course-pack.json#/skills`,
      reason: `Map module objectives for "${module.title ?? moduleRef.id}" to explicit v2 skills; do not infer mastery from legacy attempts.`,
    });
    for (const lesson of [...(module.lessons ?? [])].sort((left, right) =>
      left.id.localeCompare(right.id),
    )) {
      const source = path.join(moduleDir, lesson.file);
      const experienceId = targetId(modulePrefix, lesson.id);
      const base = {
        source: relative(root, source),
        target: `v2/${packId}/experiences/${experienceId}.json`,
      };
      if (String(lesson.file).endsWith('.screens.json')) {
        operations.push({
          op: 'adapt-screen-sequence',
          ...base,
          reason:
            'Use the v1 screen adapter first; preserve real interaction gates and then replace with composable activities only after review.',
        });
      } else {
        operations.push({
          op: 'preserve-markdown',
          ...base,
          reason:
            'Keep legacy Markdown readable; manually select the learning beats that justify a new v2 experience rather than mechanically converting prose.',
        });
      }
      manualReview.push({
        source: relative(root, source),
        reason:
          'Review prediction hook, generation/recognition mix, feedback explanations, assets, and skill evidence before approving this migration.',
      });
    }
  }

  return {
    schemaVersion: 1,
    kind: 'learnlab-v2-migration-plan',
    source: { course: relative(root, courseDir), courseId: course.id },
    target: { packId, directory: `v2/${packId}` },
    operations,
    manualReview,
  };
}

function main() {
  const { values } = parseArgs({
    options: {
      root: { type: 'string' },
      course: { type: 'string' },
      pack: { type: 'string' },
      out: { type: 'string' },
      write: { type: 'boolean', default: false },
      check: { type: 'boolean', default: false },
    },
  });
  if (!values.course)
    fail('--course is required (relative legacy course directory, e.g. maths/alevel-pure).');
  if (!values.pack || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.pack))
    fail('--pack must be a kebab-case v2 pack id.');
  if (values.write && values.check) fail('--write and --check cannot be used together.');
  if ((values.write || values.check) && !values.out)
    fail('--out is required with --write or --check.');

  const root = path.resolve(values.root ?? path.join(repoRoot, 'public', 'content'));
  let plan;
  try {
    plan = createMigrationPlan({ root, coursePath: values.course, packId: values.pack });
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
  const rendered = outputJson(plan);
  if (values.check) {
    const out = path.resolve(values.out);
    if (!fs.existsSync(out) || fs.readFileSync(out, 'utf8') !== rendered) {
      console.error(`migrate-v2-content: migration plan is out of date: ${out}`);
      process.exit(1);
    }
    console.log(`migrate-v2-content: plan is current: ${out}`);
    return;
  }
  if (values.write) {
    const out = path.resolve(values.out);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, rendered);
    console.log(`migrate-v2-content: wrote review plan: ${out}`);
    return;
  }
  process.stdout.write(rendered);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
