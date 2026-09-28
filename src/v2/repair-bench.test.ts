import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseLaboratoryPack } from './pack.ts';
import { createPreviewRun } from './author-preview.ts';
import { appendEvent, newRun, projectRun } from './run.ts';
import type { RunEvent, RunInput } from './run.ts';
import {
  placeRepairPart,
  repairConfiguration,
  repairGoalMet,
  repairReading,
  setRepairLayout,
} from './repair-bench.ts';
import type { RepairBenchActivity } from './repair-bench.ts';
import { solveCircuit } from './circuit-model.ts';

const board: RepairBenchActivity = {
  type: 'repair-bench',
  voltage: 12,
  slots: [
    { id: 'navigation', label: 'Navigation socket' },
    { id: 'sensor', label: 'Sensor socket' },
  ],
  parts: [
    { id: 'navigation-lamp', label: 'Navigation load', ohms: 12 },
    { id: 'sensor-load', label: 'Sensor load', ohms: 24 },
    { id: 'spare', label: 'Spare load', ohms: 6 },
  ],
  initial: { layout: 'series', placements: { navigation: 'navigation-lamp', sensor: null } },
  solution: {
    layout: 'parallel',
    placements: { navigation: 'navigation-lamp', sensor: 'sensor-load' },
  },
  goals: [
    { reading: 'source', quantity: 'current', min: 1.49, max: 1.51 },
    { reading: 'navigation', quantity: 'power', min: 11.9, max: 12.1 },
    { reading: 'sensor', quantity: 'current', min: 0.49, max: 0.51 },
  ],
};
const source = JSON.parse(readFileSync('public/laboratory/research-station/pack.json', 'utf8'));
function fixture() {
  const raw = structuredClone(source);
  raw.version++;
  raw.capabilities['repair-bench'] = '0.1.0';
  raw.episodes.push({
    id: 'repair-bench-fixture',
    title: 'Repair bench fixture',
    estimatedMinutes: 3,
    skills: [raw.skills[0].id],
    prerequisites: [],
    start: 'repair',
    nodes: [
      {
        id: 'repair',
        title: 'Repair the board',
        prompt: 'Restore both branches.',
        role: 'transfer',
        activity: board,
        hints: ['Follow each branch.'],
        workedExample: 'Put a load in each branch.',
        mechanism: 'Both branches receive the supply potential difference.',
        transitions: { passed: 'done', assisted: 'done' },
      },
      {
        id: 'done',
        title: 'Explain the repair',
        prompt: 'Why did the sensor return?',
        role: 'reflection',
        activity: {
          type: 'choice',
          options: [
            {
              id: 'parallel',
              text: 'It has a closed branch across the supply.',
              correct: true,
              feedback: 'Yes.',
            },
            {
              id: 'series',
              text: 'It draws current through an open gap.',
              correct: false,
              feedback: 'An open gap cannot carry current.',
            },
          ],
        },
        hints: ['Trace the path.'],
        workedExample: 'Check for a closed branch.',
        mechanism: 'Each closed branch conducts.',
        transitions: { passed: null, assisted: null },
      },
    ],
  });
  return parseLaboratoryPack(raw);
}

describe('repair bench contract and replay', () => {
  it('solves open, series and parallel arrangements without inventing current', () => {
    const open = solveCircuit(repairConfiguration(board, board.initial));
    expect(open.status).toBe('solved');
    if (open.status === 'solved') expect(open.current).toBe(0);
    expect(repairGoalMet(board, board.initial)).toBe(false);
    expect(repairReading(board, board.solution, 'source', 'current')).toBeCloseTo(1.5);
    expect(repairReading(board, board.solution, 'navigation', 'power')).toBeCloseTo(12);
    expect(repairReading(board, board.solution, 'sensor', 'current')).toBeCloseTo(0.5);
    expect(repairGoalMet(board, board.solution)).toBe(true);
    const empty = { layout: 'parallel' as const, placements: { navigation: null, sensor: null } };
    const allOpen = solveCircuit(repairConfiguration(board, empty));
    expect(allOpen.status).toBe('solved');
    if (allOpen.status === 'solved') expect(allOpen.current).toBe(0);
  });

  it('moves a part rather than cloning it and rejects unavailable state', () => {
    const moved = placeRepairPart(board, board.initial, 'sensor', 'navigation-lamp');
    expect(moved.placements).toEqual({ navigation: null, sensor: 'navigation-lamp' });
    expect(() => placeRepairPart(board, moved, 'sensor', 'navigation-lamp')).toThrow();
    expect(() => placeRepairPart(board, moved, 'sensor', 'forged')).toThrow();
    expect(() =>
      repairConfiguration(board, {
        layout: 'parallel',
        placements: { navigation: 'spare', sensor: 'spare' },
      }),
    ).toThrow();
    expect(setRepairLayout(board, board.initial, 'parallel').layout).toBe('parallel');
  });

  it('validates a witness, replays inspections and rejects forged advancement', () => {
    const pack = fixture();
    const episode = pack.episodes.at(-1)!;
    let run = newRun(pack, episode);
    const emit = (event: RunInput) => {
      run = appendEvent(pack, episode, run, {
        ...event,
        at: run.startedAt + run.events.length + 1,
      } as RunEvent);
    };
    expect(() => emit({ type: 'advance', node: 'repair', outcome: 'passed' })).toThrow();
    emit({ type: 'inspect', node: 'repair', reading: 'source', quantity: 'current' });
    expect(projectRun(pack, episode, run).memory.repair?.inspections?.[0]?.value).toBe(0);
    emit({ type: 'rewire', node: 'repair', layout: 'parallel' });
    emit({ type: 'place', node: 'repair', slot: 'sensor', part: 'sensor-load' });
    expect(projectRun(pack, episode, run).memory.repair?.inspections?.[0]?.value).toBe(0);
    expect(projectRun(pack, episode, run).memory.repair?.repair).toEqual(board.solution);
    emit({ type: 'advance', node: 'repair', outcome: 'passed' });
    const result = projectRun(pack, episode, run);
    expect(result.current).toBe('done');
    expect(result.evidence[0]?.independent).toBe(false);
    expect(() =>
      appendEvent(pack, episode, newRun(pack, episode), {
        type: 'place',
        node: 'repair',
        slot: 'sensor',
        part: 'forged',
        at: Date.now(),
      }),
    ).toThrow();
    expect(() =>
      appendEvent(pack, episode, newRun(pack, episode), {
        type: 'inspect',
        node: 'repair',
        reading: 'source',
        quantity: 'power',
        at: Date.now(),
      }),
    ).toThrow();
  });

  it('previews an arbitrary repair scene through valid generated events', () => {
    const pack = fixture();
    const run = createPreviewRun({
      formatVersion: 1,
      kind: 'learnlab-author-preview',
      pack,
      episodeId: 'repair-bench-fixture',
      nodeId: 'done',
      branchPreference: 'passed',
      seed: 1,
      hints: 0,
      worked: false,
    });
    expect(projectRun(pack, pack.episodes.at(-1)!, run).current).toBe('done');
  });

  it('accepts two materially different capstone repairs and two fresh checks', () => {
    const pack = parseLaboratoryPack(source);
    const episode = pack.episodes.find((item) => item.id === 'station-repair')!;
    const capstone = episode.nodes.find((item) => item.id === 'station-capstone')!.activity;
    if (capstone.type !== 'repair-bench') throw new Error('Expected repair bench');
    const alternative = {
      layout: 'series' as const,
      placements: { navigation: 'nav-low', sensor: 'sensor-low' },
    };
    expect(repairGoalMet(capstone, capstone.solution)).toBe(true);
    expect(repairGoalMet(capstone, alternative)).toBe(true);
    expect(repairReading(capstone, capstone.solution, 'navigation', 'voltage')).toBe(12);
    expect(repairReading(capstone, alternative, 'navigation', 'voltage')).toBe(6);
    let run = newRun(pack, episode);
    const emit = (event: RunInput) => {
      run = appendEvent(pack, episode, run, {
        ...event,
        at: run.startedAt + run.events.length + 1,
      } as RunEvent);
    };
    for (const node of episode.nodes) {
      if (node.activity.type === 'choice')
        emit({
          type: 'answer',
          node: node.id,
          option: node.activity.options.find((option) => option.correct)!.id,
        });
      else if (node.id === 'restore-navigation') {
        emit({ type: 'rewire', node: node.id, layout: 'parallel' });
        emit({ type: 'place', node: node.id, slot: 'sensor', part: 'sensor-load' });
      } else if (node.id === 'station-capstone') {
        emit({ type: 'inspect', node: node.id, reading: 'source', quantity: 'current' });
        emit({ type: 'rewire', node: node.id, layout: 'series' });
        emit({ type: 'place', node: node.id, slot: 'navigation', part: 'nav-low' });
        emit({ type: 'place', node: node.id, slot: 'sensor', part: 'sensor-low' });
      }
      emit({ type: 'advance', node: node.id, outcome: 'passed' });
    }
    const result = projectRun(pack, episode, run);
    expect(result.current).toBeNull();
    expect(result.evidence.filter((item) => item.independent).map((item) => item.node)).toEqual([
      'fresh-branch-fault',
      'fresh-charge-energy',
    ]);
    expect(result.evidence.find((item) => item.node === 'station-capstone')?.independent).toBe(
      false,
    );
  });
});
