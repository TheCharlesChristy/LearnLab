import { describe, expect, it } from 'vitest';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { parseLaboratoryPack } from './pack';
import { createPreviewRun, parseAuthorPreview, previewPack, previewPath } from './author-preview';
import type { AuthorPreview } from './author-preview';
import { appendEvent, projectRun } from './run';
const fixture = (): AuthorPreview => {
  const pack = parseLaboratoryPack(
    JSON.parse(readFileSync('public/laboratory/research-station/pack.json', 'utf8')),
  );
  return {
    formatVersion: 1,
    kind: 'learnlab-author-preview',
    pack,
    episodeId: pack.episodes[0]!.id,
    nodeId: 'fresh-fault',
    branchPreference: 'passed',
    seed: 93027,
    hints: 1,
    worked: true,
  };
};
describe('author preview boundary', () => {
  it('replays a reachable authored witness path and injects explicit assistance at any starting scene', () => {
    const f = fixture(),
      p = previewPack(f.pack, f.seed),
      e = p.episodes[0]!;
    const run = createPreviewRun(f),
      projection = projectRun(p, e, run);
    expect(projection.current).toBe('fresh-fault');
    expect(projection.memory['fresh-fault']).toMatchObject({
      hints: 1,
      worked: true,
      replayed: true,
    });
    expect(projection.evidence).toHaveLength(3);
    expect(projection.evidence.every((v) => !v.independent)).toBe(true);
  });
  it('varies choice presentation reproducibly without changing answers or the source', () => {
    const f = fixture(),
      original = structuredClone(f.pack);
    expect(previewPack(f.pack, 17)).toEqual(previewPack(f.pack, 17));
    expect(previewPack(f.pack, 17)).not.toEqual(previewPack(f.pack, 18));
    for (const seed of [0, 1, 17, 18, 4294967295])
      for (const node of previewPack(f.pack, seed).episodes[0]!.nodes) {
        if (node.activity.type === 'choice')
          expect(node.activity.options.filter((v) => v.correct)).toHaveLength(1);
      }
    expect(f.pack).toEqual(original);
  });
  it('preserves the author-only exposure boundary on checkpoint import and answer completion', () => {
    const f = fixture();
    f.hints = 0;
    f.worked = false;
    const p = previewPack(f.pack, f.seed),
      e = p.episodes[0]!,
      n = e.nodes.find((v) => v.id === f.nodeId)!;
    if (n.activity.type !== 'choice') throw Error('fixture');
    let run = createPreviewRun(f);
    run = appendEvent(p, e, run, {
      type: 'answer',
      node: n.id,
      option: n.activity.options.find((v) => v.correct)!.id,
      at: run.startedAt,
    });
    run = appendEvent(p, e, run, {
      type: 'advance',
      node: n.id,
      outcome: 'passed',
      at: run.startedAt,
    });
    delete run.priorExposure;
    f.session = run;
    const imported = parseAuthorPreview(f);
    expect(projectRun(p, e, imported.session!).evidence.every((v) => !v.independent)).toBe(true);
  });
  it('finds a consequential assisted-only branch rather than skipping graph validation', () => {
    const f = fixture(),
      e = f.pack.episodes[0]!,
      side = structuredClone(e.nodes.at(-1)!);
    side.id = 'side-route';
    side.transitions = { passed: null, assisted: null };
    e.nodes.push(side);
    e.nodes[0]!.transitions.assisted = side.id;
    parseLaboratoryPack(f.pack);
    expect(previewPath(e, side.id, 'passed')).toEqual([{ node: e.start, outcome: 'assisted' }]);
    f.nodeId = side.id;
    f.hints = 0;
    expect(projectRun(f.pack, e, createPreviewRun(f)).current).toBe(side.id);
  });
  it('rejects unknown config, seed ranges, absent scenes, excess help and oversized imports', () => {
    expect(() => parseAuthorPreview({ ...fixture(), writeLearnerState: true })).toThrow(
      'additional',
    );
    for (const seed of [-1, 4294967296, 0.5])
      expect(() => parseAuthorPreview({ ...fixture(), seed })).toThrow('Author preview');
    expect(() => parseAuthorPreview({ ...fixture(), nodeId: 'missing' })).toThrow('does not exist');
    expect(() => parseAuthorPreview({ ...fixture(), hints: 4 })).toThrow('hint ladder');
    expect(() => parseAuthorPreview({ ...fixture(), padding: 'x'.repeat(1024 * 1024) })).toThrow(
      '1 MiB',
    );
  });
  it('creates and inspects the same fixture through the executable author harness', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'learnlab-preview-'));
    try {
      const output = path.join(dir, 'preview.json');
      execFileSync(process.execPath, [
        'scripts/author-course.mjs',
        'preview',
        '--file',
        'public/laboratory/research-station/pack.json',
        '--node',
        'fresh-fault',
        '--hints',
        '1',
        '--worked',
        '--seed',
        '17',
        '--output',
        output,
      ]);
      const parsed = parseAuthorPreview(JSON.parse(readFileSync(output, 'utf8')));
      expect(parsed.seed).toBe(17);
      const report = JSON.parse(
        execFileSync(process.execPath, ['scripts/author-course.mjs', 'inspect', '--file', output], {
          encoding: 'utf8',
        }),
      );
      expect(report.current).toBe('fresh-fault');
      expect(report.memory['fresh-fault']).toMatchObject({ hints: 1, worked: true });
      expect(() =>
        execFileSync(
          process.execPath,
          [
            'scripts/author-course.mjs',
            'preview',
            '--file',
            'public/laboratory/research-station/pack.json',
            '--output',
            output,
          ],
          { stdio: 'pipe' },
        ),
      ).toThrow();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
