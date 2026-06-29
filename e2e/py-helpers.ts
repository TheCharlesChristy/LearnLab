// Shared helpers for the @py-tagged e2e suite (AC-02/04/10).
//
// These tests drive the REAL pilot modules (public/content) against REAL
// Pyodide (CPython on WebAssembly, loaded from the pinned jsDelivr CDN —
// src/config.ts PYODIDE_BASE_URL). Pyodide is large and the CDN is reachable
// only on the open internet, so:
//
//   * In CI (GitHub Actions, open egress) the @py specs run end-to-end.
//   * Locally — and in any egress-restricted sandbox where cdn.jsdelivr.net is
//     blocked — they SKIP GRACEFULLY: skipUnlessPyodideReachable() probes the
//     pinned pyodide.js with a short timeout and calls test.skip() with a clear
//     "Pyodide unreachable" message, so `npm run test:e2e` stays green without
//     hard-failing on a network constraint outside the app's control.
//
// The fixture suite (AC-01/03/05/07) lives in helpers.ts and is unaffected.

import { test } from '@playwright/test';
import type { Page } from '@playwright/test';

// Mirror of src/config.ts (the e2e tsconfig does not include src/). Keep in
// sync: this is the exact CDN the worker loads Pyodide from (§6.2.4).
export const PYODIDE_VERSION = '0.27.7';
export const PYODIDE_BASE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
export const PYODIDE_PROBE_URL = `${PYODIDE_BASE_URL}pyodide.js`;

// Cold Pyodide load is slow (NFR-PY-001: ≤ 20 s cold). Use a generous ceiling
// for the runtime-loading card to resolve into rendered item UI.
export const PYODIDE_READY_TIMEOUT = 60_000;

let pyodideReachable: boolean | null = null;

/**
 * Probe the pinned pyodide.js once per worker. Returns true iff a short HEAD/GET
 * succeeds — i.e. the CDN is reachable and the @py specs can run for real.
 */
async function probePyodideReachable(): Promise<boolean> {
  if (pyodideReachable !== null) return pyodideReachable;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  try {
    const res = await fetch(PYODIDE_PROBE_URL, {
      method: 'GET',
      signal: controller.signal,
    });
    pyodideReachable = res.ok;
  } catch {
    pyodideReachable = false;
  } finally {
    clearTimeout(timer);
  }
  return pyodideReachable;
}

/**
 * Skip the current test unless real Pyodide is reachable. Call first in every
 * @py test/beforeEach. Keeps local runs green in egress-restricted sandboxes
 * (CRITICAL ENVIRONMENT CONSTRAINT — jsDelivr returns 403 here) while letting
 * CI exercise the full path.
 */
export async function skipUnlessPyodideReachable(): Promise<void> {
  const ok = await probePyodideReachable();
  test.skip(
    !ok,
    `Pyodide unreachable (${PYODIDE_PROBE_URL}). The @py suite needs the real ` +
      `Pyodide runtime; it runs in CI where jsDelivr is reachable. Skipping locally.`,
  );
}

// ---------------------------------------------------------------------------
// IndexedDB inspection — read the 'learnlab' Dexie DB via raw IndexedDB
// (mirrors progress-roundtrip.pw.ts dumpDb). Used to assert that a Python item
// recorded an attempts row (AC-02) and that offline progress writes land
// (AC-04), independent of any UI surfacing.
// ---------------------------------------------------------------------------

export interface AttemptRow {
  attemptId?: number;
  moduleId: string;
  itemId: string;
  kind: string;
  score: number;
  maxScore: number;
  startedAt: number;
  finishedAt: number;
  answers: unknown;
}

/** Read all `attempts` rows from the 'learnlab' DB. */
export function readAttempts(page: Page): Promise<AttemptRow[]> {
  return page.evaluate(async () => {
    const open = indexedDB.open('learnlab');
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => reject(open.error);
    });
    const rows = await new Promise<unknown[]>((resolve, reject) => {
      // The store may not exist yet if nothing has been written.
      if (!db.objectStoreNames.contains('attempts')) {
        resolve([]);
        return;
      }
      const req = db.transaction('attempts', 'readonly').objectStore('attempts').getAll();
      req.onsuccess = () => resolve(req.result as unknown[]);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return rows as AttemptRow[];
  });
}

/** Read all `moduleState` rows from the 'learnlab' DB. */
export function readModuleState(page: Page): Promise<Record<string, unknown>[]> {
  return page.evaluate(async () => {
    const open = indexedDB.open('learnlab');
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => reject(open.error);
    });
    const rows = await new Promise<unknown[]>((resolve, reject) => {
      if (!db.objectStoreNames.contains('moduleState')) {
        resolve([]);
        return;
      }
      const req = db.transaction('moduleState', 'readonly').objectStore('moduleState').getAll();
      req.onsuccess = () => resolve(req.result as unknown[]);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return rows as Record<string, unknown>[];
  });
}

// ---------------------------------------------------------------------------
// Power-rule quiz answer computation (reference item 6.13(a)).
//
// The generated Numeric questions read "If f(x)=a x^n, find f'(x0)" with the
// answer a*n*x0**(n-1) (per §6.13(a)). The numbers are seeded per attempt, so
// the test PARSES a, n, x0 from the rendered question text rather than assuming
// any order or value. The lone MCQ ("The derivative of a constant is…") is
// answered by selecting "0".
// ---------------------------------------------------------------------------

export interface PowerRuleNumeric {
  kind: 'numeric';
  answer: number;
}
export interface PowerRuleMcq {
  kind: 'mcq';
}
export type PowerRuleQuestion = PowerRuleNumeric | PowerRuleMcq;

/**
 * Classify and (for numeric) solve the currently rendered power-rule question
 * from its visible text. KaTeX keeps the rendered glyphs as text, so the
 * coefficients appear verbatim (e.g. "If f(x) = 3x4, find f′(1).").
 */
export function solvePowerRuleQuestion(renderedText: string): PowerRuleQuestion {
  const text = renderedText.replace(/\s+/g, ' ');
  if (/derivative of a constant/i.test(text)) {
    return { kind: 'mcq' };
  }
  // Match "f(x) = <a>x^<n>" then "f'(<x0>)". KaTeX may render the exponent
  // without a caret and the prime as ′ or '. Be liberal about separators.
  const coeff = /f\s*\(\s*x\s*\)\s*=\s*(\d+)\s*x\s*\^?\s*(\d+)/i.exec(text);
  const at = /f\s*['′]\s*\(\s*(\d+)\s*\)/i.exec(text);
  if (!coeff || !at) {
    throw new Error(`Could not parse power-rule question from: "${text}"`);
  }
  const a = Number(coeff[1]);
  const n = Number(coeff[2]);
  const x0 = Number(at[1]);
  return { kind: 'numeric', answer: a * n * x0 ** (n - 1) };
}
