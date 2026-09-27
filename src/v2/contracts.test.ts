import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { parseLaboratoryPack, ACTIVITY_CONTRACTS } from './pack';
import { appendEvent, newRun, parseRun, projectRun, restoreRun, retainedExposure } from './run';
import type { RunInput } from './run';
const fixture = () =>
  parseLaboratoryPack(
    JSON.parse(readFileSync('public/laboratory/research-station/pack.json', 'utf8')),
  );
const session = () => {
  const pack = fixture();
  const episode = pack.episodes[0]!;
  let run = newRun(pack, episode);
  let at = run.startedAt;
  const send = (event: RunInput) => {
    run = appendEvent(pack, episode, run, { ...event, at: ++at });
  };
  const current = () => projectRun(pack, episode, run).current!;
  const advance = () => send({ type: 'advance', node: current(), outcome: 'passed' });
  const toTransfer = () => {
    send({ type: 'control', node: current(), id: 'supply-link', value: true });
    send({ type: 'control', node: current(), id: 'return-link', value: true });
    advance();
    send({ type: 'answer', node: current(), option: 'zero' });
    advance();
    send({ type: 'control', node: current(), id: 'return-link', value: false });
    advance();
  };
  return {
    pack,
    episode,
    send,
    current,
    advance,
    toTransfer,
    get run() {
      return run;
    },
  };
};
describe('laboratory content boundary', () => {
  it('validates the actual scaffolded first episode and keeps the generated schema current', () => {
    expect(fixture().episodes[0]!.nodes).toHaveLength(5);
    execFileSync(process.execPath, ['scripts/build-laboratory-contracts.mjs', '--check']);
    const schema = JSON.parse(readFileSync('schemas/laboratory-pack.schema.json', 'utf8'));
    for (const [key, contract] of Object.entries(ACTIVITY_CONTRACTS))
      expect(schema.$defs[contract.schemaDef].properties.type.const).toBe(key);
  });
  it('rejects orphan scenes, cycles and missing destinations', () => {
    const orphan = fixture();
    orphan.episodes[0]!.nodes.push({ ...orphan.episodes[0]!.nodes[0]!, id: 'orphan' });
    expect(() => parseLaboratoryPack(orphan)).toThrow('orphan');
    for (const next of ['first-action', 'missing']) {
      const pack = fixture();
      pack.episodes[0]!.nodes[0]!.transitions.passed = next;
      expect(() => parseLaboratoryPack(pack)).toThrow(next === 'missing' ? 'missing' : 'cycle');
    }
  });
  it('rejects unknown props/capabilities, invalid choice answers, unreachable models and unsafe assets', () => {
    const unknown = fixture();
    Object.assign(unknown.episodes[0]!.nodes[0]!.activity, { evaluate: 'code' });
    expect(() => parseLaboratoryPack(unknown)).toThrow('additional');
    const capability = fixture();
    capability.capabilities.circuit = '1.0.0';
    expect(() => parseLaboratoryPack(capability)).toThrow('Unsupported');
    const invalidChoice = fixture();
    const choice = invalidChoice.episodes[0]!.nodes[1]!.activity;
    if (choice.type === 'choice') choice.options[1]!.correct = true;
    expect(() => parseLaboratoryPack(invalidChoice)).toThrow('exactly one');
    const unreachable = fixture();
    const circuit = unreachable.episodes[0]!.nodes[0]!.activity;
    if (circuit.type === 'circuit') circuit.solution.voltage = 9;
    expect(() => parseLaboratoryPack(unreachable)).toThrow('unavailable');
    const unsafe = fixture();
    unsafe.assets.push({ path: '../escape.svg', attribution: 'Test' });
    expect(() => parseLaboratoryPack(unsafe)).toThrow();
  });
  it('does not admit a goal satisfied by an indeterminate reading', () => {
    const pack = fixture();
    const circuit = pack.episodes[0]!.nodes[0]!.activity;
    if (circuit.type === 'circuit') {
      circuit.solution = circuit.initial;
      circuit.goals = [{ reading: 'supply-link', quantity: 'voltage', min: 0, max: 24 }];
    }
    expect(() => parseLaboratoryPack(pack)).toThrow('satisfying');
  });
});
describe('local event replay and evidence', () => {
  it('replays a complete independent path and retains working control state', () => {
    const s = session();
    s.toTransfer();
    s.send({ type: 'answer', node: s.current(), option: 'zero' });
    s.advance();
    s.send({ type: 'answer', node: s.current(), option: 'energy' });
    s.advance();
    const parsed = parseRun(JSON.parse(JSON.stringify(s.run)), s.pack, s.episode);
    const p = projectRun(s.pack, s.episode, parsed);
    expect(p.current).toBeNull();
    expect(p.evidence.filter((e) => e.independent)).toHaveLength(2);
    expect(p.memory['first-action']!.actions).toBe(2);
  });
  it('assisted exits cannot award independence or strand the learner', () => {
    const s = session();
    for (const node of s.episode.nodes)
      s.send({ type: 'advance', node: node.id, outcome: 'assisted' });
    const p = projectRun(s.pack, s.episode, s.run);
    expect(p.current).toBeNull();
    expect(p.evidence.every((e) => !e.independent)).toBe(true);
  });
  it('wrong attempts, hints and worked examples remain distinct from fresh independent checks', () => {
    for (const assistance of ['wrong', 'hint', 'worked'] as const) {
      const s = session();
      s.toTransfer();
      if (assistance === 'wrong') s.send({ type: 'answer', node: s.current(), option: 'same' });
      else s.send({ type: assistance, node: s.current() });
      s.send({ type: 'answer', node: s.current(), option: 'zero' });
      s.advance();
      expect(projectRun(s.pack, s.episode, s.run).evidence.at(-1)!.independent).toBe(false);
    }
  });
  it('restart retains exposure even when an answer/hint was used before advancing', () => {
    for (const exposed of ['answer', 'hint'] as const) {
      const s = session();
      s.toTransfer();
      if (exposed === 'answer') s.send({ type: 'answer', node: s.current(), option: 'zero' });
      else s.send({ type: 'hint', node: s.current() });
      s.send({ type: 'restart', node: s.episode.start });
      s.toTransfer();
      s.send({ type: 'answer', node: s.current(), option: 'zero' });
      s.advance();
      const evidence = projectRun(s.pack, s.episode, s.run).evidence.at(-1)!;
      expect(evidence.replayed).toBe(true);
      expect(evidence.independent).toBe(false);
    }
  });
  it('keeps ordinary constructor ids safe and replay deterministic', () => {
    const pack = fixture();
    const episode = pack.episodes[0]!;
    const transfer = episode.nodes.find((n) => n.id === 'fresh-fault')!;
    transfer.id = 'constructor';
    episode.nodes.find((n) => n.id === 'break-test')!.transitions = {
      passed: 'constructor',
      assisted: 'constructor',
    };
    parseLaboratoryPack(pack);
    let run = newRun(pack, episode);
    let at = run.startedAt;
    for (const id of ['first-action', 'predict-break', 'break-test'])
      run = appendEvent(pack, episode, run, {
        type: 'advance',
        node: id,
        outcome: 'assisted',
        at: ++at,
      });
    run = appendEvent(pack, episode, run, {
      type: 'answer',
      node: 'constructor',
      option: 'zero',
      at: ++at,
    });
    run = appendEvent(pack, episode, run, {
      type: 'advance',
      node: 'constructor',
      outcome: 'passed',
      at: ++at,
    });
    expect(projectRun(pack, episode, run)).toEqual(projectRun(pack, episode, run));
    expect(projectRun(pack, episode, run).evidence.at(-1)!.attempts).toBe(1);
    expect(Object.hasOwn(Object, 'selected')).toBe(false);
    const circuit = episode.nodes[0]!.activity;
    if (circuit.type === 'circuit') {
      circuit.initial.circuit = { type: 'resistor', id: 'constructor', ohms: 6 };
      circuit.solution = circuit.initial;
      circuit.controls = [{ id: 'constructor', values: [6, 3] }];
      circuit.labels = {};
    }
    expect(() => parseLaboratoryPack(pack)).toThrow('labels');
  });
  it('restoring an earlier export retains later local answer/help exposure', () => {
    const s = session();
    const earlier = structuredClone(s.run);
    s.toTransfer();
    s.send({ type: 'worked', node: s.current() });
    const restored = restoreRun(earlier, s.run, s.pack, s.episode);
    expect(restored.priorExposure).toContain('fresh-fault');
    let run = restored;
    let at = Math.max(Date.now(), run.startedAt);
    for (const node of ['first-action', 'predict-break', 'break-test'])
      run = appendEvent(s.pack, s.episode, run, {
        type: 'advance',
        node,
        outcome: 'assisted',
        at: ++at,
      });
    run = appendEvent(s.pack, s.episode, run, {
      type: 'answer',
      node: 'fresh-fault',
      option: 'zero',
      at: ++at,
    });
    run = appendEvent(s.pack, s.episode, run, {
      type: 'advance',
      node: 'fresh-fault',
      outcome: 'passed',
      at: ++at,
    });
    expect(projectRun(s.pack, s.episode, run).evidence.at(-1)!.independent).toBe(false);
  });
  it('can archive a full notebook into a fresh workspace without losing prior exposure', () => {
    const s = session();
    const run = {
      ...s.run,
      events: Array.from({ length: 2000 }, () => ({
        type: 'time' as const,
        node: s.episode.start,
        at: s.run.startedAt,
        ms: 0,
      })),
    };
    expect(() => parseRun(run, s.pack, s.episode)).not.toThrow();
    expect(() =>
      appendEvent(s.pack, s.episode, run, {
        type: 'restart',
        node: s.episode.start,
        at: run.startedAt,
      }),
    ).toThrow('limit');
    const fresh = newRun(
      s.pack,
      s.episode,
      retainedExposure({ ...run, priorExposure: ['fresh-fault'] }, s.episode),
    );
    expect(fresh.events).toHaveLength(0);
    expect(fresh.priorExposure).toContain('fresh-fault');
    expect(() => parseRun(fresh, s.pack, s.episode)).not.toThrow();
  });
  it('bounds aggregate timing by event intervals, without certifying imported human observation', () => {
    const s = session();
    const at = s.run.startedAt + 15000;
    const first = appendEvent(s.pack, s.episode, s.run, {
      type: 'time',
      node: s.current(),
      at,
      ms: 15000,
    });
    expect(() =>
      appendEvent(s.pack, s.episode, first, { type: 'time', node: s.current(), at, ms: 15000 }),
    ).toThrow('active-time');
    expect(projectRun(s.pack, s.episode, first).activeMs).toBe(15000);
  });
  it('rejects forged passes, unavailable controls, version mismatches and oversized time credits', () => {
    const s = session();
    expect(() => s.advance()).toThrow('supporting interaction');
    expect(() =>
      s.send({ type: 'control', node: s.current(), id: 'supply-link', value: 3 }),
    ).toThrow('unavailable');
    expect(() => parseRun({ ...s.run, stateVersion: 2 }, s.pack, s.episode)).toThrow('version');
    expect(() => s.send({ type: 'time', node: s.current(), ms: 100000 })).toThrow('active-time');
    expect(() => parseRun({ ...s.run, evidence: 'independent' }, s.pack, s.episode)).toThrow(
      'fields',
    );
  });
});
