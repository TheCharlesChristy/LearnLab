#!/usr/bin/env node
/* global process, console */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { execFileSync } from 'node:child_process';
import Ajv2020 from 'ajv/dist/2020.js';
import { briefSchema, planSchema, planningErrors, questionsFor } from './authoring/contracts.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    run: { type: 'string' },
    request: { type: 'string' },
    brief: { type: 'string' },
    file: { type: 'string' },
    kind: { type: 'string' },
    note: { type: 'string' },
  },
});
const command = positionals[0];
const ajv = new Ajv2020({ allErrors: true });
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const write = (file, value) =>
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const revision = () =>
  execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim();
const validate = (schema, data, label) => {
  const check = ajv.compile(schema);
  if (!check(data))
    throw new Error(`${label}: ${ajv.errorsText(check.errors, { separator: '\n' })}`);
};
const need = (key) => {
  if (!values[key]) throw new Error(`--${key} is required`);
  return values[key];
};
const runDir = () => path.resolve(need('run'));
const loadRun = () => {
  const dir = runDir();
  const manifest = read(path.join(dir, 'manifest.json'));
  if (manifest.schemaVersion !== 1 || manifest.tool !== 'learnlab-author')
    throw new Error('Unsupported run manifest. Original files were preserved.');
  const brief = read(path.join(dir, 'brief.json'));
  validate(briefSchema, brief, 'brief');
  if (hash(fs.readFileSync(path.join(dir, 'brief.json'))) !== manifest.briefHash)
    throw new Error('Brief changed outside the harness; use intake --brief to record a revision.');
  return { dir, manifest, brief };
};
const update = (dir, manifest) => {
  const file = path.join(dir, 'manifest.json');
  const temp = `${file}.tmp`;
  write(temp, manifest);
  fs.renameSync(temp, file);
};
const saveRevision = (dir, name, data) => {
  const file = path.join(dir, name);
  write(file, data);
  return hash(fs.readFileSync(file));
};
const assertComplete = (brief, request) => {
  const missing = questionsFor(brief, request);
  if (missing.length || brief.openQuestions?.length)
    throw new Error(
      `Intake incomplete: ${missing
        .map((q) => q.field)
        .concat(brief.openQuestions ?? [])
        .join(', ')}. Delegation authorises the agent to decide; it is not an answer.`,
    );
};

try {
  if (command === 'capabilities') {
    const screenSchema = read(path.join(repo, 'schemas/screen-sequence.schema.json'));
    const screens = screenSchema.$defs.screen.oneOf.map(
      (s) => screenSchema.$defs[s.$ref.split('/').at(-1)].properties.type.const,
    );
    console.log(
      JSON.stringify(
        {
          schemaVersion: 1,
          revision: revision(),
          v1: {
            widgets: read(path.join(repo, 'src/widgets/keys.json')),
            screens,
            questions: read(path.join(repo, 'schemas/quiz.schema.json')).$defs.question.oneOf.map(
              (s) => s.$ref.split('/').at(-1),
            ),
          },
          v2: { status: 'rollout-boundary-only', activities: [] },
          note: 'Discovery describes shipped registries, not planned capabilities. See docs/WIDGETS.md and docs/SCREENS.md for v1 props.',
        },
        null,
        2,
      ),
    );
  } else if (command === 'start') {
    const dir = runDir();
    if (fs.existsSync(dir))
      throw new Error(
        'Run directory already exists; resume with status or intake. Nothing was overwritten.',
      );
    const request = fs.readFileSync(path.resolve(need('request')), 'utf8');
    if (!request.trim() || Buffer.byteLength(request) > 1024 * 1024)
      throw new Error('Request must be nonempty and at most 1 MiB.');
    const brief = values.brief ? read(values.brief) : { schemaVersion: 1 };
    validate(briefSchema, brief, 'brief');
    fs.mkdirSync(dir, { recursive: true });
    fs.mkdirSync(path.join(dir, 'artifacts'));
    fs.writeFileSync(path.join(dir, 'request.txt'), request, { flag: 'wx' });
    const briefHash = saveRevision(dir, 'brief.json', brief);
    saveRevision(dir, 'brief-0001.json', brief);
    write(path.join(dir, 'manifest.json'), {
      schemaVersion: 1,
      tool: 'learnlab-author',
      startedAt: new Date().toISOString(),
      revision: revision(),
      requestHash: hash(request),
      briefHash,
      briefRevision: 1,
      plan: null,
      artifacts: [],
      history: [{ kind: 'started', at: new Date().toISOString() }],
    });
    console.log(
      JSON.stringify(
        { run: dir, stage: 'intake', questions: questionsFor(brief, request) },
        null,
        2,
      ),
    );
  } else if (command === 'intake') {
    const { dir, manifest, brief } = loadRun();
    const patch = read(need('brief'));
    validate(briefSchema, patch, 'brief patch');
    const next = { ...brief, ...patch };
    validate(briefSchema, next, 'brief');
    const n = manifest.briefRevision + 1;
    const briefHash = saveRevision(dir, `brief-${String(n).padStart(4, '0')}.json`, next);
    // Atomic replacement of the current brief, with its earlier revision retained.
    write(path.join(dir, 'brief.json.tmp'), next);
    fs.renameSync(path.join(dir, 'brief.json.tmp'), path.join(dir, 'brief.json'));
    manifest.briefHash = briefHash;
    manifest.briefRevision = n;
    manifest.plan = null; // Any changed brief invalidates a previous plan's completeness claim.
    manifest.history.push({
      kind: 'intake-revised',
      at: new Date().toISOString(),
      briefRevision: n,
    });
    update(dir, manifest);
    console.log(
      JSON.stringify(
        {
          questions: questionsFor(next, fs.readFileSync(path.join(dir, 'request.txt'), 'utf8')),
          openQuestions: next.openQuestions ?? [],
        },
        null,
        2,
      ),
    );
  } else if (command === 'plan') {
    const { dir, manifest, brief } = loadRun();
    assertComplete(brief, fs.readFileSync(path.join(dir, 'request.txt'), 'utf8'));
    const plan = read(need('file'));
    validate(planSchema, plan, 'plan');
    const errors = planningErrors(brief, plan);
    if (errors.length) throw new Error(errors.join('\n'));
    const name = `plan-${String(manifest.history.filter((h) => h.kind === 'plan-verified').length + 1).padStart(4, '0')}.json`;
    const sha256 = saveRevision(dir, name, plan);
    manifest.plan = { file: name, sha256, briefHash: manifest.briefHash };
    manifest.history.push({ kind: 'plan-verified', at: new Date().toISOString(), file: name });
    update(dir, manifest);
    console.log(
      JSON.stringify(
        {
          stage: 'planned',
          episodes: plan.episodes.length,
          outcomes: plan.traceability.length,
          note: 'Structural checks passed. Source accuracy, rendered playthrough, learning, and enjoyment have not been verified.',
        },
        null,
        2,
      ),
    );
  } else if (command === 'record') {
    const { dir, manifest } = loadRun();
    const kind = need('kind');
    if (
      ![
        'research',
        'content',
        'check',
        'playthrough',
        'critique',
        'owner-feedback',
        'revision',
        'delivery',
      ].includes(kind)
    )
      throw new Error('Unknown artifact kind');
    const source = path.resolve(need('file'));
    const bytes = fs.readFileSync(source);
    if (bytes.length > 16 * 1024 * 1024)
      throw new Error('Artifact exceeds 16 MiB; split large recordings.');
    const basename = path.basename(source);
    const filename = `artifacts/${String(manifest.artifacts.length + 1).padStart(4, '0')}-${basename}`;
    fs.writeFileSync(path.join(dir, filename), bytes, { flag: 'wx' });
    manifest.artifacts.push({
      kind,
      file: filename,
      sha256: hash(bytes),
      note: values.note ?? '',
      at: new Date().toISOString(),
      revision: revision(),
      briefHash: manifest.briefHash,
      planHash: manifest.plan?.sha256 ?? null,
    });
    update(dir, manifest);
    console.log(
      JSON.stringify({
        recorded: filename,
        kind,
        note: 'Recording an artifact preserves evidence; it does not certify that the artifact proves a gate.',
      }),
    );
  } else if (command === 'status') {
    const { dir, manifest, brief } = loadRun();
    const errors = [];
    if (hash(fs.readFileSync(path.join(dir, 'request.txt'))) !== manifest.requestHash)
      errors.push('request.txt hash mismatch');
    for (const item of [...manifest.artifacts, ...(manifest.plan ? [manifest.plan] : [])]) {
      const filename = path.resolve(dir, item.file);
      if (!filename.startsWith(`${dir}${path.sep}`)) {
        errors.push('manifest contains a path outside this run');
        continue;
      }
      if (!fs.existsSync(filename) || hash(fs.readFileSync(filename)) !== item.sha256)
        errors.push(`${item.file}: missing or modified artifact`);
    }
    if (errors.length) throw new Error(errors.join('\n'));
    const questions = questionsFor(brief, fs.readFileSync(path.join(dir, 'request.txt'), 'utf8'));
    console.log(
      JSON.stringify(
        {
          stage:
            questions.length || brief.openQuestions?.length
              ? 'intake'
              : manifest.plan
                ? 'planned'
                : 'ready-to-plan',
          questions,
          openQuestions: brief.openQuestions ?? [],
          manifest,
          pending: [
            'course scaffold and runtime validation',
            'rendered course playthrough',
            'owner walkthrough and revision',
          ],
          note: 'This foundation intentionally cannot claim a complete course or successful owner evaluation.',
        },
        null,
        2,
      ),
    );
  } else if (command === 'schemas') {
    console.log(JSON.stringify({ brief: briefSchema, plan: planSchema }, null, 2));
  } else {
    throw new Error(
      'Usage: node scripts/author-course.mjs start|intake|plan|record|status|capabilities|schemas [--run directory] [--request text-file] [--brief json-file] [--file artifact] [--kind kind] [--note text]',
    );
  }
} catch (error) {
  console.error(`author-course: ${error.message}`);
  process.exitCode = 1;
}
