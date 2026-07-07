// PyHost — the host-side singleton that owns the one-and-only Python Web Worker
// per app session (FR-PY-001) and brokers the §6.3 JSON protocol between the
// app and the worker. Consumed by:
//   * T1.8 code-runner   → ensureRuntime() + runSnippet()
//   * PyItem / the app shell → ensureRuntime() + loadItem() + the ItemHandle API
//   * usePyRuntime()/useEnsureRuntimeOnVisible() (runtime.ts) → status + lazy boot
//
// ---------------------------------------------------------------------------
// PUBLIC API (stable; T1.8 + app shell depend on these signatures)
// ---------------------------------------------------------------------------
//   pyHost: PyHost                              — the session singleton
//   PyHost {
//     getStatus(): RuntimeStatus
//     subscribe(cb: (s: RuntimeStatus) => void): () => void
//     ensureRuntime(): Promise<void>            — idempotent; concurrent callers share
//     loadItem(req: LoadItemRequest): Promise<ItemHandle>
//     runSnippet(code: string, timeoutMs: number): Promise<SnippetResultPayload>
//     restart(): Promise<void>                  — terminate + respawn (FR-PY-004)
//     shutdown(): Promise<void>                 — SHUTDOWN + terminate
//   }
// RuntimeStatus.state ∈ idle | loading-pyodide | loading-bundle | ready | error (§6.2.1)
// ItemHandle = { itemId, meta, sendEvent, tick, serializeState, destroy,
//                onRender, onProgress, onPersist, onError }
// ---------------------------------------------------------------------------

import { PROTOCOL_VERSION } from './protocol';
import type {
  Envelope,
  HostToWorkerType,
  JsonObject,
  JsonValue,
  LoadedMeta,
  ProgressPayload,
  RenderPayload,
  SnippetResultPayload,
  WorkerMessage,
} from './protocol';
import type { PyNode } from './component-tree';
import { PYODIDE_BASE_URL } from '../config';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type RuntimeState = 'idle' | 'loading-pyodide' | 'loading-bundle' | 'ready' | 'error';

/** Observable runtime status; FR-PY-003 loading UI binds to `phaseText`. */
export interface RuntimeStatus {
  state: RuntimeState;
  pyodideVersion?: string;
  sdkVersion?: string;
  loadedPackages: string[];
  phaseText?: string;
  error?: string;
}

export interface LoadItemRequest {
  itemId: string;
  sourceUrl: string;
  source: string;
  params?: JsonObject;
  savedState?: JsonObject | null;
  seed: number;
}

export interface ItemError {
  phase: 'boot' | 'load' | 'event' | 'tick';
  message: string;
  traceback: string;
  code?: string;
}

/** Per-item control surface returned by loadItem(). */
export interface ItemHandle {
  readonly itemId: string;
  readonly meta: LoadedMeta;
  sendEvent(handler: string, value: JsonValue): void;
  tick(dt: number): void;
  serializeState(): Promise<JsonValue>;
  destroy(): void;
  onRender(cb: (tree: PyNode, seq: number) => void): () => void;
  onProgress(cb: (p: ProgressPayload) => void): () => void;
  onPersist(cb: (state: JsonObject) => void): () => void;
  onError(cb: (e: ItemError) => void): () => void;
}

/** Injectable for tests: anything postMessage/onmessage/terminate-shaped. */
export interface WorkerLike {
  postMessage(message: unknown): void;
  terminate(): void;
  onmessage: ((e: MessageEvent) => void) | null;
  onerror: ((e: unknown) => void) | null;
}
export type WorkerFactory = () => WorkerLike;

const PERSIST_DEBOUNCE_MS = 500; // §6.3 PERSIST trailing debounce.

// §6.2.2: the worker boots via `self.importScripts(pyodideBaseUrl + 'pyodide.js')`,
// a CLASSIC-worker-only API ('module' workers reject importScripts). Vite's
// default worker build format is 'iife' (no override in vite.config.ts), which
// bundles worker.ts's one runtime import (./protocol) into a self-contained
// classic script — so { type: 'classic' } is correct here, not 'module'.
const defaultWorkerFactory: WorkerFactory = () =>
  new Worker(new URL('./worker.ts', import.meta.url), {
    type: 'classic',
  }) as unknown as WorkerLike;

/** Same-origin URL of the SDK bundle produced by build-python-bundle.mjs. */
function defaultBundleUrl(): string {
  return import.meta.env.BASE_URL + 'python-bundle.zip';
}

// ---------------------------------------------------------------------------
// Internal per-item record
// ---------------------------------------------------------------------------

type RenderCb = (tree: PyNode, seq: number) => void;
type ProgressCb = (p: ProgressPayload) => void;
type PersistCb = (state: JsonObject) => void;
type ErrorCb = (e: ItemError) => void;

interface ItemRecord {
  itemId: string;
  meta: LoadedMeta;
  lastSeq: number;
  lastTree: PyNode | null; // replayed to late onRender subscribers
  renderCbs: Set<RenderCb>;
  progressCbs: Set<ProgressCb>;
  persistCbs: Set<PersistCb>;
  errorCbs: Set<ErrorCb>;
  persistTimer: ReturnType<typeof setTimeout> | null;
  pendingPersist: JsonObject | null;
  // SERIALIZE_STATE round-trips keyed by envelope id.
  serializeWaiters: Map<string, (state: JsonValue) => void>;
}

export class PyHost {
  private worker: WorkerLike | null = null;
  private readonly workerFactory: WorkerFactory;
  private readonly bundleUrl: string;
  private readonly pyodideBaseUrl: string;

  private status: RuntimeStatus = { state: 'idle', loadedPackages: [] };
  private readonly statusSubs = new Set<(s: RuntimeStatus) => void>();

  // Shared ensureRuntime() promise (concurrent callers share, idempotent).
  private ensurePromise: Promise<void> | null = null;
  private ensureResolve: (() => void) | null = null;
  private ensureReject: ((e: unknown) => void) | null = null;
  private initId: string | null = null;

  private readonly items = new Map<string, ItemRecord>();
  // LOAD_ITEM round-trips keyed by request envelope id.
  private readonly loadWaiters = new Map<
    string,
    { resolve: (h: ItemHandle) => void; reject: (e: unknown) => void; itemId: string }
  >();
  // RUN_SNIPPET round-trips keyed by runId.
  private readonly snippetWaiters = new Map<
    string,
    { resolve: (r: SnippetResultPayload) => void; reject: (e: unknown) => void }
  >();

  constructor(opts?: {
    workerFactory?: WorkerFactory;
    bundleUrl?: string;
    pyodideBaseUrl?: string;
  }) {
    this.workerFactory = opts?.workerFactory ?? defaultWorkerFactory;
    this.bundleUrl = opts?.bundleUrl ?? defaultBundleUrl();
    this.pyodideBaseUrl = opts?.pyodideBaseUrl ?? PYODIDE_BASE_URL;
  }

  // -------------------------------------------------------------------------
  // Status observation
  // -------------------------------------------------------------------------

  getStatus(): RuntimeStatus {
    return this.status;
  }

  subscribe(cb: (s: RuntimeStatus) => void): () => void {
    this.statusSubs.add(cb);
    cb(this.status);
    return () => {
      this.statusSubs.delete(cb);
    };
  }

  private setStatus(patch: Partial<RuntimeStatus>): void {
    this.status = { ...this.status, ...patch };
    for (const cb of this.statusSubs) cb(this.status);
  }

  // -------------------------------------------------------------------------
  // Runtime lifecycle
  // -------------------------------------------------------------------------

  /**
   * Spawn the worker (if needed) and run INIT, resolving on READY and rejecting
   * (→ error state) on a boot ERROR. Idempotent: concurrent callers share one
   * promise; once ready, resolves immediately.
   */
  ensureRuntime(): Promise<void> {
    if (this.status.state === 'ready') return Promise.resolve();
    if (this.ensurePromise) return this.ensurePromise;

    this.ensurePromise = new Promise<void>((resolve, reject) => {
      this.ensureResolve = resolve;
      this.ensureReject = reject;
    });

    this.spawnWorker();
    this.setStatus({
      state: 'loading-pyodide',
      phaseText: 'Loading Python runtime… cached after first time',
      error: undefined,
    });

    this.initId = crypto.randomUUID();
    this.send('INIT', { pyodideBaseUrl: this.pyodideBaseUrl, bundleUrl: this.bundleUrl }, this.initId);

    return this.ensurePromise;
  }

  /** Terminate + respawn the worker, resetting all state (FR-PY-004 recovery). */
  async restart(): Promise<void> {
    this.teardownWorker();
    this.failAllPending(new Error('Python runtime restarted'));
    this.items.clear();
    this.ensurePromise = null;
    this.ensureResolve = null;
    this.ensureReject = null;
    this.setStatus({
      state: 'idle',
      pyodideVersion: undefined,
      sdkVersion: undefined,
      loadedPackages: [],
      phaseText: undefined,
      error: undefined,
    });
    await this.ensureRuntime();
  }

  /** Graceful shutdown: ask the worker to self-close, then terminate. */
  async shutdown(): Promise<void> {
    if (this.worker) {
      try {
        this.send('SHUTDOWN', {});
      } catch {
        // ignore — we terminate next regardless
      }
    }
    this.teardownWorker();
    this.failAllPending(new Error('Python runtime shut down'));
    this.items.clear();
    this.ensurePromise = null;
    this.setStatus({ state: 'idle', loadedPackages: [], phaseText: undefined });
  }

  private spawnWorker(): void {
    if (this.worker) return;
    const w = this.workerFactory();
    w.onmessage = (e: MessageEvent) => this.handleMessage(e.data as WorkerMessage);
    w.onerror = (err: unknown) => {
      // An uncaught worker error wedges the runtime (FR-PY-004 recovery path).
      const message = err instanceof ErrorEvent ? err.message : 'Worker crashed';
      this.failRuntime(message);
    };
    this.worker = w;
  }

  private teardownWorker(): void {
    if (this.worker) {
      this.worker.onmessage = null;
      this.worker.onerror = null;
      this.worker.terminate();
      this.worker = null;
    }
    for (const item of this.items.values()) {
      if (item.persistTimer) clearTimeout(item.persistTimer);
    }
  }

  private failRuntime(message: string): void {
    this.setStatus({ state: 'error', error: message, phaseText: undefined });
    if (this.ensureReject) {
      this.ensureReject(new Error(message));
      this.ensureResolve = null;
      this.ensureReject = null;
    }
  }

  private failAllPending(err: Error): void {
    for (const w of this.loadWaiters.values()) w.reject(err);
    this.loadWaiters.clear();
    for (const w of this.snippetWaiters.values()) w.reject(err);
    this.snippetWaiters.clear();
    for (const item of this.items.values()) {
      if (item.persistTimer) clearTimeout(item.persistTimer);
      item.serializeWaiters.clear();
    }
  }

  // -------------------------------------------------------------------------
  // Item loading
  // -------------------------------------------------------------------------

  async loadItem(req: LoadItemRequest): Promise<ItemHandle> {
    await this.ensureRuntime();
    const id = crypto.randomUUID();
    const promise = new Promise<ItemHandle>((resolve, reject) => {
      this.loadWaiters.set(id, { resolve, reject, itemId: req.itemId });
    });
    this.send(
      'LOAD_ITEM',
      {
        itemId: req.itemId,
        sourceUrl: req.sourceUrl,
        source: req.source,
        params: req.params ?? {},
        savedState: req.savedState ?? null,
        seed: req.seed,
      },
      id,
    );
    return promise;
  }

  // -------------------------------------------------------------------------
  // Code-runner snippet
  // -------------------------------------------------------------------------

  async runSnippet(code: string, timeoutMs: number): Promise<SnippetResultPayload> {
    await this.ensureRuntime();
    const runId = crypto.randomUUID();
    const promise = new Promise<SnippetResultPayload>((resolve, reject) => {
      this.snippetWaiters.set(runId, { resolve, reject });
    });
    this.send('RUN_SNIPPET', { runId, code, timeoutMs });
    return promise;
  }

  // -------------------------------------------------------------------------
  // Outbound
  // -------------------------------------------------------------------------

  private send(type: HostToWorkerType, payload: JsonObject, id?: string): void {
    if (!this.worker) throw new Error('PyHost: worker not spawned');
    const envelope: Envelope<HostToWorkerType, JsonObject> = {
      v: PROTOCOL_VERSION,
      id: id ?? crypto.randomUUID(),
      type,
      payload,
    };
    this.worker.postMessage(envelope);
  }

  private makeHandle(itemId: string, meta: LoadedMeta): ItemHandle {
    return {
      itemId,
      meta,
      sendEvent: (handler: string, value: JsonValue) => {
        this.send('EVENT', { itemId, handler, value });
      },
      tick: (dt: number) => {
        this.send('TICK', { itemId, dt });
      },
      serializeState: () => {
        const rec = this.items.get(itemId);
        if (!rec) return Promise.reject(new Error(`Unknown item: ${itemId}`));
        const reqId = crypto.randomUUID();
        const p = new Promise<JsonValue>((resolve) => {
          rec.serializeWaiters.set(reqId, resolve);
        });
        this.send('SERIALIZE_STATE', { itemId }, reqId);
        return p;
      },
      destroy: () => {
        this.send('DESTROY_ITEM', { itemId });
      },
      onRender: (cb) => {
        const unsub = this.addItemSub(itemId, 'renderCbs', cb);
        // Replay the latest tree so a subscriber that attaches after the first
        // RENDER (the common case right after loadItem resolves) still sees it.
        const rec = this.items.get(itemId);
        if (rec?.lastTree) cb(rec.lastTree, rec.lastSeq);
        return unsub;
      },
      onProgress: (cb) => this.addItemSub(itemId, 'progressCbs', cb),
      onPersist: (cb) => this.addItemSub(itemId, 'persistCbs', cb),
      onError: (cb) => this.addItemSub(itemId, 'errorCbs', cb),
    };
  }

  private addItemSub<K extends 'renderCbs' | 'progressCbs' | 'persistCbs' | 'errorCbs'>(
    itemId: string,
    key: K,
    cb: ItemRecord[K] extends Set<infer F> ? F : never,
  ): () => void {
    const rec = this.items.get(itemId);
    if (!rec) return () => undefined;
    const set = rec[key] as Set<unknown>;
    set.add(cb);
    return () => {
      set.delete(cb);
    };
  }

  // -------------------------------------------------------------------------
  // Inbound (Worker → Host)
  // -------------------------------------------------------------------------

  private handleMessage(msg: WorkerMessage): void {
    if (!msg || typeof msg !== 'object') return;
    switch (msg.type) {
      case 'READY':
        this.setStatus({
          state: 'ready',
          pyodideVersion: msg.payload.pyodideVersion,
          sdkVersion: msg.payload.sdkVersion,
          phaseText: undefined,
          error: undefined,
        });
        if (this.ensureResolve) {
          this.ensureResolve();
          this.ensureResolve = null;
          this.ensureReject = null;
        }
        break;

      case 'LOADED': {
        const { itemId, meta } = msg.payload;
        const rec: ItemRecord = {
          itemId,
          meta,
          lastSeq: 0,
          lastTree: null,
          renderCbs: new Set(),
          progressCbs: new Set(),
          persistCbs: new Set(),
          errorCbs: new Set(),
          persistTimer: null,
          pendingPersist: null,
          serializeWaiters: new Map(),
        };
        this.items.set(itemId, rec);
        const waiterId = this.findLoadWaiter(itemId);
        if (waiterId) {
          const w = this.loadWaiters.get(waiterId)!;
          this.loadWaiters.delete(waiterId);
          w.resolve(this.makeHandle(itemId, meta));
        }
        break;
      }

      case 'RENDER':
        this.handleRender(msg.payload);
        break;

      case 'PROGRESS': {
        const rec = this.items.get(msg.payload.itemId);
        if (rec) for (const cb of rec.progressCbs) cb(msg.payload);
        break;
      }

      case 'PERSIST':
        this.handlePersist(msg.payload.itemId, msg.payload.state);
        break;

      case 'STATE': {
        const rec = this.items.get(msg.payload.itemId);
        if (rec && msg.replyTo) {
          const resolve = rec.serializeWaiters.get(msg.replyTo);
          if (resolve) {
            rec.serializeWaiters.delete(msg.replyTo);
            resolve(msg.payload.state);
          }
        }
        break;
      }

      case 'DESTROYED': {
        const rec = this.items.get(msg.payload.itemId);
        if (rec?.persistTimer) clearTimeout(rec.persistTimer);
        this.items.delete(msg.payload.itemId);
        break;
      }

      case 'SNIPPET_RESULT': {
        const w = this.snippetWaiters.get(msg.payload.runId);
        if (w) {
          this.snippetWaiters.delete(msg.payload.runId);
          w.resolve(msg.payload);
        }
        break;
      }

      case 'ERROR':
        this.handleError(msg.payload);
        break;

      case 'LOG': {
        // FR-PYDX-003: print()/log() → console with [py:<itemId>] prefix.
        const prefix = msg.payload.itemId ? `[py:${msg.payload.itemId}]` : '[py]';
        const text = `${prefix} ${msg.payload.text}`;
        if (msg.payload.level === 'warn') console.warn(text);
        else console.info(text);
        // Boot-phase logs also surface in the loading card (FR-PY-003).
        if (!msg.payload.itemId && this.status.state !== 'ready') {
          const movingToBundle = /sdk|bundle/i.test(msg.payload.text);
          this.setStatus({
            state: movingToBundle ? 'loading-bundle' : this.status.state,
            phaseText: msg.payload.text,
          });
        }
        break;
      }

      default:
        // Closed set (WORKER_TO_HOST); unknown handled defensively.
        break;
    }
  }

  private findLoadWaiter(itemId: string): string | null {
    for (const [id, w] of this.loadWaiters) if (w.itemId === itemId) return id;
    return null;
  }

  private handleRender(payload: RenderPayload): void {
    const rec = this.items.get(payload.itemId);
    if (!rec) return;
    // §6.3 out-of-order guard: drop if seq ≤ last applied.
    if (payload.seq <= rec.lastSeq) return;
    rec.lastSeq = payload.seq;
    rec.lastTree = payload.tree;
    for (const cb of rec.renderCbs) cb(payload.tree, payload.seq);
  }

  private handlePersist(itemId: string, state: JsonObject): void {
    const rec = this.items.get(itemId);
    if (!rec) return;
    // §6.3: debounce 500 ms trailing before delivering to onPersist subscribers.
    rec.pendingPersist = state;
    if (rec.persistTimer) clearTimeout(rec.persistTimer);
    rec.persistTimer = setTimeout(() => {
      rec.persistTimer = null;
      const s = rec.pendingPersist;
      rec.pendingPersist = null;
      if (s) for (const cb of rec.persistCbs) cb(s);
    }, PERSIST_DEBOUNCE_MS);
  }

  private handleError(payload: ItemError & { itemId?: string }): void {
    if (payload.itemId) {
      const rec = this.items.get(payload.itemId);
      if (rec) {
        for (const cb of rec.errorCbs)
          cb({
            phase: payload.phase,
            message: payload.message,
            traceback: payload.traceback,
            code: payload.code,
          });
        return;
      }
      // Item not yet registered: an error replying to a pending LOAD_ITEM.
      const waiterId = this.findLoadWaiter(payload.itemId);
      if (waiterId) {
        const w = this.loadWaiters.get(waiterId)!;
        this.loadWaiters.delete(waiterId);
        w.reject(new Error(payload.message));
        return;
      }
    }
    // ERROR without a matching item → runtime error state (§6.3).
    this.failRuntime(payload.message);
  }
}

/** The session singleton (FR-PY-001: one worker per session). */
export const pyHost = new PyHost();
