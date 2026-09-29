import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseLaboratoryPack } from './pack';
import { createPreviewRun } from './author-preview';
import { appendEvent, newRun, nodePassed, projectRun } from './run';
import type { LaboratoryPack } from './pack';
import type { RunInput } from './run';

function fixture(): LaboratoryPack {
  const raw = JSON.parse(readFileSync('public/laboratory/research-station/pack.json', 'utf8'));
  raw.version += 1;
  raw.capabilities['evidence-board'] = '0.1.0';
  raw.references.push(
    { id: 'record-a', title: 'Record A', url: 'https://example.org/a', note: 'Test source.' },
    { id: 'record-b', title: 'Record B', url: 'https://example.org/b', note: 'Test source.' },
  );
  raw.episodes.push({
    id: 'evidence-fixture', title: 'Evidence fixture', estimatedMinutes: 3,
    skills: [raw.skills[0].id], prerequisites: [], start: 'board',
    nodes: [
      {
        id: 'board', title: 'Compare records', prompt: 'Inspect two records.', role: 'transfer',
        activity: {
          type: 'evidence-board', question: 'What can the records establish?',
          sources: [
            { id: 'a', title: 'First record', origin: 'Observer A', date: 'Day 1', order: 1,
              kind: 'firsthand', account: 'Observer A reports an event.', limit: 'Cannot establish its cause.', referenceId: 'record-a', placeId: 'north' },
            { id: 'b', title: 'Second record', origin: 'Surveyor B', date: 'Day 2', order: 2,
              kind: 'later-survey', account: 'Surveyor B records a damaged site.', limit: 'Cannot timestamp the damage.', referenceId: 'record-b', placeId: 'south' },
          ],
          places: [
            { id: 'north', label: 'North site', x: 20, y: 20 },
            { id: 'south', label: 'South site', x: 70, y: 80 },
          ],
          rubric: ['Name both records.', 'State a limit.'],
        },
        hints: ['Check each source date.'], workedExample: 'Compare the two records and their limits.',
        mechanism: 'A written explanation needs source comparison.', transitions: { passed: 'check', assisted: 'check' },
      },
      {
        id: 'check', title: 'Check', prompt: 'What changed?', role: 'reflection',
        activity: { type: 'choice', options: [
          { id: 'time', text: 'The records were created at different times.', correct: true, feedback: 'Yes.' },
          { id: 'same', text: 'The records were created at the same time.', correct: false, feedback: 'Check the dates.' },
        ] },
        hints: ['Read the dates.'], workedExample: 'Day 1 precedes Day 2.',
        mechanism: 'Dates matter.', transitions: { passed: null, assisted: null },
      },
    ],
  });
  return parseLaboratoryPack(raw);
}

describe('evidence-board reusable contract', () => {
  it('requires inspected sources, a saved claim and renewed review after changes, without independent mastery', () => {
    const pack = fixture(), episode = pack.episodes.at(-1)!, board = episode.nodes[0]!;
    let run = newRun(pack, episode);
    const emit = (event: RunInput) => { run = appendEvent(pack, episode, run, { ...event, at: run.startedAt }); };
    expect(() => emit({ type: 'pin-source', node: board.id, id: 'a' })).toThrow('pin is unavailable');
    for (const id of ['a', 'b']) {
      emit({ type: 'open-source', node: board.id, id });
      emit({ type: 'pin-source', node: board.id, id });
    }
    emit({ type: 'write-claim', node: board.id, text: 'Both records describe effects, but neither establishes the first cause.' });
    emit({ type: 'self-review', node: board.id });
    expect(nodePassed(board, projectRun(pack, episode, run).memory[board.id]!)).toBe(true);
    emit({ type: 'pin-source', node: board.id, id: 'b' });
    expect(nodePassed(board, projectRun(pack, episode, run).memory[board.id]!)).toBe(false);
    emit({ type: 'pin-source', node: board.id, id: 'b' });
    emit({ type: 'self-review', node: board.id });
    emit({ type: 'advance', node: board.id, outcome: 'passed' });
    expect(projectRun(pack, episode, run).evidence[0]).toMatchObject({ independent: false, role: 'transfer' });
  });
  it('rejects broken reference links and previews a board path without learner mastery', () => {
    const pack = fixture(), episode = pack.episodes.at(-1)!;
    const broken = structuredClone(pack);
    const board = broken.episodes.at(-1)!.nodes[0]!.activity;
    if (board.type !== 'evidence-board') throw new Error('Expected board');
    board.sources[0]!.referenceId = 'missing';
    expect(() => parseLaboratoryPack(broken)).toThrow('unknown reference');
    const preview = createPreviewRun({ formatVersion: 1, kind: 'learnlab-author-preview', pack,
      episodeId: episode.id, nodeId: 'check', branchPreference: 'passed', seed: 1, hints: 0, worked: false });
    const result = projectRun(pack, episode, preview);
    expect(result.current).toBe('check');
    expect(result.evidence.every((item) => !item.independent)).toBe(true);
  });
});
