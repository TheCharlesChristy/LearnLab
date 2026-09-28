import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { solveCircuit } from './circuit-model';
import { informativeProbeIds, meterReading } from './meter-probe';
import { circuitGoalMet, parseLaboratoryPack } from './pack';
import { appendEvent, controlValue, newRun, projectRun } from './run';
import type { LaboratoryPack } from './pack';
import type { RunEvent, RunInput } from './run';

const pack = () =>
  parseLaboratoryPack(
    JSON.parse(readFileSync('public/laboratory/research-station/pack.json', 'utf8')),
  );
const episode = (course: LaboratoryPack, id: string) =>
  course.episodes.find((item) => item.id === id)!;

describe('power budget and fault-board course checks', () => {
  it('matches hand-derived alternative power paths and a two-branch 180 J budget', () => {
    const course = pack();
    const power = episode(course, 'power-budget');
    const first = power.nodes[0]!.activity;
    if (first.type !== 'circuit') throw new Error('Expected circuit');
    expect(circuitGoalMet(first, first.initial)).toBe(false);
    expect(circuitGoalMet(first, first.solution)).toBe(true);
    const alternative = { ...first.initial, voltage: 12 };
    expect(circuitGoalMet(first, alternative)).toBe(true);
    const lowVoltage = solveCircuit(first.solution);
    const highVoltage = solveCircuit(alternative);
    expect(lowVoltage.status).toBe('solved');
    expect(highVoltage.status).toBe('solved');
    if (lowVoltage.status === 'solved' && highVoltage.status === 'solved') {
      expect(lowVoltage.current).toBe(2);
      expect(highVoltage.current).toBe(1);
      expect(lowVoltage.power).toBe(12);
      expect(highVoltage.power).toBe(12);
    }
    const budget = power.nodes.find((node) => node.id === 'budget-console')!.activity;
    if (budget.type !== 'circuit') throw new Error('Expected circuit');
    expect(circuitGoalMet(budget, budget.initial, 5)).toBe(false);
    expect(circuitGoalMet(budget, budget.solution, 10)).toBe(true);
    const solved = solveCircuit(budget.solution);
    expect(solved.status).toBe('solved');
    if (solved.status === 'solved') {
      expect(solved.current).toBeCloseTo(1.5, 12);
      expect(solved.power).toBeCloseTo(18, 12);
      expect(solved.power * 10).toBeCloseTo(180, 12);
      expect(solved.readings.find((reading) => reading.id === 'navigation')?.power).toBeCloseTo(
        12,
        12,
      );
      expect(solved.readings.find((reading) => reading.id === 'sensor')?.power).toBeCloseTo(6, 12);
    }
  });

  it('separates an open link from a drifted heater and verifies the repair', () => {
    const course = pack();
    const fault = episode(course, 'fault-board');
    const first = fault.nodes[0]!.activity;
    if (first.type !== 'meter-probe') throw new Error('Expected meter probe');
    expect(meterReading(first, 'open-link', 'main-current')).toBe(1);
    expect(meterReading(first, 'high-load', 'main-current')).toBe(1);
    expect(meterReading(first, 'open-link', 'backup-current')).toBe(0);
    expect(meterReading(first, 'high-load', 'backup-current')).toBeCloseTo(0.5, 12);
    expect(meterReading(first, 'open-link', 'source-current')).toBe(1);
    expect(meterReading(first, 'high-load', 'source-current')).toBeCloseTo(1.5, 12);
    expect(meterReading(first, 'open-link', 'link-voltage')).toBe(12);
    expect(meterReading(first, 'high-load', 'link-voltage')).toBe(0);
    expect(informativeProbeIds(first)).toEqual([
      'backup-current',
      'source-current',
      'link-voltage',
    ]);
    const repair = fault.nodes.find((node) => node.id === 'repair-heater')!.activity;
    if (repair.type !== 'circuit') throw new Error('Expected repair circuit');
    expect(circuitGoalMet(repair, repair.initial)).toBe(false);
    expect(circuitGoalMet(repair, repair.solution)).toBe(true);
    const solved = solveCircuit(repair.solution);
    expect(solved.status).toBe('solved');
    if (solved.status === 'solved') {
      expect(solved.current).toBe(2);
      expect(solved.readings.find((reading) => reading.id === 'backup')?.power).toBe(12);
    }
  });

  it('retains version-6 meter work against its pinned pack', () => {
    const previous = parseLaboratoryPack(
      JSON.parse(readFileSync('authoring/runs/research-station/artifacts/0095-pack.json', 'utf8')),
    );
    expect(previous.version).toBe(6);
    const chapter = episode(previous, 'meter-detective');
    const original = newRun(previous, chapter);
    const saved = appendEvent(previous, chapter, original, {
      type: 'probe',
      node: chapter.start,
      id: 'main-current',
      at: original.startedAt + 1,
    });
    expect(projectRun(previous, chapter, saved).memory[chapter.start]?.probes).toEqual([
      'main-current',
    ]);
    const latest = pack();
    expect(() => projectRun(latest, episode(latest, 'meter-detective'), saved)).toThrow('version');
  });

  it.each(['power-budget', 'fault-board'])(
    '%s has a reachable clean route with two fresh checks',
    (id) => {
      const course = pack();
      const chapter = episode(course, id);
      let run = newRun(course, chapter);
      let at = run.startedAt;
      const emit = (event: RunInput) => {
        run = appendEvent(course, chapter, run, { ...event, at: ++at } as RunEvent);
      };
      for (const node of chapter.nodes) {
        const activity = node.activity;
        if (activity.type === 'choice') {
          emit({
            type: 'answer',
            node: node.id,
            option: activity.options.find((option) => option.correct)!.id,
          });
        } else if (activity.type === 'meter-probe') {
          emit({ type: 'probe', node: node.id, id: informativeProbeIds(activity)[0]! });
        } else {
          for (const control of activity.controls)
            emit({
              type: 'control',
              node: node.id,
              id: control.id,
              value: controlValue(activity, activity.solution, control.id),
            });
          if (activity.sourceValues)
            emit({
              type: 'control',
              node: node.id,
              id: 'source',
              value: activity.solution.voltage,
            });
          if (activity.interval)
            emit({
              type: 'control',
              node: node.id,
              id: 'elapsed-time',
              value: activity.interval.solutionSeconds,
            });
        }
        emit({ type: 'advance', node: node.id, outcome: 'passed' });
      }
      const projected = projectRun(course, chapter, run);
      expect(projected.current).toBeNull();
      expect(projected.evidence.filter((item) => item.independent)).toHaveLength(2);
      expect(
        projected.evidence
          .filter((item) => item.role === 'practice')
          .every((item) => !item.independent),
      ).toBe(true);
    },
  );
});
