import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash, webcrypto } from 'node:crypto';
import {
  acquirePack,
  loadDownloadedVersion,
  loadLaboratoryPack,
  offlineReady,
} from './acquisition';
import type { PackReference } from './acquisition';
const digest = (text: string) => createHash('sha256').update(text).digest('hex');
const localFile = (path: string, text: string) => ({
  path,
  sha256: digest(text),
  bytes: new TextEncoder().encode(text).length,
});
let stored: Map<string, Response>;
let network: Map<string, string>;
const origin = () => location.origin;
const fixture = (version: number): PackReference => {
  const pack = JSON.parse(readFileSync('public/laboratory/research-station/pack.json', 'utf8'));
  pack.version = version;
  const text = JSON.stringify(pack);
  network.set(`${origin()}/laboratory/research-station/pack.json`, text);
  return {
    id: pack.id,
    title: pack.title,
    description: pack.description,
    version,
    audience: pack.audience,
    level: pack.level,
    subject: pack.subject,
    episodes: 1,
    files: [localFile('research-station/pack.json', text)],
  };
};
beforeEach(() => {
  stored = new Map();
  network = new Map();
  vi.stubGlobal('crypto', webcrypto);
  vi.stubGlobal('navigator', { serviceWorker: { controller: {} } });
  const cache = {
    match: async (url: string) => stored.get(url)?.clone(),
    put: async (url: string, response: Response) => {
      stored.set(url, response.clone());
    },
  };
  vi.stubGlobal('caches', { open: async () => cache });
  const html = '<html><body>App</body></html>';
  const code = 'void 0;';
  network.set(`${origin()}/index.html`, html);
  network.set(`${origin()}/assets/runtime.js`, code);
  network.set(
    `${origin()}/laboratory/runtime-assets.json`,
    JSON.stringify({
      files: [localFile('index.html', html), localFile('assets/runtime.js', code)],
    }),
  );
  network.set(`${origin()}/laboratory/index.json`, '{}');
  // Mimic CacheFirst: stable stale keys stay stale, hash-versioned requests miss.
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string) => {
      if (stored.has(input)) return stored.get(input)!.clone();
      const url = new URL(input);
      url.search = '';
      const body = network.get(url.href);
      if (body === undefined) return new Response('Unavailable', { status: 404 });
      return new Response(body);
    }),
  );
});
afterEach(() => vi.unstubAllGlobals());
describe('complete local acquisition', () => {
  it('ignores an obsolete stable cache key, acquires a new version and keeps the old version readable', async () => {
    const first = fixture(1);
    stored.set(
      `${origin()}/laboratory/research-station/pack.json`,
      new Response('stale invalid pack'),
    );
    expect((await loadLaboratoryPack(first)).version).toBe(1);
    await acquirePack(first, () => {});
    expect(await offlineReady(first)).toBe(true);
    const second = fixture(2);
    await acquirePack(second, () => {});
    expect((await loadLaboratoryPack(second)).version).toBe(2);
    expect((await loadDownloadedVersion(first.id, 1)).version).toBe(1);
    network.clear();
    expect(await offlineReady(second)).toBe(true);
    expect((await loadDownloadedVersion(first.id, 1)).version).toBe(1);
  });
  it('rejects altered byte content and cannot claim readiness for a partial/corrupt download', async () => {
    const reference = fixture(1);
    network.set(`${origin()}/assets/runtime.js`, 'corrupt code');
    await expect(acquirePack(reference, () => {})).rejects.toThrow('hash mismatch');
    expect(await offlineReady(reference)).toBe(false);
  });
  it('does not promise offline support when the browser cannot persist a service worker', async () => {
    const reference = fixture(1);
    vi.stubGlobal('navigator', {});
    await expect(acquirePack(reference, () => {})).rejects.toThrow('unavailable');
    expect(await offlineReady(reference)).toBe(false);
  });
});
