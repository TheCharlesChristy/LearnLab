import validate from './generated/validate-author-preview.mjs';
import { parseLaboratoryPack } from './pack.ts';
import type { LaboratoryEpisode, LaboratoryPack } from './pack.ts';
import { appendEvent, controlValue, newRun, parseRun, projectRun } from './run.ts';
import type { LaboratoryRun, RunInput } from './run.ts';
import { informativeProbeIds } from './meter-probe.ts';
import { placeRepairPart } from './repair-bench.ts';

export interface AuthorPreview {
  formatVersion: 1;
  kind: 'learnlab-author-preview';
  pack: LaboratoryPack;
  episodeId: string;
  nodeId: string;
  branchPreference: 'passed' | 'assisted';
  seed: number;
  hints: number;
  worked: boolean;
  session?: LaboratoryRun;
}
/** Choice order is a presentation variant, not a fresh assessment variant. */
export function previewPack(source: LaboratoryPack, seed: number): LaboratoryPack {
  const pack = structuredClone(source);
  let state = seed >>> 0;
  const random = () => {
    state += 0x6d2b79f5;
    let n = Math.imul(state ^ (state >>> 15), 1 | state);
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
  for (const episode of pack.episodes)
    for (const node of episode.nodes) {
      if (node.activity.type !== 'choice') continue;
      const options = node.activity.options;
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [options[i], options[j]] = [options[j]!, options[i]!];
      }
    }
  return parseLaboratoryPack(pack);
}
export function parseAuthorPreview(raw: unknown): AuthorPreview {
  if (new TextEncoder().encode(JSON.stringify(raw)).length > 1024 * 1024)
    throw new Error('Author preview exceeds 1 MiB');
  if (!validate(raw)) throw new Error(`Author preview: ${JSON.stringify(validate.errors)}`);
  const fixture = structuredClone(raw) as AuthorPreview;
  fixture.pack = parseLaboratoryPack(fixture.pack);
  const episode = fixture.pack.episodes.find((v) => v.id === fixture.episodeId);
  const node = episode?.nodes.find((v) => v.id === fixture.nodeId);
  if (!episode || !node) throw new Error('Preview episode or scene does not exist');
  if (fixture.hints > node.hints.length)
    throw new Error('Preview exceeds the authored hint ladder');
  if (fixture.session) {
    fixture.session = parseRun(fixture.session, previewPack(fixture.pack, fixture.seed), episode);
    // Author generated sessions can never become fresh learner evidence.
    fixture.session.priorExposure = episode.nodes.map((v) => v.id);
    projectRun(previewPack(fixture.pack, fixture.seed), episode, fixture.session);
  }
  return fixture;
}
export function previewPath(
  episode: LaboratoryEpisode,
  target: string,
  preference: 'passed' | 'assisted',
) {
  const queue: { id: string; path: { node: string; outcome: 'passed' | 'assisted' }[] }[] = [
    { id: episode.start, path: [] },
  ];
  const visited = new Set<string>();
  while (queue.length) {
    const current = queue.shift()!;
    if (current.id === target) return current.path;
    if (visited.has(current.id)) continue;
    visited.add(current.id);
    const node = episode.nodes.find((n) => n.id === current.id)!;
    const outcomes: ('passed' | 'assisted')[] =
      preference === 'passed' ? ['passed', 'assisted'] : ['assisted', 'passed'];
    for (const outcome of outcomes) {
      const id = node.transitions[outcome];
      if (id) queue.push({ id, path: [...current.path, { node: current.id, outcome }] });
    }
  }
  throw new Error('Preview scene is unreachable');
}
export function createPreviewRun(input: AuthorPreview): LaboratoryRun {
  const fixture = parseAuthorPreview(input);
  const pack = previewPack(fixture.pack, fixture.seed);
  const episode = pack.episodes.find((v) => v.id === fixture.episodeId)!;
  if (fixture.session) return fixture.session;
  let run = newRun(
    pack,
    episode,
    episode.nodes.map((n) => n.id),
  );
  const emit = (event: RunInput) => {
    run = appendEvent(pack, episode, run, { ...event, at: run.startedAt } as Parameters<
      typeof appendEvent
    >[3]);
  };
  for (const step of previewPath(episode, fixture.nodeId, fixture.branchPreference)) {
    const node = episode.nodes.find((v) => v.id === step.node)!;
    if (step.outcome === 'passed') {
      if (node.activity.type === 'choice')
        emit({
          type: 'answer',
          node: node.id,
          option: node.activity.options.find((v) => v.correct)!.id,
        });
      else if (node.activity.type === 'meter-probe')
        emit({ type: 'probe', node: node.id, id: informativeProbeIds(node.activity)[0]! });
      else if (node.activity.type === 'repair-bench') {
        let state = structuredClone(node.activity.initial);
        if (state.layout !== node.activity.solution.layout)
          emit({ type: 'rewire', node: node.id, layout: node.activity.solution.layout });
        for (const slot of node.activity.slots) {
          const wanted = node.activity.solution.placements[slot.id] ?? null;
          if (state.placements[slot.id] === wanted) continue;
          emit({ type: 'place', node: node.id, slot: slot.id, part: wanted });
          state = placeRepairPart(node.activity, state, slot.id, wanted);
        }
      } else if (node.activity.type === 'evidence-board') {
        for (const source of node.activity.sources.slice(0, 2)) {
          emit({ type: 'open-source', node: node.id, id: source.id });
          emit({ type: 'pin-source', node: node.id, id: source.id });
        }
        emit({ type: 'write-claim', node: node.id, text: 'Preview placeholder: compare both pinned sources and state what neither source can establish.' });
        emit({ type: 'self-review', node: node.id });
      } else
        for (const control of node.activity.controls)
          emit({
            type: 'control',
            node: node.id,
            id: control.id,
            value: controlValue(node.activity, node.activity.solution, control.id),
          });
    }
    emit({ type: 'advance', ...step });
  }
  for (let i = 0; i < fixture.hints; i++) emit({ type: 'hint', node: fixture.nodeId });
  if (fixture.worked) emit({ type: 'worked', node: fixture.nodeId });
  return run;
}
