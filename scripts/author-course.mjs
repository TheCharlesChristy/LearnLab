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
import {
  ACTIVITY_CONTRACTS,
  LABORATORY_CAPABILITIES,
  parseLaboratoryPack,
} from '../src/v2/pack.ts';
import { createPreviewRun, parseAuthorPreview, previewPack } from '../src/v2/author-preview.ts';
import { projectRun } from '../src/v2/run.ts';
import { briefSchema, planSchema, planningErrors, questionsFor } from './authoring/contracts.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    run: { type: 'string' },
    output: { type: 'string' },
    episode: { type: 'string' },
    node: { type: 'string' },
    seed: { type: 'string' },
    hints: { type: 'string' },
    worked: { type: 'boolean' },
    branch: { type: 'string' },
    replace: { type: 'boolean' },
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
          v2: {
            status: 'laboratory-contracts',
            capabilities: LABORATORY_CAPABILITIES,
            activities: ACTIVITY_CONTRACTS,
          },
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
  } else if (command === 'scaffold') {
    const { dir, manifest, brief } = loadRun();
    if (!manifest.plan) throw new Error('A verified current plan is required before scaffolding.');
    const plan = read(path.join(dir, manifest.plan.file));
    if (hash(fs.readFileSync(path.join(dir, manifest.plan.file))) !== manifest.plan.sha256)
      throw new Error('Plan was modified outside the harness.');
    const episodes = values.episode
      ? plan.episodes.filter((v) => v.id === values.episode)
      : plan.episodes;
    if (!episodes.length) throw new Error('Unknown planned episode.');
    const output = path.resolve(need('output'));
    if (fs.existsSync(output))
      throw new Error('Scaffold output already exists; nothing was overwritten.');
    const skills = brief.outcomes.map((title, i) => ({
      id: `capability-${i + 1}`,
      title,
      criterion: plan.traceability.find((v) => v.outcome === title).criterion,
      prerequisites: [],
    }));
    const pack = {
      formatVersion: 1,
      version: 1,
      stateVersion: 1,
      id: plan.courseId,
      title: brief.title,
      description: brief.playConcept,
      audience: brief.audience,
      level: brief.level,
      subject: brief.subject,
      capabilities: { 'experience-graph': '0.1.1', 'activity-plugin': '0.1.0', choice: '0.1.0' },
      skills: skills.filter((s) => episodes.some((e) => e.outcomes.includes(s.title))),
      episodes: episodes.map((e) => ({
        id: e.id,
        title: e.title,
        estimatedMinutes: e.estimatedMinutes,
        skills: skills.filter((s) => e.outcomes.includes(s.title)).map((s) => s.id),
        prerequisites: e.prerequisites.filter((id) => episodes.some((v) => v.id === id)),
        start: 'first-action',
        nodes: [],
      })),
      references: [],
      assets: [],
      scopeNote:
        episodes.length === plan.episodes.length
          ? brief.scope
          : `Partial first-episode prototype: ${episodes.length} of ${plan.episodes.length} planned episodes. ${brief.scope}`,
    };
    fs.mkdirSync(output, { recursive: true });
    write(path.join(output, 'pack.json'), pack);
    const filename = `artifacts/${String(manifest.artifacts.length + 1).padStart(4, '0')}-scaffold.json`;
    write(path.join(dir, filename), pack);
    manifest.artifacts.push({
      kind: 'content',
      file: filename,
      sha256: hash(fs.readFileSync(path.join(dir, filename))),
      note: `Actual draft scaffold at ${path.relative(repo, output)}; incomplete nodes/references deliberately fail validation.`,
      at: new Date().toISOString(),
      revision: revision(),
      briefHash: manifest.briefHash,
      planHash: manifest.plan.sha256,
    });
    manifest.history.push({
      kind: 'scaffold-created',
      at: new Date().toISOString(),
      output: path.relative(repo, output),
    });
    update(dir, manifest);
    console.log(
      JSON.stringify(
        {
          stage: 'scaffolded-draft',
          output,
          episodes: episodes.length,
          note: 'Empty scenes and references must be authored. This scaffold is not a valid playable course.',
        },
        null,
        2,
      ),
    );
  } else if (command === 'preview') {
    const pack = parseLaboratoryPack(read(path.resolve(need('file'))));
    const episode =
      pack.episodes.find((v) => v.id === values.episode) ??
      (values.episode ? undefined : pack.episodes[0]);
    if (!episode) throw new Error('Unknown preview episode');
    const fixture = parseAuthorPreview({
      formatVersion: 1,
      kind: 'learnlab-author-preview',
      pack,
      episodeId: episode.id,
      nodeId: values.node ?? episode.start,
      branchPreference: values.branch ?? 'passed',
      seed: Number(values.seed ?? 93027),
      hints: Number(values.hints ?? 0),
      worked: values.worked ?? false,
    });
    fixture.session = createPreviewRun(fixture);
    const output = path.resolve(need('output'));
    fs.mkdirSync(path.dirname(output), { recursive: true });
    write(output, parseAuthorPreview(fixture));
    console.log(
      JSON.stringify(
        {
          preview: values.output,
          route: '#/author-studio',
          note: 'Import into a local VITE_AUTHOR_STUDIO=true build. Synthetic state cannot award learner independence. Record this fixture in the retained run.',
        },
        null,
        2,
      ),
    );
  } else if (command === 'inspect') {
    const fixture = parseAuthorPreview(read(path.resolve(need('file'))));
    const pack = previewPack(fixture.pack, fixture.seed);
    const episode = pack.episodes.find((v) => v.id === fixture.episodeId);
    const run = createPreviewRun(fixture);
    const projection = projectRun(pack, episode, run);
    console.log(
      JSON.stringify(
        {
          kind: fixture.kind,
          episode: episode.id,
          current: projection.current,
          seed: fixture.seed,
          branches: episode.nodes.map((v) => ({
            id: v.id,
            type: v.activity.type,
            role: v.role,
            transitions: v.transitions,
          })),
          memory: projection.memory,
          evidence: projection.evidence,
          events: run.events,
          note: 'Author-generated preview only; no observed learner performance.',
        },
        null,
        2,
      ),
    );
  } else if (command === 'validate-pack') {
    const filename = path.resolve(need('file'));
    const pack = parseLaboratoryPack(read(filename));
    const root = fs.realpathSync(path.dirname(filename));
    for (const asset of pack.assets) {
      const target = fs.realpathSync(path.resolve(root, asset.path));
      if (!target.startsWith(`${root}${path.sep}`) || !fs.statSync(target).isFile())
        throw new Error(`Missing or escaped asset ${asset.path}`);
    }
    const listed = new Set([path.basename(filename), ...pack.assets.map((a) => a.path)]);
    const walk = (folder) => {
      for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
        const target = path.join(folder, entry.name);
        if (entry.isDirectory()) walk(target);
        else if (!listed.has(path.relative(root, target).split(path.sep).join('/')))
          throw new Error(`Orphan/unlisted pack file ${path.relative(root, target)}`);
      }
    };
    walk(root);
    let planned;
    if (values.run) {
      const { dir, manifest } = loadRun();
      if (!manifest.plan) throw new Error('Current plan is required.');
      const plan = read(path.join(dir, manifest.plan.file));
      if (
        plan.courseId !== pack.id ||
        pack.episodes.some((e) => !plan.episodes.some((v) => v.id === e.id))
      )
        throw new Error('Pack identity or episodes disagree with the retained plan.');
      planned = {
        authored: pack.episodes.length,
        total: plan.episodes.length,
        remaining: plan.episodes
          .filter((e) => !pack.episodes.some((v) => v.id === e.id))
          .map((e) => e.id),
      };
    }
    console.log(
      JSON.stringify(
        {
          valid: true,
          pack: pack.id,
          version: pack.version,
          episodes: pack.episodes.length,
          scenes: pack.episodes.reduce((n, e) => n + e.nodes.length, 0),
          planned,
          note: 'Schema, DAG, registered activities, bounded model witnesses and asset closure passed. Playthrough and learning/source accuracy are separate gates.',
        },
        null,
        2,
      ),
    );
  } else if (command === 'stage-pack') {
    const { dir, manifest } = loadRun();
    if (!manifest.plan) throw new Error('A verified current plan is required.');
    const filename = path.resolve(need('file'));
    const pack = parseLaboratoryPack(read(filename));
    const plan = read(path.join(dir, manifest.plan.file));
    if (
      pack.id !== plan.courseId ||
      pack.episodes.some((e) => !plan.episodes.some((v) => v.id === e.id))
    )
      throw new Error('Pack does not match the retained plan.');
    const root = fs.realpathSync(path.dirname(filename));
    const target = path.join(repo, 'public/laboratory', pack.id);
    if (fs.existsSync(target) && !values.replace)
      throw new Error('Local preview pack exists; use --replace for an intentional revision.');
    if (fs.existsSync(path.join(target, 'pack.json'))) {
      const previous = read(path.join(target, 'pack.json'));
      if (JSON.stringify(previous) !== JSON.stringify(pack) && pack.version <= previous.version)
        throw new Error(
          'Changed staged content must increment pack.version; saved work must not be silently reinterpreted.',
        );
    }
    const assets = pack.assets.map((asset) => {
      const file = fs.realpathSync(path.join(root, asset.path));
      if (!file.startsWith(`${root}${path.sep}`) || !fs.statSync(file).isFile())
        throw new Error(`Unsafe asset ${asset.path}`);
      return { path: asset.path, bytes: fs.readFileSync(file) };
    });
    // Validate and read every source before modifying the local preview directory.
    fs.mkdirSync(target, { recursive: true });
    fs.writeFileSync(path.join(target, 'pack.json'), `${JSON.stringify(pack, null, 2)}\n`);
    for (const asset of assets) {
      const destination = path.join(target, asset.path);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.writeFileSync(destination, asset.bytes);
    }
    const snapshot = `artifacts/${String(manifest.artifacts.length + 1).padStart(4, '0')}-pack.json`;
    write(path.join(dir, snapshot), pack);
    manifest.artifacts.push({
      kind: 'content',
      file: snapshot,
      sha256: hash(fs.readFileSync(path.join(dir, snapshot))),
      note: `Staged local preview at public/laboratory/${pack.id}; no merge or deployment.`,
      at: new Date().toISOString(),
      revision: revision(),
      briefHash: manifest.briefHash,
      planHash: manifest.plan.sha256,
    });
    update(dir, manifest);
    console.log(
      JSON.stringify(
        {
          staged: path.relative(repo, target),
          route: `#/laboratory/${pack.id}/${pack.episodes[0].id}`,
          note: 'Local source staging only. Browser playthrough and delivery checks remain required.',
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
            'complete agreed course outcomes and verify answers',
            'rendered course playthrough',
            'owner walkthrough and revision',
          ],
          note: 'Run integrity does not certify a complete course, rendered playthrough or successful owner evaluation.',
        },
        null,
        2,
      ),
    );
  } else if (command === 'schemas') {
    console.log(
      JSON.stringify(
        {
          brief: briefSchema,
          plan: planSchema,
          laboratoryPack: read(path.join(repo, 'schemas/laboratory-pack.schema.json')),
          authorPreview: read(path.join(repo, 'schemas/author-preview.schema.json')),
          activities: ACTIVITY_CONTRACTS,
        },
        null,
        2,
      ),
    );
  } else {
    throw new Error(
      'Usage: node scripts/author-course.mjs start|intake|plan|scaffold|validate-pack|stage-pack|preview|inspect|record|status|capabilities|schemas [--run directory] [--request text-file] [--brief json-file] [--file artifact] [--kind kind] [--note text]',
    );
  }
} catch (error) {
  console.error(`author-course: ${error.message}`);
  process.exitCode = 1;
}
