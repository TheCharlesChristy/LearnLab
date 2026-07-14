#!/usr/bin/env node
/* global process, console */
// Experience Runtime v2 episode scaffolder (#45 / D1).
//
// npm run new:experience -- --pack bridge-missions --id inspect-support --title "Inspect the support"
//   [--minutes 5] [--campaign bridge-missions-campaign] [--root <content-root>]

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { parseArgs } from 'node:util';

import { assertId, die, readJson, rel, renderTemplate, resolveRoot, titleCase, writeJson } from './experience-scaffold-utils.mjs';

const command = 'new-experience';
const { values: flags } = parseArgs({
  options: {
    pack: { type: 'string' },
    course: { type: 'string' },
    id: { type: 'string' },
    title: { type: 'string' },
    minutes: { type: 'string' },
    campaign: { type: 'string' },
    root: { type: 'string' },
  },
});

async function collectAnswers() {
  const answers = { ...flags, pack: flags.pack ?? flags.course };
  const required = ['pack', 'id'];
  if (required.some((key) => !answers[key]) && !process.stdin.isTTY) {
    die(command, `missing required flags in non-interactive mode: ${required.filter((key) => !answers[key]).map((key) => `--${key}`).join(' ')}`);
  }
  if (!process.stdin.isTTY) return answers;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = async (question, fallback = '') => (await rl.question(question)).trim() || fallback;
  answers.pack ??= await ask('Course-pack id (kebab-case): ');
  answers.id ??= await ask('Experience id (kebab-case): ');
  answers.title ??= await ask(`Experience title [${titleCase(answers.id || 'new-experience')}]: `, titleCase(answers.id || 'new-experience'));
  answers.minutes ??= await ask('Estimated minutes [5]: ', '5');
  rl.close();
  return answers;
}

const answers = await collectAnswers();
const packId = assertId(command, answers.pack, 'course-pack id');
const experienceId = assertId(command, answers.id, 'experience id');
const title = answers.title || titleCase(experienceId);
const estimatedMinutes = Number(answers.minutes ?? '5');
if (!Number.isInteger(estimatedMinutes) || estimatedMinutes < 1) die(command, '--minutes must be a positive integer');
const root = resolveRoot(answers.root);
const packDir = path.join(root, 'v2', packId);
const packFile = path.join(packDir, 'course-pack.json');
if (!fs.existsSync(packFile)) die(command, `course-pack manifest does not exist: ${packFile}`);
const pack = readJson(packFile, command);
if (pack.id !== packId) die(command, `manifest id "${pack.id}" does not match --pack "${packId}"`);
if (pack.experiences.some((experience) => experience.id === experienceId)) die(command, `course-pack already declares experience id "${experienceId}"`);
if (!pack.engineCapabilities.some((capability) => capability.key === 'choice' && capability.version === '1.0.0')) {
  die(command, 'course-pack must declare the installed choice@1.0.0 capability before scaffolding an experience');
}
const campaign = pack.campaigns.find((entry) => entry.id === (answers.campaign ?? pack.campaigns[0]?.id));
if (!campaign) die(command, answers.campaign ? `campaign "${answers.campaign}" does not exist in this course-pack` : 'course-pack has no campaign to receive the experience');
const graphFile = path.join(packDir, 'experiences', `${experienceId}.json`);
if (fs.existsSync(graphFile)) die(command, `experience file already exists: ${graphFile}`);

const graph = renderTemplate('experience-graph.template.json', {
  packId,
  experienceId,
  experienceTitle: title,
  stateVersion: pack.state.version,
});
pack.experiences.push({ id: experienceId, file: `experiences/${experienceId}.json`, title, estimatedMinutes });
campaign.experienceIds.push(experienceId);
pack.estimatedMinutes += estimatedMinutes;

fs.mkdirSync(path.dirname(graphFile), { recursive: true });
fs.mkdirSync(path.join(packDir, 'fixtures'), { recursive: true });
fs.mkdirSync(path.join(packDir, 'assets'), { recursive: true });
fs.writeFileSync(path.join(packDir, 'assets', '.gitkeep'), '', { flag: 'a' });
writeJson(graphFile, graph);
writeJson(path.join(packDir, 'fixtures', `${experienceId}.fixture.json`), graph);
writeJson(packFile, pack);

console.log(`new-experience: added ${rel(graphFile)}`);
console.log(`  appended ${experienceId} to campaign ${campaign.id} and course-pack.json`);
console.log(`  ${rel(path.join(packDir, 'fixtures', `${experienceId}.fixture.json`))} (copy for Studio/runtime tests)`);
console.log('Next: replace every TODO, author a review item when this episode earns a capability, then run `npm run validate -- --strict`.');
