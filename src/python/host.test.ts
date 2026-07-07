import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { PyHost } from './host';
import { MockWorker, happyWorker, w2h } from './mock-worker';
import type { JsonObject } from './protocol';

const FIXTURES = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../tests/protocol-fixtures',
);
function fixture(name: string): JsonObject {
  return JSON.parse(readFileSync(path.join(FIXTURES, name), 'utf8')) as JsonObject;
}

function makeHost(worker: MockWorker): PyHost {
  return new PyHost({
    workerFactory: () => worker,
    bundleUrl: '/python-bundle.zip',
    pyodideBaseUrl: 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/',
  });
}

describe('PyHost.ensureRuntime', () => {
  it('transitions idle → ready on READY', async () => {
    const w = happyWorker();
    const host = makeHost(w);
    expect(host.getStatus().state).toBe('idle');
    const p = host.ensureRuntime();
    expect(w.lastOf('INIT')).toBeTruthy();
    await p;
    expect(host.getStatus().state).toBe('ready');
    expect(host.getStatus().pyodideVersion).toBe('0.27.7');
    expect(host.getStatus().sdkVersion).toBe('1.0.0');
  });

  it('INIT carries the configured pyodideBaseUrl + bundleUrl', async () => {
    const w = happyWorker();
    const host = makeHost(w);
    await host.ensureRuntime();
    const init = w.lastOf('INIT')!;
    expect(init.payload).toEqual({
      pyodideBaseUrl: 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/',
      bundleUrl: '/python-bundle.zip',
    });
  });

  it('transitions to error on a boot ERROR and rejects', async () => {
    const w = new MockWorker();
    w.autoRespond = (msg, worker) => {
      if (msg.type === 'INIT')
        worker.emit(w2h('ERROR', { phase: 'boot', message: 'boom', traceback: '' }));
    };
    const host = makeHost(w);
    await expect(host.ensureRuntime()).rejects.toThrow('boom');
    expect(host.getStatus().state).toBe('error');
    expect(host.getStatus().error).toBe('boom');
  });

  it('concurrent callers share one promise and one INIT', async () => {
    let inits = 0;
    const w = new MockWorker();
    w.autoRespond = (msg, worker) => {
      if (msg.type === 'INIT') {
        inits++;
        worker.emit(w2h('READY', { pyodideVersion: '0.27.7', sdkVersion: '1.0.0' }, msg.id));
      }
    };
    const host = makeHost(w);
    const [a, b] = [host.ensureRuntime(), host.ensureRuntime()];
    await Promise.all([a, b]);
    expect(inits).toBe(1);
    // ready → resolves immediately, still no extra INIT.
    await host.ensureRuntime();
    expect(inits).toBe(1);
  });

  it('forwards LOG boot text to phaseText', async () => {
    const w = new MockWorker();
    w.autoRespond = (msg, worker) => {
      if (msg.type === 'INIT') {
        worker.emit(w2h('LOG', { level: 'info', text: 'loading LearnLab SDK…' }));
        worker.emit(w2h('READY', { pyodideVersion: '0.27.7', sdkVersion: '1.0.0' }, msg.id));
      }
    };
    const host = makeHost(w);
    const statuses: string[] = [];
    host.subscribe((s) => statuses.push(`${s.state}:${s.phaseText ?? ''}`));
    await host.ensureRuntime();
    expect(statuses.some((s) => s.includes('loading-bundle'))).toBe(true);
  });
});

describe('PyHost.loadItem', () => {
  it('resolves on LOADED and delivers the first RENDER', async () => {
    const tree = (fixture('envelope-render.json').payload as JsonObject).tree as JsonObject;
    const w = happyWorker({
      meta: { title: 'Check: the power rule', wantsTick: false },
      firstTree: tree,
    });
    const host = makeHost(w);
    const handle = await host.loadItem({
      itemId: 'power-rule-quiz',
      sourceUrl: 'x.py',
      source: 'src',
      seed: 1,
    });
    expect(handle.itemId).toBe('power-rule-quiz');
    expect(handle.meta.title).toBe('Check: the power rule');

    const renders: number[] = [];
    // onRender replays the buffered first RENDER (seq 1) on subscribe, then live.
    handle.onRender((_t, seq) => renders.push(seq));
    w.emit(w2h('RENDER', { itemId: 'power-rule-quiz', seq: 2, tree: tree }));
    expect(renders).toEqual([1, 2]);
  });

  it('drops a stale RENDER (seq ≤ last applied) — §6.3 guard', async () => {
    const w = happyWorker();
    const host = makeHost(w);
    const handle = await host.loadItem({ itemId: 'i', sourceUrl: 'x', source: 's', seed: 1 });
    const seen: number[] = [];
    handle.onRender((_t, seq) => seen.push(seq)); // replays buffered seq 1
    const tree = { type: 'Column', key: 'r', props: {}, children: [] } as unknown as JsonObject;
    w.emit(w2h('RENDER', { itemId: 'i', seq: 5, tree }));
    w.emit(w2h('RENDER', { itemId: 'i', seq: 3, tree })); // stale
    w.emit(w2h('RENDER', { itemId: 'i', seq: 5, tree })); // equal → stale
    w.emit(w2h('RENDER', { itemId: 'i', seq: 6, tree }));
    expect(seen).toEqual([1, 5, 6]);
  });

  it('round-trips EVENT: emit → worker receives EVENT with token + value', async () => {
    const ev = fixture('envelope-event.json').payload as JsonObject;
    const w = happyWorker();
    const host = makeHost(w);
    const handle = await host.loadItem({
      itemId: 'power-rule-quiz',
      sourceUrl: 'x',
      source: 's',
      seed: 1,
    });
    handle.sendEvent(ev.handler as string, ev.value ?? null);
    const sent = w.lastOf('EVENT')!;
    expect(sent.payload).toEqual({
      itemId: 'power-rule-quiz',
      handler: ev.handler,
      value: ev.value,
    });
  });

  it('routes PROGRESS to onProgress', async () => {
    const prog = fixture('envelope-progress.json').payload as JsonObject;
    const w = happyWorker();
    const host = makeHost(w);
    const handle = await host.loadItem({
      itemId: 'power-rule-quiz',
      sourceUrl: 'x',
      source: 's',
      seed: 1,
    });
    const got: JsonObject[] = [];
    handle.onProgress((p) => got.push(p as unknown as JsonObject));
    w.emit(w2h('PROGRESS', prog));
    expect(got).toEqual([prog]);
  });

  it('debounces PERSIST 500 ms trailing', async () => {
    vi.useFakeTimers();
    try {
      const w = happyWorker();
      const host = makeHost(w);
      const handle = await host.loadItem({
        itemId: 'projectile',
        sourceUrl: 'x',
        source: 's',
        seed: 1,
      });
      const got: JsonObject[] = [];
      handle.onPersist((s) => got.push(s));
      w.emit(w2h('PERSIST', { itemId: 'projectile', state: { a: 1 } }));
      w.emit(w2h('PERSIST', { itemId: 'projectile', state: { a: 2 } }));
      vi.advanceTimersByTime(499);
      expect(got).toEqual([]);
      vi.advanceTimersByTime(2);
      expect(got).toEqual([{ a: 2 }]); // trailing → last value only
    } finally {
      vi.useRealTimers();
    }
  });

  it('serializeState round-trips via STATE', async () => {
    const w = happyWorker();
    const host = makeHost(w);
    const handle = await host.loadItem({ itemId: 'i', sourceUrl: 'x', source: 's', seed: 1 });
    w.autoRespond = (msg, worker) => {
      if (msg.type === 'SERIALIZE_STATE')
        worker.emit(w2h('STATE', { itemId: 'i', state: { saved: true } }, msg.id));
    };
    await expect(handle.serializeState()).resolves.toEqual({ saved: true });
  });

  it('destroy sends DESTROY_ITEM and DESTROYED clears the item', async () => {
    const w = happyWorker();
    const host = makeHost(w);
    const handle = await host.loadItem({ itemId: 'i', sourceUrl: 'x', source: 's', seed: 1 });
    handle.destroy();
    expect(w.lastOf('DESTROY_ITEM')!.payload).toEqual({ itemId: 'i' });
  });

  it('item-scoped ERROR routes to onError, not runtime error', async () => {
    const errPayload = fixture('envelope-error.json').payload as JsonObject;
    const w = happyWorker();
    const host = makeHost(w);
    const handle = await host.loadItem({
      itemId: 'power-rule-quiz',
      sourceUrl: 'x',
      source: 's',
      seed: 1,
    });
    const errs: JsonObject[] = [];
    handle.onError((e) => errs.push(e as unknown as JsonObject));
    w.emit(w2h('ERROR', errPayload));
    expect(errs.length).toBe(1);
    expect(host.getStatus().state).toBe('ready'); // unaffected
  });
});

describe('PyHost.runSnippet', () => {
  it('resolves with the SNIPPET_RESULT payload', async () => {
    const w = happyWorker();
    const host = makeHost(w);
    const result = await host.runSnippet('print(42)', 5000);
    expect(result.ok).toBe(true);
    const run = w.lastOf('RUN_SNIPPET')!;
    expect(run.payload.code).toBe('print(42)');
    expect(run.payload.timeoutMs).toBe(5000);
  });
});

describe('PyHost.restart / shutdown', () => {
  it('restart terminates and respawns to ready', async () => {
    const workers: MockWorker[] = [];
    const host = new PyHost({
      workerFactory: () => {
        const w = happyWorker();
        workers.push(w);
        return w;
      },
      bundleUrl: '/b.zip',
      pyodideBaseUrl: 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/',
    });
    await host.ensureRuntime();
    expect(workers.length).toBe(1);
    await host.restart();
    expect(workers.length).toBe(2);
    expect(workers[0]!.terminated).toBe(true);
    expect(host.getStatus().state).toBe('ready');
  });

  it('shutdown sends SHUTDOWN and terminates', async () => {
    const w = happyWorker();
    const host = makeHost(w);
    await host.ensureRuntime();
    await host.shutdown();
    expect(w.lastOf('SHUTDOWN')).toBeTruthy();
    expect(w.terminated).toBe(true);
    expect(host.getStatus().state).toBe('idle');
  });
});

let consoleSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
});
afterEach(() => {
  consoleSpy.mockRestore();
});

describe('PyHost LOG', () => {
  it('logs item LOG to console with [py:<itemId>] prefix (FR-PYDX-003)', async () => {
    const w = happyWorker();
    const host = makeHost(w);
    await host.loadItem({ itemId: 'foo', sourceUrl: 'x', source: 's', seed: 1 });
    w.emit(w2h('LOG', { itemId: 'foo', level: 'info', text: 'hello' }));
    expect(consoleSpy).toHaveBeenCalledWith('[py:foo] hello');
  });
});
