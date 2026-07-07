// Public API of the sync subsystem (SRS §3.5: import-isolated leaf package —
// other code imports only from this barrel). See file-sync.ts for the full
// design rationale (manual, Chromium-only, no new data format, no daemon).

export {
  isFileSyncSupported,
  loadFromSyncFile,
  pickSyncFile,
  saveToSyncFile,
} from './file-sync';
