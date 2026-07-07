// Host ↔ Worker message protocol v1 — normative per SRS §6.3.
// CLOSED SETS: the message-type unions below are exhaustive. Unknown `type`
// → respond ERROR{ code: 'unknown-type' }, never crash (§6.3). All payload
// values are JSON-safe (structured-clone of JSON values; no proxies cross the
// boundary, FR-PY-005). This file is the single source of truth shared by the
// host (src/python) and asserted against the Python `_bridge` via the golden
// fixtures in tests/protocol-fixtures/ (§11 "Bridge contract").

import type { PyNode } from './component-tree';

export const PROTOCOL_VERSION = 1 as const;

/** A JSON-safe value — the only thing allowed across the boundary (§6.1). */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

// ---------------------------------------------------------------------------
// Envelope (both directions) — §6.3
// ---------------------------------------------------------------------------

export interface Envelope<T extends string = string, P = JsonObject> {
  v: typeof PROTOCOL_VERSION;
  id: string; // uuid
  type: T;
  payload: P;
  replyTo?: string; // present on replies to a request
}

// ---------------------------------------------------------------------------
// Host → Worker (§6.3)
// ---------------------------------------------------------------------------

export const HOST_TO_WORKER = [
  'INIT',
  'LOAD_ITEM',
  'EVENT',
  'TICK',
  'SERIALIZE_STATE',
  'DESTROY_ITEM',
  'RUN_SNIPPET',
  'SHUTDOWN',
] as const;
export type HostToWorkerType = (typeof HOST_TO_WORKER)[number];

export interface InitPayload {
  pyodideBaseUrl: string;
  bundleUrl: string;
}
export interface LoadItemPayload {
  itemId: string;
  sourceUrl: string; // for tracebacks; host fetches and passes `source`
  source: string;
  params: JsonObject;
  savedState: JsonObject | null;
  seed: number;
}
export interface EventPayload {
  itemId: string;
  handler: string; // the token from §6.4 ({ __h })
  value: JsonValue;
}
export interface TickPayload {
  itemId: string;
  dt: number; // seconds
}
export interface SerializeStatePayload {
  itemId: string;
}
export interface DestroyItemPayload {
  itemId: string;
}
export interface RunSnippetPayload {
  runId: string;
  code: string;
  timeoutMs: number;
}
export type ShutdownPayload = Record<string, never>;

// ---------------------------------------------------------------------------
// Worker → Host (§6.3)
// ---------------------------------------------------------------------------

export const WORKER_TO_HOST = [
  'READY',
  'LOADED',
  'RENDER',
  'PROGRESS',
  'PERSIST',
  'STATE',
  'DESTROYED',
  'SNIPPET_RESULT',
  'ERROR',
  'LOG',
] as const;
export type WorkerToHostType = (typeof WORKER_TO_HOST)[number];

export interface ReadyPayload {
  pyodideVersion: string;
  sdkVersion: string;
}
export interface LoadedMeta {
  title?: string;
  wantsTick: boolean;
  tickHz?: number;
}
export interface LoadedPayload {
  itemId: string;
  meta: LoadedMeta;
}
export interface RenderPayload {
  itemId: string;
  seq: number; // drop if ≤ last applied (out-of-order guard, §6.3)
  tree: PyNode;
}
export type ProgressKind = 'completed' | 'scored';
export interface ProgressPayload {
  itemId: string;
  kind: ProgressKind;
  score?: number;
  maxScore?: number;
}
export interface PersistPayload {
  itemId: string;
  state: JsonObject;
}
export interface StatePayload {
  itemId: string;
  state: JsonValue;
}
export interface DestroyedPayload {
  itemId: string;
}
export interface SnippetResultPayload {
  runId: string;
  ok: boolean;
  stdout: string;
  stderr: string;
  error?: string;
}
export type ErrorPhase = 'boot' | 'load' | 'event' | 'tick';
export interface ErrorPayload {
  itemId?: string;
  phase: ErrorPhase;
  message: string;
  traceback: string;
  code?: string; // e.g. 'unknown-type'
}
export type LogLevel = 'debug' | 'info' | 'warn';
export interface LogPayload {
  itemId?: string;
  level: LogLevel;
  text: string;
}

// ---------------------------------------------------------------------------
// Discriminated unions of full messages (typed helpers for both sides)
// ---------------------------------------------------------------------------

export type HostMessage =
  | Envelope<'INIT', InitPayload>
  | Envelope<'LOAD_ITEM', LoadItemPayload>
  | Envelope<'EVENT', EventPayload>
  | Envelope<'TICK', TickPayload>
  | Envelope<'SERIALIZE_STATE', SerializeStatePayload>
  | Envelope<'DESTROY_ITEM', DestroyItemPayload>
  | Envelope<'RUN_SNIPPET', RunSnippetPayload>
  | Envelope<'SHUTDOWN', ShutdownPayload>;

export type WorkerMessage =
  | Envelope<'READY', ReadyPayload>
  | Envelope<'LOADED', LoadedPayload>
  | Envelope<'RENDER', RenderPayload>
  | Envelope<'PROGRESS', ProgressPayload>
  | Envelope<'PERSIST', PersistPayload>
  | Envelope<'STATE', StatePayload>
  | Envelope<'DESTROYED', DestroyedPayload>
  | Envelope<'SNIPPET_RESULT', SnippetResultPayload>
  | Envelope<'ERROR', ErrorPayload>
  | Envelope<'LOG', LogPayload>;
