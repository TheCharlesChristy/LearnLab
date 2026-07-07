// FR-PROG-007: request persistent storage once after the first meaningful
// progress write (the caller decides when); result is stored in kv and
// surfaced in settings ("storage: persistent / best-effort").

import { kvGet, kvSet } from './db';

export const KV_PERSIST_REQUESTED = 'storagePersistRequested';
export const KV_PERSISTENT = 'storagePersistent';

/**
 * Call navigator.storage.persist() exactly once (guarded via the
 * 'storagePersistRequested' kv flag). Stores the boolean result in kv
 * 'storagePersistent' and returns it. Subsequent calls return the stored
 * result without re-prompting.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  const alreadyRequested = await kvGet<boolean>(KV_PERSIST_REQUESTED);
  if (alreadyRequested) {
    return (await kvGet<boolean>(KV_PERSISTENT)) ?? false;
  }

  let persistent = false;
  if (
    typeof navigator !== 'undefined' &&
    navigator.storage &&
    typeof navigator.storage.persist === 'function'
  ) {
    try {
      persistent = await navigator.storage.persist();
    } catch {
      persistent = false;
    }
  }

  await kvSet(KV_PERSIST_REQUESTED, true);
  await kvSet(KV_PERSISTENT, persistent);
  return persistent;
}
