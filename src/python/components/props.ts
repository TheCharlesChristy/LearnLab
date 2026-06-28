// Shared prop-reading helpers for the §6.7 component set.
//
// Every component reads its props from `node.props` (Record<string, PropValue>)
// where a PropValue is JSON-safe or a HandlerRef ({ __h: token }, §6.4 rule 2).
// These tiny readers keep each component honest about types under
// `strict`/`noUncheckedIndexedAccess` without scattering casts. All readers are
// total: a missing/wrong-typed prop falls back to the supplied default so a
// malformed tree degrades gracefully rather than throwing (the closed-set wire
// is author-trusted content, but defensive defaults match §6.4's "never crash"
// spirit).

import { isHandlerRef, type HandlerRef, type PropValue } from '../component-tree';
import type { JsonValue } from '../protocol';

type Props = Record<string, PropValue>;

export function str(props: Props, key: string, fallback = ''): string {
  const v = props[key];
  return typeof v === 'string' ? v : fallback;
}

export function optStr(props: Props, key: string): string | undefined {
  const v = props[key];
  return typeof v === 'string' ? v : undefined;
}

export function num(props: Props, key: string, fallback: number): number {
  const v = props[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

export function optNum(props: Props, key: string): number | undefined {
  const v = props[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

export function bool(props: Props, key: string, fallback: boolean): boolean {
  const v = props[key];
  return typeof v === 'boolean' ? v : fallback;
}

/** Read a handler-ref prop's token, or undefined when absent/not a handler. */
export function handler(props: Props, key: string): string | undefined {
  const v = props[key];
  return isHandlerRef(v) ? (v as HandlerRef).__h : undefined;
}

/** Read an array prop, or [] when absent/not an array. */
export function arr(props: Props, key: string): JsonValue[] {
  const v = props[key];
  return Array.isArray(v) ? v : [];
}

/** Read a list-of-strings prop (cells/options), coercing each entry to string. */
export function strList(props: Props, key: string): string[] {
  return arr(props, key).map((x) => (typeof x === 'string' ? x : String(x)));
}

/** Read a [lo, hi] numeric range prop, or undefined when absent/malformed. */
export function range(props: Props, key: string): [number, number] | undefined {
  const v = props[key];
  if (
    Array.isArray(v) &&
    v.length === 2 &&
    typeof v[0] === 'number' &&
    typeof v[1] === 'number' &&
    Number.isFinite(v[0]) &&
    Number.isFinite(v[1])
  ) {
    return [v[0], v[1]];
  }
  return undefined;
}

/** Render a scalar cell value (str | int | float) for the Table component. */
export function cellText(v: JsonValue): string {
  if (v === null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return JSON.stringify(v);
}
