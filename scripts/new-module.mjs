#!/usr/bin/env node
/* global process, console */
// Module scaffolder — FR-AUTH-001 (SRS §7.1).
//
// Interactive:     npm run new:module
// Non-interactive: node scripts/new-module.mjs --subject maths --course alevel-pure \
//                    --id differentiation-1 --title "Differentiation I" \
//                    --description "…" --minutes 90 --prereqs "proof,algebraic-methods" \
//                    [--course-title "A-level Pure Mathematics"] [--level alevel] \
//                    [--root <content-root>]
//
// Generates: the module folder with a valid module.json, a starter
// 01-introduction.screens.json (docs/BRILLIANT_REWRITE_PLAN.md — one
// placeholder `predict` screen and one placeholder `tap-choice` screen), an
// assessment.json with two placeholder questions, and appends the ModuleRef
// to course.json (creating a valid course.json + subject folder if new).
// The output passes `node scripts/build-content.mjs` immediately.

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const SUBJECTS = ['maths', 'physics', 'cs', 'ai'];
const LEVELS = ['gcse', 'as', 'a2', 'alevel', 'foundation'];
const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const { values: flags } = parseArgs({
  options: {
    subject: { type: 'string' },
    course: { type: 'string' },
    'course-title': { type: 'string' },
    level: { type: 'string' },
    id: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string' },
    minutes: { type: 'string' },
    prereqs: { type: 'string' },
    root: { type: 'string' },
  },
});

function die(message) {
  console.error(`new-module: ${message}`);
  process.exit(1);
}

function assertId(value, what) {
  if (!ID_RE.test(value) || value.length > 64) {
    die(`${what} "${value}" is invalid — ids are lowercase kebab-case, ≤ 64 chars (§4.1)`);
  }
  return value;
}

function titleCase(id) {
  return id
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

async function collectAnswers() {
  const a = { ...flags };
  const missing = ['subject', 'course', 'id', 'title', 'description', 'minutes'].filter(
    (k) => !a[k],
  );
  if (missing.length > 0) {
    if (!process.stdin.isTTY) {
      die(`missing required flags in non-interactive mode: ${missing.map((m) => `--${m}`).join(' ')}`);
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ask = async (q, fallback) => (await rl.question(q)).trim() || fallback || '';
    a.subject ??= await ask(`Subject (${SUBJECTS.join('/')}): `);
    a.course ??= await ask('Course id (existing or new, kebab-case): ');
    const courseDir = path.join(resolveRoot(a), a.subject ?? '', a.course ?? '');
    if (a.course && !fs.existsSync(path.join(courseDir, 'course.json'))) {
      a['course-title'] ??= await ask(
        `New course title [${titleCase(a.course)}]: `,
        titleCase(a.course),
      );
      a.level ??= await ask(`New course level (${LEVELS.join('/')}) [alevel]: `, 'alevel');
    }
    a.id ??= await ask('Module id (kebab-case, globally unique): ');
    a.title ??= await ask(`Module title [${titleCase(a.id || 'new-module')}]: `, titleCase(a.id || 'new-module'));
    a.description ??= await ask('Module description (1–3 sentences): ');
    a.minutes ??= await ask('Estimated minutes [60]: ', '60');
    a.prereqs ??= await ask('Prerequisite module ids (comma-separated, empty for none): ');
    rl.close();
  }
  return a;
}

function resolveRoot(a) {
  return path.resolve(a.root ?? path.join(repoRoot, 'public', 'content'));
}

const answers = await collectAnswers();
const root = resolveRoot(answers);

const subject = answers.subject;
if (!SUBJECTS.includes(subject)) die(`subject must be one of ${SUBJECTS.join(', ')}`);
const courseId = assertId(answers.course, 'course id');
const moduleId = assertId(answers.id, 'module id');
const moduleTitle = answers.title || titleCase(moduleId);
const description = answers.description || `Covers ${moduleTitle}. (TODO: write a real description.)`;
const estMinutes = Number.parseInt(answers.minutes ?? '60', 10);
if (!Number.isInteger(estMinutes) || estMinutes <= 0) die('--minutes must be a positive integer');
const prerequisites = (answers.prereqs ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
  .map((p) => assertId(p, 'prerequisite id'));
const level = answers.level ?? 'alevel';
if (!LEVELS.includes(level)) die(`level must be one of ${LEVELS.join(', ')}`);

const courseDir = path.join(root, subject, courseId);
const courseFile = path.join(courseDir, 'course.json');
const moduleDir = path.join(courseDir, moduleId);

if (fs.existsSync(moduleDir)) die(`module folder already exists: ${moduleDir}`);

// --- course.json (create if new, else append the ModuleRef) -----------------
let course;
if (fs.existsSync(courseFile)) {
  course = JSON.parse(fs.readFileSync(courseFile, 'utf8'));
  if (course.modules.some((m) => m.id === moduleId)) {
    die(`course.json already references module id "${moduleId}"`);
  }
} else {
  course = {
    schemaVersion: 1,
    id: courseId,
    title: answers['course-title'] || titleCase(courseId),
    subject,
    level,
    description: `A course on ${answers['course-title'] || titleCase(courseId)}. (TODO: write a real description.)`,
    modules: [],
  };
}
course.modules.push({ id: moduleId, dir: moduleId });

// --- module.json -------------------------------------------------------------
const moduleJson = {
  schemaVersion: 1,
  id: moduleId,
  title: moduleTitle,
  description,
  estMinutes,
  prerequisites,
  objectives: [
    'TODO: state the first learner-facing outcome',
    'TODO: state the second learner-facing outcome',
  ],
  lessons: [
    {
      id: 'introduction',
      title: 'Introduction',
      file: '01-introduction.screens.json',
      kind: 'screens',
      estMinutes,
    },
  ],
  assessment: { file: 'assessment.json', passMark: 0.7 },
  version: '1.0.0',
  authors: ['TODO-your-name'],
};

// --- starter screen sequence (docs/BRILLIANT_REWRITE_PLAN.md, docs/SCREENS.md) ---
// JSON has no comment syntax, so (unlike the old Markdown template) this
// ships as two real, schema-valid placeholder screens rather than commented
// examples — replace their TODO text with a real prediction hook and a real
// checkpoint. See docs/SCREENS.md for the full screen-type reference.
const screenSequence = {
  schemaVersion: 1,
  id: 'introduction',
  title: 'Introduction',
  screens: [
    {
      type: 'predict',
      id: 'opening-prediction',
      prompt:
        'TODO: replace with a real prediction hook — a question the learner cannot yet confidently answer. Inline maths works like $f(x) = x^2$.',
      choices: ['TODO: option A', 'TODO: option B'],
      reveal: 'TODO: the mechanism/explanation that resolves the prediction, shown right after they commit.',
    },
    {
      type: 'tap-choice',
      id: 'first-checkpoint',
      prompt: 'TODO: replace with a real checkpoint question.',
      choices: [
        { text: 'TODO: correct option' },
        { text: 'TODO: wrong option', feedback: 'TODO: name the specific misconception this represents.' },
      ],
      correctIndex: 0,
    },
  ],
};

// --- assessment.json with two placeholder questions (mcq + numeric) ----------
const assessmentId = `${moduleId.slice(0, 64 - '-assessment'.length)}-assessment`;
const assessment = {
  schemaVersion: 1,
  id: assessmentId,
  title: `End of module: ${moduleTitle}`,
  questions: [
    {
      id: 'q1',
      type: 'mcq',
      text: 'Placeholder question — which option is correct? (Replace me.)',
      choices: ['This one', 'Not this one', 'Nor this one'],
      answer: 0,
      explanation: 'Placeholder explanation — every question must explain its answer (§4.6).',
    },
    {
      id: 'q2',
      type: 'numeric',
      text: 'Placeholder question — what is $2 + 2$? (Replace me.)',
      answer: 4,
      tolerance: 0,
      explanation: 'Placeholder explanation — $2 + 2 = 4$.',
    },
  ],
};

// --- write everything ---------------------------------------------------------
fs.mkdirSync(moduleDir, { recursive: true });
const writeJson = (file, data) => fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
writeJson(courseFile, course);
writeJson(path.join(moduleDir, 'module.json'), moduleJson);
writeJson(path.join(moduleDir, '01-introduction.screens.json'), screenSequence);
writeJson(path.join(moduleDir, 'assessment.json'), assessment);

const rel = (p) => path.relative(process.cwd(), p);
console.log(`new-module: created ${rel(moduleDir)}/`);
console.log(`  ${rel(courseFile)} ${course.modules.length === 1 ? '(new course)' : '(ModuleRef appended)'}`);
console.log(`  ${rel(path.join(moduleDir, 'module.json'))}`);
console.log(`  ${rel(path.join(moduleDir, '01-introduction.screens.json'))}`);
console.log(`  ${rel(path.join(moduleDir, 'assessment.json'))}`);
console.log('Next: edit the lesson (docs/SCREENS.md has the screen-type reference), then run `npm run validate` (add --strict for the MVC gate).');
