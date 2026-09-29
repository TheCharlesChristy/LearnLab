import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseLaboratoryPack } from './pack';
import { createPreviewRun } from './author-preview';
import { appendEvent, newRun, nodePassed, projectRun } from './run';
import type { RunInput } from './run';

const source = JSON.parse(readFileSync('public/laboratory/great-fire-investigation/pack.json', 'utf8'));
const pack = parseLaboratoryPack(source);
const episode = pack.episodes[3]!;
const node = episode.nodes.find((item) => item.id === 'conference')!;
if (node.activity.type !== 'evidence-board') throw new Error('Expected evidence board');
const activity = node.activity;

function atConference() {
  let run = newRun(pack, episode);
  const emit = (input: RunInput) => {
    run = appendEvent(pack, episode, run, { ...input, at: run.startedAt });
  };
  const prediction = episode.nodes[0]!;
  if (prediction.activity.type !== 'choice') throw new Error('Expected first choice');
  emit({ type: 'answer', node: prediction.id, option: prediction.activity.options.find((item) => item.correct)!.id });
  emit({ type: 'advance', node: prediction.id, outcome: 'passed' });
  return { run, emit, current: () => run };
}

describe('evidence board contract and local replay', () => {
  it('accepts distinct source-backed interpretations as reflection, never independent mastery', () => {
    for (const claim of [
      'Pepys and Evelyn both describe strong wind and broad spread, but neither saw the first spark.',
      'The Whitehall account emphasizes close wooden buildings; Pepys offers a separate observation of wind, while ignition remains uncertain.',
    ]) {
      const session = atConference();
      for (const id of activity.sources.slice(0, 2).map((item) => item.id)) {
        session.emit({ type: 'open-source', node: node.id, id });
        session.emit({ type: 'pin-source', node: node.id, id });
      }
      session.emit({ type: 'write-claim', node: node.id, text: claim });
      session.emit({ type: 'self-review', node: node.id });
      const memory = projectRun(pack, episode, session.current()).memory[node.id]!;
      expect(nodePassed(node, memory)).toBe(true);
      session.emit({ type: 'advance', node: node.id, outcome: 'passed' });
      expect(projectRun(pack, episode, session.current()).evidence.at(-1)).toMatchObject({
        outcome: 'passed', independent: false, role: 'transfer',
      });
    }
  });
  it('rejects forged pins, unchecked claims and overlong imported text', () => {
    const session = atConference();
    expect(() => session.emit({ type: 'pin-source', node: node.id, id: 'pepys' })).toThrow('pin is unavailable');
    expect(() => session.emit({ type: 'write-claim', node: node.id, text: 'x'.repeat(1601) })).toThrow('claim is unavailable');
    expect(() => session.emit({ type: 'self-review', node: node.id })).toThrow('no source-backed claim');
    expect(() => session.emit({ type: 'open-source', node: node.id, id: 'fabricated' })).toThrow('inspection is unavailable');
  });
  it('requires a new reflection after editing a saved claim', () => {
    const session = atConference();
    for (const id of ['pepys', 'evelyn']) {
      session.emit({ type: 'open-source', node: node.id, id });
      session.emit({ type: 'pin-source', node: node.id, id });
    }
    session.emit({ type: 'write-claim', node: node.id, text: 'Both diaries describe the spread, but neither establishes the first spark.' });
    session.emit({ type: 'self-review', node: node.id });
    session.emit({ type: 'write-claim', node: node.id, text: 'I changed my view after comparing the diaries and the official account.' });
    expect(nodePassed(node, projectRun(pack, episode, session.current()).memory[node.id]!)).toBe(false);
    session.emit({ type: 'self-review', node: node.id });
    session.emit({ type: 'pin-source', node: node.id, id: 'evelyn' });
    expect(nodePassed(node, projectRun(pack, episode, session.current()).memory[node.id]!)).toBe(false);
  });
  it('checks source references and builds a non-mastering Studio witness', () => {
    const invalid = structuredClone(source);
    invalid.episodes[3].nodes[1].activity.sources[0].referenceId = 'missing';
    expect(() => parseLaboratoryPack(invalid)).toThrow('unknown reference');
    const preview = createPreviewRun({
      formatVersion: 1, kind: 'learnlab-author-preview', pack,
      episodeId: episode.id, nodeId: 'final-check', branchPreference: 'passed',
      seed: 7, hints: 0, worked: false,
    });
    const projection = projectRun(pack, episode, preview);
    expect(projection.current).toBe('final-check');
    expect(projection.evidence.every((item) => !item.independent)).toBe(true);
  });
});
