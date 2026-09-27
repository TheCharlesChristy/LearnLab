/** Complete pack acquisition stays on-origin and in browser caches. A readiness
 * check inspects every expected byte hash, including the built runtime closure. */
import { parseLaboratoryPack } from './pack';
import type { LaboratoryPack } from './pack';
export interface LocalFile {
  path: string;
  sha256: string;
  bytes: number;
}
export interface PackReference {
  id: string;
  title: string;
  description: string;
  version: number;
  subject: { id: string; title: string };
  audience: string;
  level: string;
  episodes: number;
  files: LocalFile[];
}
const CACHE = 'learnlab-laboratory-acquired-v1';
const base = () => new URL(import.meta.env.BASE_URL, location.origin);
const local = (path: string) => {
  if (
    path.startsWith('/') ||
    path.split('/').some((v) => v === '..' || v === '.' || v === '') ||
    !/^[a-zA-Z0-9/._-]+$/.test(path)
  )
    throw new Error('Unsafe acquisition path');
  return new URL(path, base()).href;
};
// Hash-versioned URLs bypass stale CacheFirst entries without deleting an
// older downloaded pack. A new version acquires a separate immutable cache key.
function revisionUrl(file: LocalFile): string {
  const url = new URL(local(file.path));
  url.searchParams.set('lab-revision', file.sha256);
  return url.href;
}
async function bytesMatch(response: Response | undefined, file: LocalFile): Promise<boolean> {
  if (!response?.ok) return false;
  const data = await response.arrayBuffer();
  if (data.byteLength !== file.bytes) return false;
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', data)), (v) =>
    v.toString(16).padStart(2, '0'),
  ).join('');
  return hash === file.sha256;
}
function parseFiles(raw: unknown): LocalFile[] {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 512)
    throw new Error('Invalid acquisition manifest');
  let total = 0;
  const result = raw.map((file: unknown) => {
    if (typeof file !== 'object' || file === null || Array.isArray(file))
      throw new Error('Invalid asset entry');
    const f = file as LocalFile;
    if (
      typeof f.path !== 'string' ||
      typeof f.sha256 !== 'string' ||
      !/^[a-f0-9]{64}$/.test(f.sha256) ||
      !Number.isSafeInteger(f.bytes) ||
      f.bytes < 0
    )
      throw new Error('Invalid acquisition asset/hash');
    local(f.path);
    total += f.bytes;
    return f;
  });
  if (total > 32 * 1024 * 1024 || new Set(result.map((f) => f.path)).size !== result.length)
    throw new Error('Duplicate or oversized acquisition manifest');
  return result;
}
export async function loadLaboratoryIndex(): Promise<PackReference[]> {
  const response = await fetch(local('laboratory/index.json'));
  if (!response.ok) throw new Error('Laboratory catalogue unavailable');
  const raw: unknown = await response.json();
  if (
    !raw ||
    typeof raw !== 'object' ||
    !('packs' in raw) ||
    !Array.isArray(raw.packs) ||
    raw.packs.length > 32
  )
    throw new Error('Invalid laboratory catalogue');
  return raw.packs.map((value: unknown) => {
    if (
      !value ||
      typeof value !== 'object' ||
      !('id' in value) ||
      typeof value.id !== 'string' ||
      !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(value.id)
    )
      throw new Error('Invalid pack identity');
    const entry = value as PackReference;
    if (
      !Number.isSafeInteger(entry.version) ||
      entry.version < 1 ||
      typeof entry.title !== 'string'
    )
      throw new Error('Invalid pack metadata');
    entry.files = parseFiles(entry.files);
    if (
      !entry.files.some((v) => v.path === `${entry.id}/pack.json`) ||
      entry.files.some((v) => !v.path.startsWith(`${entry.id}/`))
    )
      throw new Error('Pack asset closure escapes its directory');
    return entry;
  });
}
export async function loadLaboratoryPack(reference: PackReference): Promise<LaboratoryPack> {
  const expected = reference.files.find((f) => f.path === `${reference.id}/pack.json`)!;
  const url = revisionUrl({ ...expected, path: `laboratory/${expected.path}` });
  const response =
    typeof caches !== 'undefined' ? (await caches.open(CACHE)).match(url) : undefined;
  const data = (await response) ?? (await fetch(url));
  if (!(await bytesMatch(data.clone(), expected)))
    throw new Error(
      'Course version/hash differs from the catalogue. Reacquire the pack or refresh the app. Saved work was preserved.',
    );
  const pack = parseLaboratoryPack(await data.json());
  if (pack.version !== reference.version || pack.id !== reference.id)
    throw new Error('Pack identity/version mismatch');
  return pack;
}
async function acquisitionFiles(reference: PackReference): Promise<LocalFile[]> {
  const response = await fetch(local('laboratory/runtime-assets.json'));
  if (!response.ok)
    throw new Error('Runtime acquisition manifest unavailable. Use a production build.');
  const raw: unknown = await response.json();
  if (!raw || typeof raw !== 'object' || !('files' in raw))
    throw new Error('Invalid runtime manifest');
  return [
    ...parseFiles(raw.files),
    ...reference.files.map((f) => ({ ...f, path: `laboratory/${f.path}` })),
  ];
}
export async function offlineReady(reference: PackReference): Promise<boolean> {
  if (
    typeof caches === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !navigator.serviceWorker.controller
  )
    return false;
  try {
    const files = await acquisitionFiles(reference);
    const cache = await caches.open(CACHE);
    for (const file of files)
      if (!(await bytesMatch(await cache.match(revisionUrl(file)), file))) return false;
    return true;
  } catch {
    return false;
  }
}
export async function acquirePack(
  reference: PackReference,
  progress: (done: number, total: number) => void,
): Promise<void> {
  if (
    typeof caches === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !navigator.serviceWorker.controller
  )
    throw new Error(
      'Offline storage is unavailable or the app is still installing. Reload once after installation, then retry.',
    );
  const files = await acquisitionFiles(reference);
  const cache = await caches.open(CACHE);
  progress(0, files.length);
  for (let i = 0; i < files.length; i++) {
    const file = files[i]!;
    const url = revisionUrl(file);
    if (!(await bytesMatch(await cache.match(url), file))) {
      const response = await fetch(url, { cache: 'no-store' });
      if (!(await bytesMatch(response.clone(), file)))
        throw new Error(`Asset version/hash mismatch: ${file.path}. Refresh before retrying.`);
      await cache.put(url, response);
    }
    progress(i + 1, files.length);
  }
  // These small manifests are required to find the cached course after restart.
  for (const name of ['laboratory/index.json', 'laboratory/runtime-assets.json']) {
    const response = await fetch(local(name));
    if (!response.ok) throw new Error('Acquisition catalogue could not be saved');
    await cache.put(local(name), response);
  }
  await cache.put(
    local(`laboratory/${reference.id}/download-v${reference.version}.json`),
    new Response(JSON.stringify(reference), { headers: { 'content-type': 'application/json' } }),
  );
  if (!(await offlineReady(reference)))
    throw new Error('Download finished but offline readiness could not be confirmed.');
}

/** Resume a previously acquired version without reinterpreting its saved state.
 * Current contracts still validate it; unsupported versions preserve original data. */
export async function loadDownloadedVersion(id: string, version: number): Promise<LaboratoryPack> {
  if (
    !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id) ||
    !Number.isSafeInteger(version) ||
    version < 1 ||
    typeof caches === 'undefined'
  )
    throw new Error(
      'Saved course version is unavailable. Export the original work before recovery.',
    );
  const response = await (
    await caches.open(CACHE)
  ).match(local(`laboratory/${id}/download-v${version}.json`));
  if (!response)
    throw new Error(
      'Earlier saved course is not downloaded. Original progress remains available for export and recovery.',
    );
  const raw: unknown = await response.json();
  if (
    !raw ||
    typeof raw !== 'object' ||
    !('id' in raw) ||
    raw.id !== id ||
    !('version' in raw) ||
    raw.version !== version ||
    !('files' in raw)
  )
    throw new Error('Invalid downloaded version descriptor');
  const reference = raw as PackReference;
  reference.files = parseFiles(reference.files);
  if (
    !reference.files.some((f) => f.path === `${id}/pack.json`) ||
    reference.files.some((f) => !f.path.startsWith(`${id}/`))
  )
    throw new Error('Invalid downloaded asset closure');
  return loadLaboratoryPack(reference);
}
