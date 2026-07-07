// Manual "sync via a synced folder" convenience layer (SRS §5.5 FR-PROG-003/
// FR-PROG-004, §13 roadmap D-025): the user points this at a JSON file that
// lives inside a folder their OS already syncs (Dropbox / Google Drive /
// iCloud Drive / OneDrive / etc.), and can thereafter save/load their
// existing progress export shape to/from that exact file without a manual
// download/upload round-trip each time.
//
// This is a thin wrapper around the browser's File System Access API. It is
// NOT a new data format (the file is byte-for-byte the same JSON shape
// `exportProgress`/`importProgress` already produce/consume) and NOT a
// background daemon — every read/write is a single explicit user action.
// "Still no server" (SRS §2/§3): nothing here talks to a network.
//
// Browser support: Chromium-based browsers only (Chrome, Edge, Opera, etc.).
// Firefox and Safari do not implement `showSaveFilePicker`/
// `showOpenFilePicker` as of this writing, so `isFileSyncSupported` is a
// real feature detection, not a hack — callers must treat "unsupported" as
// an expected, common case and fall back to the existing manual
// download/upload flow.
//
// Scope decision: the picked `FileSystemFileHandle` is only held in memory
// for the current page session (see `SettingsPage.tsx`'s `useState`). It is
// deliberately NOT persisted across reloads. Doing so would require storing
// the handle in IndexedDB and re-requesting permission on each visit — real
// added complexity for a "nice to not re-pick" convenience. Re-choosing the
// file each session is an acceptable, simpler v1.

declare global {
  interface Window {
    showSaveFilePicker?: (options?: {
      suggestedName?: string;
      types?: Array<{ description?: string; accept: Record<string, string[]> }>;
    }) => Promise<FileSystemFileHandle>;
    showOpenFilePicker?: (options?: {
      types?: Array<{ description?: string; accept: Record<string, string[]> }>;
    }) => Promise<FileSystemFileHandle[]>;
  }
}

/** Feature-detect the File System Access API (Chromium-only; see module docs). */
export function isFileSyncSupported(): boolean {
  return (
    typeof window !== 'undefined' && 'showSaveFilePicker' in window && 'showOpenFilePicker' in window
  );
}

/**
 * Let the user pick (or create) the JSON file to sync through. A single
 * `showSaveFilePicker` call covers both "first time" (create a new file
 * inside the synced folder) and "re-select an already-synced file"
 * (overwrite-by-selecting), since the save picker allows choosing an
 * existing file.
 *
 * Rejects with a `DOMException` named `AbortError` if the user cancels the
 * picker — callers should treat that as a silent no-op, not an error.
 */
export async function pickSyncFile(): Promise<FileSystemFileHandle> {
  if (!window.showSaveFilePicker) {
    throw new Error('File System Access API is not supported in this browser.');
  }
  return window.showSaveFilePicker({
    suggestedName: 'learnlab-progress.json',
    types: [
      {
        description: 'LearnLab progress',
        accept: { 'application/json': ['.json'] },
      },
    ],
  });
}

/** Write `data` as pretty-printed JSON to the given file handle, replacing its contents. */
export async function saveToSyncFile(handle: FileSystemFileHandle, data: unknown): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(JSON.stringify(data, null, 2));
  await writable.close();
}

/**
 * Read and JSON-parse the given file handle's current contents. JSON parse
 * errors are intentionally not caught here — callers pass the result through
 * the existing `importProgress` validation, which already produces a proper
 * "Import rejected" message for malformed input.
 */
export async function loadFromSyncFile(handle: FileSystemFileHandle): Promise<unknown> {
  const file = await handle.getFile();
  return JSON.parse(await file.text());
}
