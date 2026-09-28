// @vitest-environment node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dirs: string[] = [];
afterAll(() => dirs.forEach((dir) => fs.rmSync(dir, { recursive: true, force: true })));
const fixture = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'learnlab-author-'));
  dirs.push(dir);
  fs.writeFileSync(
    path.join(dir, 'request.txt'),
    'Help adults investigate medieval trade using port records, without quizzes that pretend disputed interpretations have one correct answer.',
  );
  const brief = {
    schemaVersion: 1,
    title: 'Port detectives',
    subject: { id: 'economic-history', title: 'Economic history' },
    audience: 'Curious adults',
    level: 'University introductory',
    outcomes: ['Corroborate a trade claim'],
    prerequisites: [],
    scope: 'One port in one decade',
    excluded: ['A complete economic history'],
    curriculum: 'none',
    sources: [],
    playConcept: 'Compare manifests and investigate a missing shipment',
    decisions: [],
    assumptions: [],
    openQuestions: [],
    delegated: [],
  };
  const plan = {
    schemaVersion: 1,
    courseId: 'port-detectives',
    episodes: [
      {
        id: 'missing-ship',
        title: 'A missing shipment',
        estimatedMinutes: 8,
        outcomes: brief.outcomes,
        activity: 'Source comparison',
        assessment: 'Fresh manifests and causal claim',
        prerequisites: [],
        optionalExperiments: ['Inspect another record'],
        recovery: 'Exemplar and assisted exit',
      },
    ],
    traceability: [
      {
        outcome: brief.outcomes[0],
        episodes: ['missing-ship'],
        independentEvidence: 'Human-marked claim and corroboration',
        transfer: 'Different ship and year',
        criterion: 'Two supporting sources and one uncertainty',
      },
    ],
    researchDecisions: [
      {
        decision: 'Avoid automatic marking of a disputed claim',
        source: 'Pilot hypothesis',
        access: 'design-hypothesis',
        strength: 'Authoring requirement',
        limitations: 'Needs owner evaluation',
        validation: 'Review rubric',
      },
    ],
  };
  const save = (name: string, value: unknown) => {
    const file = path.join(dir, name);
    fs.writeFileSync(file, JSON.stringify(value));
    return file;
  };
  return { dir, run: path.join(dir, 'run'), brief, plan, save };
};
const cli = (...args: string[]) => {
  const result = spawnSync(
    process.execPath,
    [path.join(repo, 'scripts/author-course.mjs'), ...args],
    { cwd: repo, encoding: 'utf8', timeout: 10000 },
  );
  return { code: result.status, out: result.stdout, error: result.stderr };
};
const start = (f: ReturnType<typeof fixture>) =>
  cli(
    'start',
    '--run',
    f.run,
    '--request',
    path.join(f.dir, 'request.txt'),
    '--brief',
    f.save('input.json', f.brief),
  );

describe('authoring run contracts', () => {
  it('preserves a new non-enumerated subject and adult level, records a plan, and resumes it without reinterview', () => {
    const f = fixture();
    expect(start(f).code).toBe(0);
    const planned = cli('plan', '--run', f.run, '--file', f.save('plan.json', f.plan));
    expect(planned.code, planned.error).toBe(0);
    const status = cli('status', '--run', f.run);
    const output = JSON.parse(status.out);
    expect(output.stage).toBe('planned');
    expect(output.questions).toEqual([]);
    expect(output.manifest.plan.file).toBe('plan-0001.json');
    expect(fs.readFileSync(path.join(f.run, 'request.txt'), 'utf8')).toContain('medieval trade');
    expect(cli('start', '--run', f.run, '--request', path.join(f.dir, 'request.txt')).code).toBe(1);
    expect(cli('status', '--run', f.run).code).toBe(0);
  });

  it('asks context-bearing gaps and treats delegated choices as decisions still to be recorded', () => {
    const f = fixture();
    const partial = {
      schemaVersion: 1,
      title: 'Port detectives',
      audience: 'Curious adults',
      delegated: ['subject', 'outcomes'],
    };
    const result = cli(
      'start',
      '--run',
      f.run,
      '--request',
      path.join(f.dir, 'request.txt'),
      '--brief',
      f.save('partial.json', partial),
    );
    expect(result.code, result.error).toBe(0);
    const questions = JSON.parse(result.out).questions;
    expect(questions.some((q: { field: string }) => q.field === 'audience')).toBe(false);
    expect(questions.find((q: { field: string }) => q.field === 'subject').delegated).toBe(true);
    expect(questions.find((q: { field: string }) => q.field === 'outcomes').question).toContain(
      'Port detectives',
    );
    expect(cli('plan', '--run', f.run, '--file', f.save('plan.json', f.plan)).error).toContain(
      'Intake incomplete',
    );
  });

  it('rejects unknown, uncovered and incorrectly mapped outcomes and prerequisite cycles', () => {
    const f = fixture();
    start(f);
    const plan = structuredClone(f.plan);
    plan.episodes[0]!.prerequisites = ['missing-ship'];
    plan.traceability[0]!.outcome = 'Invented';
    plan.traceability[0]!.episodes = ['ghost'];
    const result = cli('plan', '--run', f.run, '--file', f.save('bad-plan.json', plan));
    expect(result.code).toBe(1);
    expect(result.error).toContain('cycle');
    expect(result.error).toContain('uncovered');
    expect(result.error).toContain('missing episode ghost');
    expect(JSON.parse(cli('status', '--run', f.run).out).manifest.plan).toBeNull();
  });

  it('retains brief/plan revisions and invalidates prior verification when the brief changes', () => {
    const f = fixture();
    start(f);
    cli('plan', '--run', f.run, '--file', f.save('plan.json', f.plan));
    const result = cli(
      'intake',
      '--run',
      f.run,
      '--brief',
      f.save('patch.json', { schemaVersion: 1, audience: 'Postgraduate historians' }),
    );
    expect(result.code, result.error).toBe(0);
    expect(fs.existsSync(path.join(f.run, 'brief-0001.json'))).toBe(true);
    expect(fs.existsSync(path.join(f.run, 'plan-0001.json'))).toBe(true);
    expect(JSON.parse(cli('status', '--run', f.run).out).manifest.plan).toBeNull();
    expect(JSON.parse(fs.readFileSync(path.join(f.run, 'brief.json'), 'utf8')).audience).toBe(
      'Postgraduate historians',
    );
  });

  it('preserves failure evidence, detects tampering, and never promotes artifact presence into a passed gate', () => {
    const f = fixture();
    start(f);
    const file = path.join(f.dir, 'failed-playthrough.txt');
    fs.writeFileSync(file, 'Keyboard interaction failed. No human enjoyment data collected.');
    const record = cli('record', '--run', f.run, '--kind', 'playthrough', '--file', file);
    expect(record.code, record.error).toBe(0);
    const status = JSON.parse(cli('status', '--run', f.run).out);
    expect(status.stage).toBe('ready-to-plan');
    expect(status.pending).toContain('owner walkthrough and revision');
    fs.appendFileSync(path.join(f.run, status.manifest.artifacts[0].file), 'modified');
    expect(cli('status', '--run', f.run).error).toContain('modified artifact');
  });

  it('rejects unsupported versions, empty outcomes and accidental contract fields', () => {
    for (const value of [
      { schemaVersion: 2 },
      { schemaVersion: 1, outcomes: [] },
      { schemaVersion: 1, telemetry: true },
    ]) {
      const f = fixture();
      const result = cli(
        'start',
        '--run',
        f.run,
        '--request',
        path.join(f.dir, 'request.txt'),
        '--brief',
        f.save('bad-brief.json', value),
      );
      expect(result.code).toBe(1);
      expect(fs.existsSync(f.run)).toBe(false);
    }
  });

  it('scaffolds a new subject through a retained plan and rejects placeholder content', () => {
    const f = fixture();
    expect(start(f).code).toBe(0);
    expect(cli('plan', '--run', f.run, '--file', f.save('plan.json', f.plan)).code).toBe(0);
    const output = path.join(f.dir, 'draft');
    const result = cli('scaffold', '--run', f.run, '--output', output);
    expect(result.code, result.error).toBe(0);
    const pack = JSON.parse(fs.readFileSync(path.join(output, 'pack.json'), 'utf8'));
    expect(pack.subject.id).toBe('economic-history');
    expect(pack.level).toBe('University introductory');
    expect(cli('validate-pack', '--file', path.join(output, 'pack.json')).code).toBe(1);
    expect(cli('scaffold', '--run', f.run, '--output', output).error).toContain('already exists');
    expect(
      JSON.parse(fs.readFileSync(path.join(f.run, 'manifest.json'), 'utf8')).history.at(-1).kind,
    ).toBe('scaffold-created');
  });
  it('derives capability identifiers from actual v1 schemas and v2 activity contracts', () => {
    const result = cli('capabilities');
    expect(result.code, result.error).toBe(0);
    const output = JSON.parse(result.out);
    expect(output.v1.screens).toContain('tap-choice');
    expect(output.v1.screens).not.toContain('tapChoice');
    expect(output.v1.widgets).toContain('circuit-sim');
    expect(Object.keys(output.v2.activities)).toEqual(['choice', 'circuit', 'meter-probe']);
    expect(output.v2.activities.circuit.schemaDef).toBe('circuit');
    expect(output.v2.activities['meter-probe'].schemaDef).toBe('meterProbe');
  });
});
