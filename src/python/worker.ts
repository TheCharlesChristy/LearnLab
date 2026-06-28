// Dedicated Web Worker entry — the ONLY place Pyodide ever runs (FR-PY-001).
// The main thread never imports this module eagerly; PyHost constructs it as a
// Worker URL (naturally code-split), so Tier-1 pages ship zero Pyodide bytes
// (FR-PY-002). All host↔worker traffic is the §6.3 JSON envelope protocol
// (FR-PY-005): structured-clone of JSON-safe values, no proxies cross the wire.
//
// ---------------------------------------------------------------------------
// learnsdk._bridge calling convention (the contract T1.3 MUST match)
// ---------------------------------------------------------------------------
// After the boot sequence (§6.2.2) this worker calls, in Python:
//
//     import learnsdk._bridge as bridge
//     bridge.init(js_post)        # js_post is a JS callback (envelope: object) -> None
//     bridge.dispatch(envelope)   # envelope is the *parsed* host envelope (a JS object
//                                 # surfaced to Python as a dict via Pyodide's
//                                 # default JS→Py conversion). Returns None.
//
// Expectations on the Python side:
//   * `init(js_post)` stores `js_post` and uses it to deliver every Worker→Host
//     envelope (READY, LOADED, RENDER, PROGRESS, PERSIST, STATE, DESTROYED,
//     SNIPPET_RESULT, ERROR, LOG). The bridge owns envelope `id` generation and
//     sets `replyTo` on replies. It must call js_post with a JSON-safe object
//     (the worker passes it straight to postMessage).
//   * `dispatch(envelope)` is synchronous-looking but may schedule async work
//     (e.g. loadPackage); it never throws across the boundary — Python-side
//     errors become ERROR envelopes via js_post. The worker forwards EVERY host
//     envelope whose `type` is in HOST_TO_WORKER to dispatch, except INIT
//     (handled here) and SHUTDOWN (handled here).
//   * Unknown `type` (not in HOST_TO_WORKER) → the worker itself replies
//     ERROR{ code:'unknown-type' } without involving Python (§6.3).
//
// `any` is permitted in this file ONLY at the Pyodide interop boundary, with a
// targeted disable + comment (§3.2 boundary exemption). Everywhere else we use
// the protocol types.

import { PROTOCOL_VERSION, HOST_TO_WORKER } from './protocol';
import type {
  Envelope,
  HostMessage,
  InitPayload,
  JsonObject,
  LogLevel,
  WorkerToHostType,
} from './protocol';

/* eslint-disable @typescript-eslint/no-explicit-any -- Pyodide interop boundary (§3.2). */

// Minimal structural type for the Pyodide instance we touch. The real type
// comes from the CDN script (loaded via importScripts at runtime), so we only
// model the members the boot sequence uses.
interface PyodideLike {
  version: string;
  runPython(code: string): any;
  loadPackage(names: string | string[]): Promise<void>;
  unpackArchive(buffer: ArrayBuffer, format: string, options?: { extractDir?: string }): void;
  pyimport(name: string): any;
  globals: { get(name: string): any };
}

// The worker global. We only model the members we use; `lib` does not include
// the WebWorker DOM lib here (tsconfig targets the DOM), so declare locally.
interface WorkerGlobal {
  importScripts(...urls: string[]): void;
  loadPyodide?: (opts: { indexURL: string }) => Promise<PyodideLike>;
  postMessage(message: unknown): void;
  close(): void;
  onmessage: ((e: MessageEvent) => void) | null;
}
declare const self: WorkerGlobal;

/* eslint-enable @typescript-eslint/no-explicit-any */

// The Python-side dispatch callable (a Pyodide proxy). It accepts the envelope
// as a JSON string (see onmessage) so dict semantics survive the boundary.
let bridgeDispatch: ((envelopeJson: string) => void) | null = null;

/** Post a Worker→Host envelope. Used for worker-originated messages only; the
 * Python bridge posts its own envelopes through the js_post callback. */
function postEnvelope<T extends WorkerToHostType>(
  type: T,
  payload: JsonObject,
  replyTo?: string,
): void {
  const envelope: Envelope<T, JsonObject> = {
    v: PROTOCOL_VERSION,
    id: crypto.randomUUID(),
    type,
    payload,
    ...(replyTo ? { replyTo } : {}),
  };
  self.postMessage(envelope);
}

function postLog(level: LogLevel, text: string): void {
  postEnvelope('LOG', { level, text });
}

function postBootError(message: string, traceback = ''): void {
  postEnvelope('ERROR', { phase: 'boot', message, traceback });
}

/**
 * The JS callback handed to `bridge.init`. The Python side calls this with a
 * fully-formed Worker→Host envelope (already carrying id/replyTo). We relay it
 * verbatim. Accepts either a plain object or a Pyodide proxy (`.toJs()`).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- envelope may arrive as a Pyodide proxy.
function jsPost(envelope: any): void {
  // If Python passed a proxy, convert to a plain JSON object; otherwise post as-is.
  const plain =
    envelope && typeof envelope.toJs === 'function'
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any -- proxy → JS.
        (envelope.toJs({ dict_converter: Object.fromEntries }) as any)
      : envelope;
  self.postMessage(plain);
}

async function boot(payload: InitPayload, initId: string): Promise<void> {
  const { pyodideBaseUrl, bundleUrl } = payload;

  // 1. Load the Pyodide loader script + the runtime (§6.2.2 step 1).
  postLog('info', 'Loading Python runtime…');
  self.importScripts(pyodideBaseUrl + 'pyodide.js');
  if (typeof self.loadPyodide !== 'function') {
    postBootError('pyodide.js did not expose loadPyodide');
    return;
  }
  const py = await self.loadPyodide({ indexURL: pyodideBaseUrl });
  postLog('info', 'Python runtime loaded; loading LearnLab SDK…');

  // 2. Fetch + unpack the same-origin SDK bundle (§6.2.2 step 2).
  const res = await fetch(bundleUrl);
  if (!res.ok) {
    postBootError(`Failed to fetch SDK bundle (${res.status} ${res.statusText})`);
    return;
  }
  const buf = await res.arrayBuffer();
  py.unpackArchive(buf, 'zip', { extractDir: '/lib/learnlab' });
  py.runPython('import sys; sys.path.append("/lib/learnlab")');

  // 3. Import the bridge and register the JS poster (§6.2.2 step 3).
  const bridge = py.pyimport('learnsdk._bridge');
  bridge.init(jsPost);
  bridgeDispatch = bridge.dispatch;
  const sdkVersion: string = py.runPython(
    'import learnsdk; getattr(learnsdk, "__version__", "0.0.0")',
  );

  // 4. Announce readiness (§6.2.2 step 4). replyTo ties it to the INIT request.
  postEnvelope('READY', { pyodideVersion: py.version, sdkVersion }, initId);
}

self.onmessage = (e: MessageEvent<HostMessage>): void => {
  const msg = e.data;

  // Unknown / malformed type → ERROR{unknown-type}, never throw (§6.3).
  if (!msg || typeof msg !== 'object' || !(HOST_TO_WORKER as readonly string[]).includes(msg.type)) {
    postEnvelope('ERROR', {
      phase: 'boot',
      message: `Unknown message type: ${String((msg as { type?: unknown })?.type)}`,
      traceback: '',
      code: 'unknown-type',
    });
    return;
  }

  if (msg.type === 'INIT') {
    boot(msg.payload, msg.id).catch((err: unknown) => {
      postBootError(
        err instanceof Error ? err.message : String(err),
        err instanceof Error ? (err.stack ?? '') : '',
      );
    });
    return;
  }

  if (msg.type === 'SHUTDOWN') {
    self.close();
    return;
  }

  // Everything else is forwarded into the Python bridge. The bridge replies via
  // the jsPost callback registered at boot, so we do not post anything here.
  if (!bridgeDispatch) {
    postEnvelope('ERROR', {
      phase: 'load',
      message: 'Runtime not initialised (INIT not completed)',
      traceback: '',
    });
    return;
  }
  try {
    // Pass the envelope as a JSON string: a plain JS object would reach Python
    // as a JsProxy (no implicit dict conversion), and `_bridge.dispatch` reads
    // it with `.get(...)`. dispatch accepts a JSON string and json.loads it, so
    // stringifying guarantees real-dict semantics across the Pyodide boundary.
    bridgeDispatch(JSON.stringify(msg));
  } catch (err: unknown) {
    // The bridge is expected to never throw across the boundary, but guard so a
    // single bad dispatch cannot wedge the worker silently (FR-PY-004).
    postEnvelope('ERROR', {
      itemId: 'itemId' in msg.payload ? (msg.payload.itemId as string) : '',
      phase: 'event',
      message: err instanceof Error ? err.message : String(err),
      traceback: err instanceof Error ? (err.stack ?? '') : '',
    });
  }
};
