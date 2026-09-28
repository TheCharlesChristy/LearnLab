import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createPreviewRun } from './author-preview';
import { informativeProbeIds, meterReading } from './meter-probe';
import { parseLaboratoryPack } from './pack';
import { appendEvent, newRun, nodePassed, projectRun } from './run';

const fixture = () =>
  parseLaboratoryPack(
    JSON.parse(readFileSync('public/laboratory/research-station/pack.json', 'utf8')),
  );
const scenario = () => {
  const pack = fixture();
  const episode = pack.episodes.find((item) => item.id === 'meter-detective')!;
  const node = episode.nodes[0]!;
  if (node.activity.type !== 'meter-probe') throw new Error('Expected meter scene');
  return { pack, episode, node, activity: node.activity };
};

describe('meter-probe contract and replay', () => {
  it('matches hand-derived branch and source readings for both fault panels', () => {
    const { activity } = scenario();
    expect(meterReading(activity, 'intact', 'supply-current')).toBe(2);
    expect(meterReading(activity, 'broken', 'supply-current')).toBe(1);
    expect(meterReading(activity, 'intact', 'backup-current')).toBe(1);
    expect(meterReading(activity, 'broken', 'backup-current')).toBe(0);
    expect(meterReading(activity, 'intact', 'main-current')).toBe(1);
    expect(meterReading(activity, 'broken', 'main-current')).toBe(1);
    expect(informativeProbeIds(activity)).toEqual([
      'backup-current',
      'supply-current',
      'link-voltage',
    ]);
    expect(meterReading(activity, 'intact', 'link-voltage')).toBe(0);
    expect(meterReading(activity, 'broken', 'link-voltage')).toBe(12);
    const second = scenario().episode.nodes.find((node) => node.id === 'test-sensor')!.activity;
    if (second.type !== 'meter-probe') throw new Error('Expected sensor meter');
    expect(meterReading(second, 'nominal', 'rail-current')).toBe(2);
    expect(meterReading(second, 'drifted', 'rail-current')).toBe(2);
    expect(meterReading(second, 'nominal', 'sensor-current')).toBe(1);
    expect(meterReading(second, 'drifted', 'sensor-current')).toBe(0.5);
    expect(meterReading(second, 'nominal', 'source-current')).toBe(3);
    expect(meterReading(second, 'drifted', 'source-current')).toBeCloseTo(2.5, 12);
  });

  it('requires an informative probe and records exploration without independent mastery', () => {
    const { pack, episode, node } = scenario();
    const first = newRun(pack, episode);
    const poor = appendEvent(pack, episode, first, {
      type: 'probe',
      node: node.id,
      id: 'main-current',
      at: first.startedAt + 1,
    });
    expect(nodePassed(node, projectRun(pack, episode, poor).memory[node.id]!)).toBe(false);
    expect(() =>
      appendEvent(pack, episode, poor, {
        type: 'advance',
        node: node.id,
        outcome: 'passed',
        at: first.startedAt + 2,
      }),
    ).toThrow('supporting interaction');
    const useful = appendEvent(pack, episode, poor, {
      type: 'probe',
      node: node.id,
      id: 'backup-current',
      at: first.startedAt + 2,
    });
    expect(nodePassed(node, projectRun(pack, episode, useful).memory[node.id]!)).toBe(true);
    const passed = appendEvent(pack, episode, useful, {
      type: 'advance',
      node: node.id,
      outcome: 'passed',
      at: first.startedAt + 3,
    });
    expect(projectRun(pack, episode, passed).evidence[0]).toMatchObject({
      role: 'practice',
      independent: false,
      attempts: 2,
    });
    expect(() =>
      appendEvent(pack, episode, poor, {
        type: 'probe',
        node: node.id,
        id: 'main-current',
        at: first.startedAt + 2,
      }),
    ).toThrow('unavailable');
    expect(() =>
      appendEvent(pack, episode, poor, {
        type: 'probe',
        node: node.id,
        id: 'made-up',
        at: first.startedAt + 2,
      }),
    ).toThrow('unavailable');

    const transferPack = structuredClone(pack);
    const transferEpisode = transferPack.episodes.find((item) => item.id === 'meter-detective')!;
    transferEpisode.nodes[0]!.role = 'transfer';
    const fresh = newRun(transferPack, transferEpisode);
    const tested = appendEvent(transferPack, transferEpisode, fresh, {
      type: 'probe',
      node: node.id,
      id: 'backup-current',
      at: fresh.startedAt + 1,
    });
    const advanced = appendEvent(transferPack, transferEpisode, tested, {
      type: 'advance',
      node: node.id,
      outcome: 'passed',
      at: fresh.startedAt + 2,
    });
    expect(projectRun(transferPack, transferEpisode, advanced).evidence[0]).toMatchObject({
      role: 'transfer',
      independent: false,
    });
    const assisted = appendEvent(pack, episode, poor, {
      type: 'advance',
      node: node.id,
      outcome: 'assisted',
      at: first.startedAt + 2,
    });
    expect(projectRun(pack, episode, assisted).evidence[0]).toMatchObject({
      outcome: 'assisted',
      independent: false,
    });
  });

  it('rejects a false diagnostic, a different topology and capability omission', () => {
    const { pack } = scenario();
    const missing = structuredClone(pack);
    delete missing.capabilities['meter-probe'];
    expect(() => parseLaboratoryPack(missing)).toThrow('missing activity capability');
    const noDiscriminator = structuredClone(pack);
    const activity = noDiscriminator.episodes.find((item) => item.id === 'meter-detective')!
      .nodes[0]!.activity;
    if (activity.type !== 'meter-probe') throw new Error('Expected meter scene');
    activity.probes = activity.probes.filter((probe) =>
      ['main-current', 'supply-voltage'].includes(probe.id),
    );
    expect(() => parseLaboratoryPack(noDiscriminator)).toThrow('diagnostic and nondiagnostic');
    const topology = structuredClone(pack);
    const second = topology.episodes.find((item) => item.id === 'meter-detective')!.nodes[0]!
      .activity;
    if (second.type !== 'meter-probe') throw new Error('Expected meter scene');
    second.candidates[1]!.configuration.circuit = { type: 'resistor', id: 'different', ohms: 12 };
    expect(() => parseLaboratoryPack(topology)).toThrow('same supply and circuit positions');
  });

  it('builds a validated Studio path past the new activity', () => {
    const { pack, episode } = scenario();
    const run = createPreviewRun({
      formatVersion: 1,
      kind: 'learnlab-author-preview',
      pack,
      episodeId: episode.id,
      nodeId: 'fresh-position',
      branchPreference: 'passed',
      seed: 7,
      hints: 0,
      worked: false,
    });
    expect(projectRun(pack, episode, run).current).toBe('fresh-position');
    expect(run.events.some((event) => event.type === 'probe')).toBe(true);
  });
});
