import 'fake-indexeddb/auto';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { db, kvGet } from './db';
import {
  KV_PERSISTENT,
  KV_PERSIST_REQUESTED,
  requestPersistentStorage,
} from './persistence';

function stubStoragePersist(result: boolean | Error) {
  const persist =
    result instanceof Error
      ? vi.fn().mockRejectedValue(result)
      : vi.fn().mockResolvedValue(result);
  Object.defineProperty(navigator, 'storage', {
    value: { persist },
    configurable: true,
  });
  return persist;
}

beforeEach(async () => {
  await db.open();
  await Promise.all(db.tables.map((t) => t.clear()));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('requestPersistentStorage (FR-PROG-007)', () => {
  it('calls navigator.storage.persist() once and stores the result in kv', async () => {
    const persist = stubStoragePersist(true);
    await expect(requestPersistentStorage()).resolves.toBe(true);
    expect(persist).toHaveBeenCalledOnce();
    expect(await kvGet<boolean>(KV_PERSIST_REQUESTED)).toBe(true);
    expect(await kvGet<boolean>(KV_PERSISTENT)).toBe(true);
  });

  it('does not re-request once the kv flag is set; returns the stored result', async () => {
    const persist = stubStoragePersist(false);
    await expect(requestPersistentStorage()).resolves.toBe(false);
    await expect(requestPersistentStorage()).resolves.toBe(false);
    expect(persist).toHaveBeenCalledOnce();
  });

  it('treats a rejected persist() as best-effort (false)', async () => {
    stubStoragePersist(new Error('denied'));
    await expect(requestPersistentStorage()).resolves.toBe(false);
    expect(await kvGet<boolean>(KV_PERSISTENT)).toBe(false);
  });
});
