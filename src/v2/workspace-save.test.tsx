import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { readFileSync } from 'node:fs';
import { EpisodeWorkspace } from './LaboratoryPage';
import { parseLaboratoryPack } from './pack';
import { createPreviewRun } from './author-preview';
import { appendEvent } from './run';
vi.mock('../tts/ReadAloudControl', () => ({ ReadAloudControl: () => null }));
afterEach(cleanup);
it.each([true, false])(
  'completion waits for save settlement and keeps failed work exportable (saved=%s)',
  async (saved) => {
    const pack = parseLaboratoryPack(
      JSON.parse(readFileSync('public/laboratory/research-station/pack.json', 'utf8')),
    );
    const episode = pack.episodes[0]!;
    const node = episode.nodes.at(-1)!;
    if (node.activity.type !== 'choice') throw Error('Expected final choice');
    let run = createPreviewRun({
      formatVersion: 1,
      kind: 'learnlab-author-preview',
      pack,
      episodeId: episode.id,
      nodeId: node.id,
      branchPreference: 'passed',
      seed: 0,
      hints: 0,
      worked: false,
    });
    run = appendEvent(pack, episode, run, {
      type: 'answer',
      node: node.id,
      option: node.activity.options.find((v) => v.correct)!.id,
      at: run.startedAt,
    });
    let settle!: (saved: boolean) => void;
    const write = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          settle = resolve;
        }),
    );
    render(
      <MemoryRouter>
        <EpisodeWorkspace
          pack={pack}
          episode={episode}
          session={{ read: async () => run, write }}
        />
      </MemoryRouter>,
    );
    const finish = await screen.findByRole('button', { name: 'Finish investigation' });
    fireEvent.click(finish);
    expect(write).toHaveBeenCalledOnce();
    expect(screen.queryByRole('heading', { name: episode.debrief!.title })).toBeNull();
    expect(screen.getByRole('heading', { name: node.title })).toBeTruthy();
    await act(async () => settle(saved));
    expect(screen.getByRole('heading', { name: episode.debrief!.title })).toBeTruthy();
    if (!saved) {
      expect(screen.getByRole('alert').textContent).toContain('saving failed');
      expect(screen.getByRole('button', { name: 'Export unsaved work' })).toBeTruthy();
    }
  },
);
