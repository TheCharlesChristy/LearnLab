#!/usr/bin/env node
/* global process, console */
// Experience Runtime v2 course-pack scaffolder (#45 / D1).
//
// Interactive:     npm run new:course
// Non-interactive: npm run new:course -- --id bridge-missions --title "Bridge missions"
//                  --description "Use force balance to repair a bridge." --subject physics
//                  [--level gcse] [--minutes 20] [--root <content-root>]

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { parseArgs } from 'node:util';

import { LEVELS, assertId, die, rel, renderTemplate, resolveRoot, titleCase, withSuffix, writeJson } from './experience-scaffold-utils.mjs';

const command = 'new-course';
const { values: flags } = parseArgs({
  options: {
    id: { type: 'string' },
    pack: { type: 'string' },
    course: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string' },
    subject: { type: 'string' },
    level: { type: 'string' },
    minutes: { type: 'string' },
    experience: { type: 'string' },
    root: { type: 'string' },
  },
});

async function collectAnswers() {
  const answers = { ...flags, id: flags.id ?? flags.pack ?? flags.course };
  if (!answers.id && !process.stdin.isTTY) die(command, 'missing required flag in non-interactive mode: --id');
  if (answers.id && process.stdin.isTTY && answers.title && answers.description && answers.subject) return answers;
  if (!process.stdin.isTTY) return answers;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = async (question, fallback = '') => (await rl.question(question)).trim() || fallback;
  answers.id ??= await ask('Course-pack id (kebab-case): ');
  answers.title ??= await ask(`Course title [${titleCase(answers.id || 'new-course')}]: `, titleCase(answers.id || 'new-course'));
  answers.description ??= await ask('Course description: ', `TODO: describe ${answers.title}.`);
  answers.subject ??= await ask('Primary subject (kebab-case): ');
  answers.level ??= await ask(`Audience level (${LEVELS.join('/')}) [foundation]: `, 'foundation');
  answers.minutes ??= await ask('Estimated minutes [15]: ', '15');
  answers.experience ??= await ask('First experience id [first-experience]: ', 'first-experience');
  rl.close();
  return answers;
}

const answers = await collectAnswers();
const packId = assertId(command, answers.id, 'course-pack id');
const title = answers.title || titleCase(packId);
const description = answers.description || `TODO: describe ${title}.`;
const subject = assertId(command, answers.subject || 'general', 'subject id');
const level = answers.level || 'foundation';
if (!LEVELS.includes(level)) die(command, `level must be one of ${LEVELS.join(', ')}`);
const estimatedMinutes = Number(answers.minutes ?? '15');
if (!Number.isInteger(estimatedMinutes) || estimatedMinutes < 1) die(command, '--minutes must be a positive integer');
const experienceId = assertId(command, answers.experience || 'first-experience', 'first experience id');
const root = resolveRoot(answers.root);
const packDir = path.join(root, 'v2', packId);
if (fs.existsSync(packDir)) die(command, `course-pack folder already exists: ${packDir}`);

const values = {
  packId,
  title,
  description,
  subject,
  level,
  audienceSummary: `Learners studying ${title}.`,
  estimatedMinutes,
  experienceId,
  experienceTitle: titleCase(experienceId),
  experienceMinutes: estimatedMinutes,
  campaignId: withSuffix(packId, '-campaign'),
  campaignTitle: `${title} campaign`,
  skillId: withSuffix(packId, '-starter-skill'),
  skillTitle: `${title} starter skill`,
  reviewId: withSuffix(packId, '-starter-review'),
  stateVersion: '1.0.0',
};
const pack = renderTemplate('course-pack.template.json', values);
const graph = renderTemplate('experience-graph.template.json', values);
const packFile = path.join(packDir, 'course-pack.json');
const graphFile = path.join(packDir, 'experiences', `${experienceId}.json`);
const fixtureFile = path.join(packDir, 'fixtures', `${experienceId}.fixture.json`);

fs.mkdirSync(path.join(packDir, 'experiences'), { recursive: true });
fs.mkdirSync(path.join(packDir, 'assets'), { recursive: true });
fs.mkdirSync(path.join(packDir, 'fixtures'), { recursive: true });
fs.writeFileSync(path.join(packDir, 'assets', '.gitkeep'), '');
writeJson(packFile, pack);
writeJson(graphFile, graph);
writeJson(fixtureFile, graph);

console.log(`new-course: created ${rel(packDir)}/`);
console.log(`  ${rel(packFile)}`);
console.log(`  ${rel(graphFile)}`);
console.log(`  ${rel(fixtureFile)} (copy for Studio/runtime tests)`);
console.log(`  ${rel(path.join(packDir, 'assets'))}/`);
console.log('Next: replace every TODO, add real assets/attributions when needed, then run `npm run validate -- --strict`.');
