import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  isFileSyncSupported,
  loadFromSyncFile,
  pickSyncFile,
  saveToSyncFile,
} from './file-sync';

function fakeHandle(initialText = '') {
  let text = initialText;
  const write = vi.fn(async (chunk: string) => {
    text = chunk;
  });
  const close = vi.fn(async () => {});
  const createWritable = vi.fn(async () => ({ write, close }));
  const getFile = vi.fn(async () => ({ text: async () => text }) as unknown as File);
  return {
    handle: { kind: 'file', name: 'learnlab-progress.json', createWritable, getFile } as unknown as FileSystemFileHandle,
    write,
    close,
    createWritable,
    getFile,
  };
}

describe('isFileSyncSupported', () => {
  afterEach(() => {
    delete window.showSaveFilePicker;
    delete window.showOpenFilePicker;
  });

  it('is false when the File System Access API is absent', () => {
    expect(isFileSyncSupported()).toBe(false);
  });

  it('is true when both picker methods are present', () => {
    window.showSaveFilePicker = vi.fn();
    window.showOpenFilePicker = vi.fn();
    expect(isFileSyncSupported()).toBe(true);
  });

  it('is false when only one picker method is present', () => {
    window.showSaveFilePicker = vi.fn();
    expect(isFileSyncSupported()).toBe(false);
  });
});

describe('pickSyncFile', () => {
  afterEach(() => {
    delete window.showSaveFilePicker;
  });

  it('calls showSaveFilePicker with a suggested JSON filename and returns its handle', async () => {
    const { handle } = fakeHandle();
    const showSaveFilePicker = vi.fn(async () => handle);
    window.showSaveFilePicker = showSaveFilePicker;

    const result = await pickSyncFile();

    expect(result).toBe(handle);
    expect(showSaveFilePicker).toHaveBeenCalledWith(
      expect.objectContaining({
        suggestedName: 'learnlab-progress.json',
        types: [
          expect.objectContaining({
            accept: { 'application/json': ['.json'] },
          }),
        ],
      }),
    );
  });

  it('throws a clear error when the API is unsupported', async () => {
    await expect(pickSyncFile()).rejects.toThrow(/not supported/i);
  });

  it('propagates an AbortError when the user cancels the picker', async () => {
    const abort = new DOMException('cancelled', 'AbortError');
    window.showSaveFilePicker = vi.fn(async () => {
      throw abort;
    });

    await expect(pickSyncFile()).rejects.toBe(abort);
  });
});

describe('saveToSyncFile', () => {
  it('writes pretty-printed JSON and closes the stream', async () => {
    const { handle, write, close, createWritable } = fakeHandle();
    const data = { app: 'learnlab', exportVersion: 2 };

    await saveToSyncFile(handle, data);

    expect(createWritable).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledWith(JSON.stringify(data, null, 2));
    expect(close).toHaveBeenCalledTimes(1);
  });
});

describe('loadFromSyncFile', () => {
  it('reads and JSON-parses the file contents', async () => {
    const data = { app: 'learnlab', exportVersion: 2, tables: {} };
    const { handle } = fakeHandle(JSON.stringify(data));

    const result = await loadFromSyncFile(handle);

    expect(result).toEqual(data);
  });

  it('lets a JSON parse error propagate', async () => {
    const { handle } = fakeHandle('not json');

    await expect(loadFromSyncFile(handle)).rejects.toBeInstanceOf(SyntaxError);
  });
});
