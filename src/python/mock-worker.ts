// Test-only MockWorker that speaks the §6.3 protocol (§11 "Bridge contract:
// Vitest with a mocked worker"). It is NOT part of the shipped barrel; tests
// import it directly. It records every host→worker envelope and lets tests push
// worker→host envelopes back, optionally driven by the golden fixtures.

import { PROTOCOL_VERSION } from './protocol';
import type { Envelope, HostMessage, JsonObject, WorkerMessage } from './protocol';
import type { WorkerLike } from './host';

export class MockWorker implements WorkerLike {
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;

  /** Every envelope the host posted, in order. */
  readonly sent: HostMessage[] = [];
  terminated = false;

  /** Optional auto-responder invoked after each host message. */
  autoRespond?: (msg: HostMessage, worker: MockWorker) => void;

  postMessage(message: unknown): void {
    const msg = message as HostMessage;
    this.sent.push(msg);
    this.autoRespond?.(msg, this);
  }

  terminate(): void {
    this.terminated = true;
  }

  /** Deliver a worker→host envelope to the host. */
  emit(message: WorkerMessage): void {
    this.onmessage?.({ data: message } as MessageEvent);
  }

  /** Find the most recent host message of a given type. */
  lastOf<T extends HostMessage['type']>(type: T): Extract<HostMessage, { type: T }> | undefined {
    for (let i = this.sent.length - 1; i >= 0; i--) {
      if (this.sent[i]!.type === type) return this.sent[i] as Extract<HostMessage, { type: T }>;
    }
    return undefined;
  }
}

/** Build a worker→host envelope with a fresh id (+ optional replyTo). */
export function w2h<T extends WorkerMessage['type']>(
  type: T,
  payload: JsonObject,
  replyTo?: string,
): WorkerMessage {
  return {
    v: PROTOCOL_VERSION,
    id: crypto.randomUUID(),
    type,
    payload,
    ...(replyTo ? { replyTo } : {}),
  } as unknown as WorkerMessage;
}

/** A MockWorker pre-wired to reply READY to INIT and LOADED+RENDER to LOAD_ITEM. */
export function happyWorker(opts?: {
  meta?: { title?: string; wantsTick: boolean; tickHz?: number };
  firstTree?: JsonObject;
}): MockWorker {
  const w = new MockWorker();
  const meta = opts?.meta ?? { wantsTick: false };
  const tree =
    opts?.firstTree ??
    ({ type: 'Column', key: 'root', props: {}, children: [] } as unknown as JsonObject);
  w.autoRespond = (msg, worker) => {
    if (msg.type === 'INIT') {
      worker.emit(w2h('READY', { pyodideVersion: '0.27.7', sdkVersion: '1.0.0' }, msg.id));
    } else if (msg.type === 'LOAD_ITEM') {
      const itemId = (msg.payload as Envelope<'LOAD_ITEM', { itemId: string }>['payload']).itemId;
      worker.emit(w2h('LOADED', { itemId, meta: meta as unknown as JsonObject }, msg.id));
      worker.emit(w2h('RENDER', { itemId, seq: 1, tree }));
    } else if (msg.type === 'RUN_SNIPPET') {
      const runId = (msg.payload as { runId: string }).runId;
      worker.emit(w2h('SNIPPET_RESULT', { runId, ok: true, stdout: '', stderr: '' }, msg.id));
    } else if (msg.type === 'SERIALIZE_STATE') {
      const itemId = (msg.payload as { itemId: string }).itemId;
      worker.emit(w2h('STATE', { itemId, state: {} }, msg.id));
    } else if (msg.type === 'DESTROY_ITEM') {
      const itemId = (msg.payload as { itemId: string }).itemId;
      worker.emit(w2h('DESTROYED', { itemId }));
    }
  };
  return w;
}
